const { ForbiddenError } = require('@casl/ability');
let View = require('../views/base');
const BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');

const ConstData = require('../util/const_data');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
  name: 'CampaignController',

  create: async function (req, res, next) {
    try {
      const { query: { cid }, session: { user }, ability } = req;
      ForbiddenError.from(ability).throwUnlessCan('create', 'Campaign');
      let v = new View(res, 'client/campaign/create');

      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'campaign-create',
        page_type: 'campaign-page',
        isAdmin: user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER
        ,
        default_collection: cid || process.env.SHOPIFY_25_COLLECTION_ID,
        default_charity_collection: process.env.SHOPIFY_CHARITY_25_COLLECTION_ID,
        default_intl_collection: process.env.SHOPIFY_INTL_25_COLLECTION_ID
      });
    } catch(e) {
      next(e);
    }
  },

  getData: async function(req, res, next) {
    try {
      const { query: { cid }, session: { user } } = req;
      const userIds = [user['id'], user['parent_id']];
      const campaign = await DBBridge.Campaign.get_one(
        userIds,
        cid,
        user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER
      );
      const data = {
        id: campaign.id,
        title: campaign.title,
        landingMessage: campaign.message,
        emailMessage: campaign.email_message,
        subject: campaign.email_subject,
        logo: campaign.logo_url,
        includeLogoOnLanding: campaign.landing_include_logo,
        includeLogoInEmail: campaign.email_include_logo,
        includeGiftsForGoodLogo: campaign.email_include_gfg_logo,
        banner: campaign.banner_url,
        includeBannerOnLanding: campaign.landing_include_banner,
        includeBannerInEmail: campaign.email_include_banner,
        video: campaign.video_url,
        noEmailInvite: campaign.no_email_invite,
        allowMultipleRedemptions: campaign.allow_multiple_redemptions,
        signatureCollection: {
          type: campaign.signatureCollection.type
        }
      }
      return res.send({ status: 'Success', campaign: data });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },

  updateContent: async function (req, res, next) {
    try {
      const { body: { cid, type, value }, session: { user } } = req;
      const operationMap = {
        subject: 'update_campaign_email_subject',
        emailMessage: 'update_campaign_email_message',
        landingMessage: 'update_campaign_message',
      }
      const operation  = operationMap[type];
      if (
        operation && await DBBridge.Campaign[operation](
          [user.id, user.parent_id],
          cid,
          value,
          user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Successfully updated campaign content.',
        });
      } else {
        res.status(500);
        return res.send({
          status: 'failed',
          msg: 'Invalid campaign.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },
});
