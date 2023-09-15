const moment = require('moment');
const BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const { sendNotificationMail } = require('../api/mail');
const { getTemplate, createDynamicTemplate, deleteTemplate } = require('../api/oneschema');

// TODO Split into more files?
module.exports = BaseController.extend({
  name: 'ApiController',

  getUserBalance: async function(req, res, next) {
    try {
      const { session: { user } } = req;
      const balanceHolderId = user.parent_id || user.id;
      const balance = await DBBridge.CreditTransaction.get_credit_balance(balanceHolderId);
      return res.send({ status: 'Success', balance });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },

  createOneSchemaTemplate: async function(req, res, next) {
    try {
      const { query: { date, time } } = req;
      if (!date || !moment(date).isValid()) {
        res.status(404);
        return res.send({
          status: 'Error',
          msg: 'You must provide a valid date.',
        });
      }

      if (!time || !moment(time, ['HH:MM', 'hh:mm']).isValid()) {
        res.status(404);
        return res.send({
          status: 'Error',
          msg: 'You must provide a valid time.',
        });
      }
      
      const masterTemplate = await getTemplate(process.env.ONESCHEMA_TEMPLATE);
      const { response, name } = await createDynamicTemplate({ date, time, masterTemplate });
      if (response.status === 200 && name) {
        return res.send({ status: 'Success', name });
      } else {
        res.status(500);
        return res.send({
          status: 'Error',
          msg: response,
        });
      }
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },

  deleteOneSchemaTemplate: async function(req, res, next) {
    try {
      const { query: { templateKey } } = req;
      if (!templateKey) {
        res.status(404);
        return res.send({
          status: 'Error',
          msg: 'You must provide a template key',
        });
      }
      const response = deleteTemplate(templateKey);
      return res.send({ status: 'Success' });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: e,
      });
    }
  },

  // Copied from StepController, StepController can be deleted after we introduce new flow
  createCampaign: async function(req, res, next) {
    try {
      const { session: { user }, body: { campaignData } } = req;
      const price = campaignData.price;
      const numberOfContacts = campaignData.contacts.length;
      const creditsToEarmark = price * numberOfContacts;

      // Check if this user has enough credits
      // If current user is company child, use parent's savings
      const creditBalance = await DBBridge.CreditTransaction.get_credit_balance(
        user.parent_id || user.id
      );
      if (creditBalance >= creditsToEarmark) {
        const { campaign, contactsCount, pastDatesCount, newDeliveryDate } = await DBBridge.Campaign.create_campaign(
          user.id,
          campaignData,
          creditsToEarmark
        );
        const { collection: signatureCollection } = await DBBridge.SignatureCollection.get_collection_details(campaign.collection_id);

        await DBBridge.CreditTransaction.create_campaign_account({
          user_id: user.id,
          parent_id: user.parent_id,
          credit_amount: creditsToEarmark,
          comment: `Setting Up Campaign Account - campaign ${campaign.id} - campaign name: ${campaign.title} - contacts count: ${contactsCount} - collection: ${signatureCollection.title}`,
          campaign_id: campaign.id
        });

        const campaignLink = `${process.env.BASE_URL}/edit-campaign?cid=${campaign.id}`;
        await sendNotificationMail({
          content: `
            <p>New campaign <b>${campaign.title}</b> was just created!</p>
            ${pastDatesCount ? `<p style="color: red;">Delivery date of ${pastDatesCount} contacts was in the past. It was changed to: ${newDeliveryDate}</p>` : ''}
            <p><a href="${campaignLink}">View the campaign details</a></p>`, 
          subject: `New campaign created - ${campaign.title}`
        });

        return res.send({
          status: 'success',
          msg: 'New campaign created successfully.',
        });
      } else {
        console.log(
          'user ',
          user.id,
          ' lack of balance ',
          creditBalance
        );
        res.status(400);
        return res.send({
          status: 'insufficient-funds',
          msg:
            'Failed to create a campaign. You have a shortage of credit balance.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: err,
      });
    }
  },

  // TODO Remove
  placeholder: function(req, res, next) {
    return res.send({
      status: 'success',
      msg: 'This is just a temporary message!',
    });
  }
});