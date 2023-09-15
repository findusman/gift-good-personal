let BaseController = require('./BaseController');
const { sendMail, sendGiftCampaign, sendInitialGiftMail } = require('../api/mail');
const { parseHrtime } = require('../api/time');
const { pullProducts, createOrders, trackOrders } = require('../api/shopify');
const { hydrateReminderMessage } = require('../api/message');
const DBBridge = require('../models/bridge');

const db = require('../models/sequelize');
const moment = require('moment');

module.exports = BaseController.extend({
  name: 'CronController',

  shopify_job: async function (req, res, next) {
    try {
      const date = new Date();
      const current_hour = date.getHours();
      const current_minute = date.getMinutes();

      const cronStartTime = process.hrtime();
      console.log('Shopify cron job has been started.');

      try {
        if (await DBBridge.Setting.check_cron_status('cron_running')) {
          console.log('shopify cron job is already running.');
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Cron job is alredy running.',
          });
        } else {
          await DBBridge.Setting.set_cron_status(true, 'cron_running');
        }

        res.send({
          status: 'success',
          msg: 'Cron job has been started.',
        });

        // Make sure this condition won't get executed more than once every 8 hours.
        // We need minutes to ensure this condition only runs once when current_hour % 8 === 0.
        if (current_hour % 2 === 0 && current_minute === 0) {
          await pullProducts(true);
          await trackOrders();
        } else {
          // await pullProducts(false);
          await pullProducts(true);
        }
      } catch (err) {
        console.log('Exception in shopify cron job main module => ', err);
      }

      await DBBridge.Setting.set_cron_status(false, 'cron_running');

      console.log('Shopify cron job has been finished.');
      console.log(`Elapsed time in Shopify cron job is ${parseHrtime(cronStartTime)}`);
    } catch (err) {
      console.log('Exception in shopify cron job => ', err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  createOrders: async function(req, res, next) {
    const cronStartTime = process.hrtime();
    try {
      if (await DBBridge.Setting.check_cron_status('orders_cron_running')) {
        console.log('Shopify create orders cron job is running.')
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Cron job is alredy running.',
        });
      } else {
        await DBBridge.Setting.set_cron_status(true, 'orders_cron_running');
      }

      res.send({
        status: 'success',
        msg: 'Cron job has been started.',
      });

      await createOrders();
      console.log('Shopify create orders cron job has been finished.');
      console.log(`Elapsed time in Shopify create orders cron job is ${parseHrtime(cronStartTime)}`);
      await DBBridge.Setting.set_cron_status(false, 'orders_cron_running');
    } catch(e) {
      await DBBridge.Setting.set_cron_status(false, 'orders_cron_running');
      console.error(`Exception in Shopify create order cron: ${e}`);
    }
  },

  // Campaign email reminder cron job
  reminder_job: async function (req, res, next) {
    try {
      console.log('Reminder cron job has been started.');
      const unredeemedContacts =
        await DBBridge.Contact.get_sent_unredeemed_contacts();

      const contacts = unredeemedContacts.map(contact => {
        const { 
          reminderNumber, 
          subject, 
          content, 
          dataValues: { id, to_email, to_first_name, from_first_name, from_company_name, from_email },
          campaign,
          campaign: { dataValues: { expire_date: campaignExpireDate } },
          shortUrl,
        } = contact;

        return {
          id,
          to_email,
          to_first_name,
          from_company_name,
          from_first_name,
          template_id: process.env.SENDGRID_REMINDER_1_EMAIL_ID,
          reminder_type: `reminder${reminderNumber}`,
          subject: hydrateReminderMessage(subject, contact.dataValues),
          content: hydrateReminderMessage(content, contact.dataValues),
          from_email,
          campaign: campaign.dataValues,
          expire_date: moment(campaignExpireDate).format('MM/DD/YYYY'),
          shortUrl: shortUrl.dataValues,
          singleProduct: campaign.single_product,
        }
      });

      console.log(
        'Reminder cron job starts sending email ==> total count ',
        contacts.length
      );

      let sent_count = 0,
        failed_count = 0;
      for (let i = 0; i < contacts.length; i = i + 20) {
        const sub_contacts = contacts.slice(
          i,
          Math.min(i + 20, contacts.length)
        );
        console.log(
          'Reminder email sending from index ',
          i,
          ' count ',
          sub_contacts.length
        );
        if (
          await sendMail({
            type: 'send-reminder',
            contacts: sub_contacts,
          })
        ) {
          await DBBridge.Contact.sent_reminder_to_unreedemed_contacts(
            sub_contacts
          );
          sent_count += sub_contacts.length;
        } else {
          failed_count += sub_contacts.length;
        }
        console.log(
          'reminder:: triggered email list ==> ',
          sub_contacts.map(
            (contact) => contact['to_email'] + '==>' + contact['reminder_type']
          )
        );
      }

      console.log(
        'Reminder cron job finished: sent ==> ',
        sent_count,
        ' failed ==> ',
        failed_count
      );

      res.send({
        status: 'success',
        msg: 'Reminder cron job has been started.',
      });
    } catch (err) {
      console.log('Exception in reminder cron job => ', err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  // scheduled Campaign cron job
  scheduled_campaign_job: async function (req, res, next) {
    try {
      console.log('Send gift cron job has been started.');
      // First: send scheduled campaigns (only contacts that don't have delivery date set individually)
      const campaigns =
        await DBBridge.Campaign.get_todays_scheduled_campaigns() || [];

      campaigns.forEach((campaign) => {
        console.log('Sending Campaign:', campaign.id);
        sendGiftCampaign({ campaignId: campaign.id, includeContactsWithDeliveryDate: false });
      });

      const scheduledContacts = await DBBridge.Contact.getScheduledContacts();
      const ccEnabledInScheduledContacts = scheduledContacts.map((contact) => ({
        id: contact.id,
        ccEnabled: contact.campaign.cc_email
      }));

      if (scheduledContacts && scheduledContacts.length) {
        await sendInitialGiftMail({
          contacts: scheduledContacts,
          enabledCCContacts: ccEnabledInScheduledContacts
        });
        await DBBridge.Contact.gift_email_sent(scheduledContacts);
        scheduledContacts.forEach(contact => {
          if (!contact.campaign.is_sent) {
            DBBridge.Campaign.update_campaign_sent(contact.campaign.id);
          }
        });
      }

      res.send({
        status: 'success',
        msg: 'Scheduled campaign cron job has been started.',
      });
    } catch (err) {
      console.log('Exception in scheduled campaign cron job => ', err);
    }
  },

  close_campaign_accounts: async function (req, res, next) {
    try {
      console.log('close_campaign_accounts job started');
      await DBBridge.CreditTransaction.close_campaign_accounts();
      res.send({
        status: 'success',
        msg: 'Reminder cron job has been started.',
      });
    } catch (err) {
      console.log('Exception in close_campaign_accounts cron job => ', err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
});
