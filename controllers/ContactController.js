let View = require('../views/base');
let BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const { useTimezone, isPastDate } = require('../api/time');
const { checkIfRedeemed } = require('../api/status');
const db = require('../models/sequelize');
const ConstData = require('../util/const_data');

module.exports = BaseController.extend({
  name: 'ContactController',
  update: async function (req, res, next) {
    try {
      const contact = {
        ...req.body,
        delivery_date: useTimezone(req.body.delivery_date)
      }
      await DBBridge.Contact.update(contact);
      res.status(200);
      return res.send({
        status: 'success',
        msg: 'Contact updated successfuly.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
  reactivate: async function(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const contactId = req.body.id;
      if (!contactId) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid operation',
        });
      }

      const contact = await DBBridge.Contact.getContactDetails({ id: req.body.id, isEmail: false });
      if (!contact) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Contact doesn\'t exist',
        });
      }

      if (contact.step === 'reactivated') {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Contact is already reactivated',
        });
      }

      if (!checkIfRedeemed(contact.step) && !isPastDate(contact.campaign.expire_date)) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'You cannot reactivate active contact on live campaign',
        });
      }

      const result = await DBBridge.Contact.update(req.body);
      if (!result || result.length === 0) {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Contact doesn\'t exist',
        });
      }
      const isActiveOnExpiredCampaign = !checkIfRedeemed(contact.step) && isPastDate(contact.campaign.expire_date);
      const campaign = await DBBridge.Campaign.get_one(
        null,
        contact.campaign.id,
        true
      );
      if (isActiveOnExpiredCampaign) {
        const currentSavingsAmount = await DBBridge.CreditTransaction.get_credit_balance(campaign.user.parent_id || campaign.userId);
        if (currentSavingsAmount >= campaign.price) {
          await DBBridge.CreditTransaction.transfer_from_savings_to_campaign({
            amount: campaign.price,
            campaignId: campaign.id,
            comment: `reactivate contact on expired campaign - campaign ${campaign.id} - contact ${contact.id}`,
            transaction,
            balanceHolderId: campaign.user.parent_id || campaign.userId,
          });
        } else {
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'User doesn\'t have enough credits',
          });
        }
      } else {
        const user = await campaign.getUser();
        await DBBridge.CreditTransaction.update_campaign_account_balance({
          user,
          amount: campaign.price,
          campaignId: campaign.id,
          transactionType: ConstData.DEPOSIT_TRANSACTION,
          comment: `reactive contact - campaign ${campaign.id} - campaign name: ${campaign.title} - contact id: ${contact.id} - contact email: ${contact.to_email}`,
          transaction,
        });
      }
      transaction.commit();
      res.status(200);
      return res.send({
        status: 'success',
        msg: 'Contact reseted successfuly.',
      });
    } catch (err) {
      transaction.rollback();
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
  reactivateAll: async function(req, res, next) {
    try {
      const campaignId = req.body.campaignId;
      const failedContacts = await DBBridge.Contact.getAllFailedContacts(campaignId);
      const ids = failedContacts.map(el => el.id);
      const campaign = await DBBridge.Campaign.get_one(
        null,
        campaignId,
        true
      );
      if (failedContacts.length && campaign) {
        const amount = failedContacts.length * campaign.price;
        const result = await DBBridge.Contact.batchReactivateContacts(ids);
        if (result) {
          const user = await campaign.getUser();
          await DBBridge.CreditTransaction.update_campaign_account_balance({
            user,
            amount,
            campaignId: campaign.id,
            transactionType: ConstData.DEPOSIT_TRANSACTION,
            comment: `reactive all contacts - campaign ${campaign.id} - campaign name: ${campaign.title}`,
          });
        }
      } else {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Resource doesn\'t exist.',
        });
      }
      res.status(200);
      return res.send({
        status: 'success',
        msg: 'Contact updated successfuly.',
      });
    } catch(e) {
      console.error(e);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
  expire: async function (req, res, next) {
    try {
      let contact = await DBBridge.Contact.getContactDetails({ id: req.body.id, isEmail: false });
      if (contact) {
        await DBBridge.Contact.update(req.body);
        const campaign = await DBBridge.Campaign.get_one(
          null,
          contact.campaign.id,
          true
        );
        await DBBridge.CreditTransaction.transfer_from_campaign_to_savings({
          amount: campaign.price,
          campaignId: campaign.id,
          commentPrefix: 'expire contact',
          commentSuffix: `contact id: ${contact.id} - contact email: ${contact.to_email}`,
        });
        res.status(200);
        return res.send({
          status: 'success',
          msg: 'Contact expired successfuly.',
        });
      } else {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Contact doesn\'t exist',
        });
      }
    } catch (err) {
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
  unexpire: async function (req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const contact = await DBBridge.Contact.getContactDetails({ id: req.body.id, isEmail: false });
      if (contact && !contact.confirmed_at) {
        const newStatus = contact.sent_at ? 'sent' : 'ready';
        const campaign = await DBBridge.Campaign.get_one(
          null,
          contact.campaign.id,
          true
        );
        const currentSavingsAmount = await DBBridge.CreditTransaction.get_credit_balance(campaign.user.parent_id || campaign.userId);
        if (currentSavingsAmount > campaign.price) {
          await contact.update({
            step: newStatus
          }, { transaction });

          await DBBridge.CreditTransaction.transfer_from_savings_to_campaign({
            amount: campaign.price,
            campaignId: campaign.id,
            balanceHolderId: campaign.userId,
            comment: `unexpire contact - campaign ${campaign.id} - contact name: ${contact.title} - contact email: ${contact.to_email}`,
            transaction,
          });

          transaction.commit();
          res.status(200);
          return res.send({
            status: 'success',
            msg: 'Contact updated successfuly.',
          });
        } else {
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Please ensure User has enough credits',
          });
        }
      } else {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Contact doesn\'t exist',
        });
      }
    } catch (err) {
      transaction.rollback();
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
  delete: async function (req, res, next) {
    try {
      const contactId = req.params.contactId;
      const campaignId = req.body.campaign_id;
      const campaign = await DBBridge.Campaign.get_one(
        null,
        campaignId,
        true
      );
      const contact = await DBBridge.Contact.getContactDetails({ id: contactId, isEmail: false });
      if (!contact || !campaign) {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Invalid operation',
        });
      }

      await DBBridge.CreditTransaction.transfer_from_campaign_to_savings({
        amount: campaign.price,
        campaignId: campaign.id,
        commentPrefix: 'remove contact',
        commentSuffix: `contact id: ${contactId} - contact email: ${contact.to_email}`,
      });
      await DBBridge.Contact.delete(req.params.contactId);

      res.status(200);
      return res.send({
        status: 'success',
        msg: 'Contact deleted successfuly.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
});
