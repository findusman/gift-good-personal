let View = require('../views/base');
const { ForbiddenError } = require('@casl/ability');

const BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
let moment = require('moment');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
  name: 'CreditTransactionController',

  list_credits: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Credit');
      const current_user = req.session.user;
      // Get history of all transactions in the company account
      const userIds = req.session.companyUsers;
      // Get savings of parent company user
      const savingsHolderId = current_user['parent_id'] || current_user['id'];
      const transaction_history =
        await DBBridge.CreditTransaction.get_stripe_transaction_history(
          userIds
        );
      const credit_balance =
        await DBBridge.CreditTransaction.get_credit_balance(savingsHolderId);
      const redeemed_contacts = await DBBridge.Contact.get_redeemed_contacts(userIds);
      const credit_accounts = await DBBridge.CreditTransaction.credit_accounts(
        userIds
      );

      let v = new View(res, 'client/dashboard/client-buy-credits');
      const remaining_amount_array = credit_accounts.map(
        (account) => account.credit_amount
      );
      const total_unredeemed_credits = remaining_amount_array.reduce(
        (a, b) => a + b,
        0
      );
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-buy-credits',
        page_type: 'client-dashboard-page',
        credit_accounts,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        transaction_history,
        credit_balance,
        redeemed_count: redeemed_contacts.length,
        total_unredeemed_credits,
        moment: moment,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  paymentIntent: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Credit');
      const { price, credit } = req.body;
      const currentUser = req.session.user;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: 'usd',
        receipt_email: currentUser ? currentUser.email : ''
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch(e) {
      res.send({
        status: 'failed',
        msg: e,
      });
    }
  },
  // This is used in admin panel, as well as an in redesigned version of "send gift"
  purchase: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Credit');
      const current_user = req.session.user;
      await DBBridge.CreditTransaction.purchase_user_credit(
        current_user['parent_id'] || current_user['id'],
        req.body.credit,
        req.body.price,
        req.body.stripeId
      );
      return res.send({
        status: 'success',
        msg: 'Credits have been added to the account',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: err,
      });
    }
  },

  updateCreditTransaction: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Credit');
      const user_id = req.body.uid;
      const credits = Number.parseInt(req.body.credits);
      if (isNaN(credits) || credits < 0) {
        res.status(400);
        return res.send({
          status: "failed",
          msg: "Credits is required and must be a positive number",
        });
      }

      const comment = req.body.comment;
      if (!comment || comment.length === 0) {
        res.status(400);
        return res.send({
          status: "failed",
          msg: "Comment is required",
        });
      }
      // Company child doesn't have own savings, get parent id as well
      const user = await DBBridge.User.findById(user_id);
      if (!user) {
        return res.send({
          status: "failed",
          msg: "User not found",
        });
      }

      await DBBridge.CreditTransaction.update_savings_account_balance({
        user_id,
        parent_id: user.parent_id,
        credit_amount: credits,
        comment,
        createCreditTransaction: true,
      });
      return res.send({
        status: 'success',
        msg: "User's credit amount updated",
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: err,
      });
    }
  },

  donateCredits: async function(req, res, next) {
    const { body: { campaignId } } = req;
    try {
      await DBBridge.Donation.donate({ campaignId });
      return res.send({
        status: 'success',
      });
    } catch(err) {
      res.status(400);
      return res.send({
        status: 'failed',
        msg: err,
      });
    }
  },

  moveDonationsToSavings: async function(req, res, next) {
    const { body: { campaignId, userId } } = req;
    try {
      await DBBridge.Donation.moveDonationBackToSavings({ campaignId, userId });
      return res.send({
        status: 'success',
      });
    } catch(err) {
      res.status(400);
      return res.send({
        status: 'failed',
        msg: err,
      });
    }
  }
});
