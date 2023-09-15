let View = require('../views/base');
let Buffer = require('buffer');
const moment = require('moment');
const DBBridge = require('../models/bridge');
const BaseController = require('./BaseController');
const { sendNotificationMail } = require('../api/mail');
const ConstData = require('../util/const_data');
const { getGlobalTemplateData } = require('../api/template');


module.exports = BaseController.extend({
  name: 'StepController',

  gift_it_forward: async function (req, res, next) {
    try {
      const current_client = req.session.user;
      let collection_id = req.query.cid || '';
      let collection_type = req.query.ctype || 'signature';
      const offset = 0;
      let count = 20;
      let products = [];

      if (!collection_id) {
        collection_id = process.env.SHOPIFY_25_COLLECTION_ID;
        collection_type = 'signature';
      }

      if (collection_type === 'signature') {
        products = await DBBridge.SignatureCollection.list_products(
          collection_id,
          offset,
          count
        );
      } else if (collection_type === 'campaign') {
        products = await DBBridge.Campaign.list_products(
          current_client['id'],
          collection_id,
          offset,
          count
        );
      }
      const current_user = req.session.user;
      const collections = {
        signature: await DBBridge.SignatureCollection.list_all(
          false,
          null,
          null,
          current_user.type === ConstData.ADMIN_USER || current_user.type === ConstData.STANDARD_ADMIN_USER
        ),
        campaign: await DBBridge.Campaign.list_all({ user_id: current_client['id'], with_products: false }),
      };

      let v = new View(res, 'client/steps/step1');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'gift-it-forward',
        page_type: 'gift-step-page',
        collections,
        products,
        offset,
        count: products.length,
        cid: collection_id,
        ctype: collection_type,
        is_admin: current_user.type === ConstData.ADMIN_USER || current_user.type === ConstData.STANDARD_ADMIN_USER,
        isMarketing: false,
      });
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },
  show_more_products: async function (req, res, next) {
    try {
      const current_client = req.session.user;
      let offset = Number(req.body.offset) || 0;
      let count = Number(req.body.count) || 20;
      let collection_id = req.body.cid || '';
      let collection_type = req.body.ctype || 'signature';
      let products = [];

      if (!collection_id) {
        collection_id = process.env.SHOPIFY_25_COLLECTION_ID;
        collection_type = 'signature';
      }
      offset += count;

      if (collection_type === 'signature') {
        products = await DBBridge.SignatureCollection.list_products(
          collection_id,
          offset,
          count
        );
      } else if (collection_type === 'campaign') {
        products = await DBBridge.Campaign.list_products(
          current_client['id'],
          collection_id,
          offset,
          count
        );
      }

      return res.send({
        status: 'success',
        products,
        offset,
        count: products.length,
      });
    } catch (err) {
      console.log(err);
      return res.send({ status: 'failed', products: [] });
    }
  },

  recipient_information: async function (req, res, next) {
    const current_client = req.session.user;
    let v = new View(res, 'client/steps/step2');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'recipient-information',
      page_type: 'gift-step-page',
      client: {
        first_name: current_client['firstname'],
        last_name: current_client['lastname'],
        company_name: current_client['company'],
        email: current_client['email'],
      },
    });
  },

  brand_message: async function (req, res, next) {
    let v = new View(res, 'client/steps/step3');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'brand-message',
      page_type: 'gift-step-page',
      site_link: process.env.BASE_URL,
      moment: moment
    });
  },

  confirm_details: async function (req, res, next) {
    let v = new View(res, 'client/steps/step4');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'confirm-details',
      page_type: 'gift-step-page',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      Buffer: Buffer,
    });
  },

  save_campaign: async function (req, res, next) {
    try {
      const current_user = req.session.user;
      const savingsHolderId = current_user.parent_id || current_user.id;
      const campaign_data = JSON.parse(req.body.campaign_data);
      const price = campaign_data['price']
      const number_of_contacts = campaign_data['contacts'].length
      const credits_to_earmark = price * number_of_contacts

      if (price <= 0) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Campaign price cannot be equal to 0. Please, choose another collection.',
        });
      }

      // Check if this user has enough credits
      const credit_balance = await DBBridge.CreditTransaction.get_credit_balance(
        savingsHolderId
      );
      if (credit_balance >= credits_to_earmark) {
        const { campaign, contactsCount, pastDatesCount } = await DBBridge.Campaign.create_campaign(
          current_user['id'],
          campaign_data,
          credits_to_earmark
        );

        const { collection: signatureCollection } = await DBBridge.SignatureCollection.get_collection_details(campaign.collection_id);


        await DBBridge.CreditTransaction.create_campaign_account({
          user_id: current_user['id'],
          parent_id: current_user['parent_id'],
          credit_amount: credits_to_earmark,
          comment: `Setting Up Campaign Account -  campaign ${campaign.id} - campaign name: ${campaign.title} - contacts count: ${contactsCount} - collection: ${signatureCollection.title}`,
          campaign_id: campaign['id'],
        });

        const campaignLink = `${process.env.BASE_URL}/edit-campaign?cid=${campaign.id}`;
        await sendNotificationMail({
          content: `<p>New campaign <b>${campaign.title}</b> was just created!</p><p><a href="${campaignLink}">View the campaign details</a></p>`, 
          subject: `New campaign created - ${campaign.title}`
        });

        return res.send({
          status: 'success',
          msg: 'New campaign created successfully.',
        });
      } else {
        console.log(
          'user ',
          current_user['id'],
          ' lack of balance ',
          credit_balance
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
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Failed to save campaign.',
      });
    }
  },

  confirmed_order: async function (req, res, next) {
    let v = new View(res, 'client/steps/confirmed-order');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'confirmed-order',
      page_type: 'gift-step-page',
    });
  }
});
