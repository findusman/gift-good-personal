const View = require('../views/base');
const BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const { getShopifyUrl } = require('../api/url');
const { getContactMessage } = require('../api/mail');
const { checkIfMediaShouldBeDisplayed } = require('../api/campaign');
const { getGlobalTemplateData } = require('../api/template');
const sanitizeHtml = require('sanitize-html');
const jwt = require('jsonwebtoken');

const getDeclineGiftUrl = (contact, isPreview) => {
  const urlToken = jwt.sign({ id: contact ? contact['id'] : 0 }, process.env.JWT_SECRET);
  return `/customer/decline-gift?token=${urlToken}${isPreview ? '&preview=1' : ''}`;
}

module.exports = BaseController.extend({
  name: 'PreviewController',

  preview_landing_page: async function (req, res, next) {
    try {
      let campaign;
      const where_preview = req.query.where;
      let from_first_name = '',
        from_company_name = '',
        message = '',
        video_url = '',
        logo_url = '',
        banner_url = '',
        products = [],
        shouldDisplayMedia = {};

      let preview_info = {};
      // View landing page from step4 page
      if (where_preview === 'step' || where_preview === 'create') {
        const source = where_preview === 'step' ? req.query : req.body;
        from_first_name = source.from_first_name
          ? decodeURIComponent(source.from_first_name)
          : '';
        from_company_name = source.from_company_name
          ? decodeURIComponent(source.from_company_name)
          : '';
        if (source.message) {
          message = source.contact
            ? getContactMessage(source.message, source.contact)
            : decodeURIComponent(source.message);
        }
        video_url = source.video_url ? decodeURIComponent(source.video_url) : '';
        logo_url = source.logo_url ? decodeURIComponent(source.logo_url) : '';
        banner_url = source.banner_url ? decodeURIComponent(source.banner_url) : '';
        shouldDisplayMedia = checkIfMediaShouldBeDisplayed(source);
        const collectionId = source.collection;
        if (collectionId) {
          products = await DBBridge.SignatureCollection.list_products(collectionId);
        } else if (source.products) {
          const products_ids = source.products.split(',');
          products = await DBBridge.Product.get_products(products_ids);
        }
        preview_info = {
          from_first_name,
          from_company_name,
        };
        campaign = {
          message,
          video_url,
          logo_url,
          banner_url,
          products,
          isCollectionType: !!collectionId,
        };
      }
      // View landing page from dashboard Campaigns page
      else if (where_preview === 'dashboard') {
        const current_user = req.session.user;
        const campaign_id = req.query.cid;
        const one_contact = await DBBridge.Contact.choose_one_contact(
          campaign_id
        );
        campaign = await DBBridge.Campaign.get_preview_info(campaign_id);

        if (campaign) {
          const contact = one_contact || {
            'from_first_name': current_user ? current_user.firstname : '',
            'from_company_name': current_user ? current_user.company : ''
          }
          campaign.message = getContactMessage(campaign.message, contact);
          shouldDisplayMedia = checkIfMediaShouldBeDisplayed(campaign);
        } else {
          return res.redirect('/404');
        }
      } else if (where_preview === 'demo') {
        preview_info = await DBBridge.DemoCampaign.get_landing_page_preview();
        shouldDisplayMedia = checkIfMediaShouldBeDisplayed(campaign);
      }

      if (campaign) {
        const singleProduct = campaign?.products?.length === 1 ?? false;

        let v = new View(res, 'customer/landing-page');
        v.render({
          ...getGlobalTemplateData(req, res),
          page_title: 'landing-preview',
          page_type: 'customer-page',
          contact: preview_info,
          ...shouldDisplayMedia,
          campaign,
          isInternationalCollection: false,
          showLocationInterstitial: false,
          showAuthenticationInterstitial: false,
          isPreview: true,
          demo: false,
          singleProduct,
          getShopifyUrl,
          sanitizeHtml
        });
      } else {
        return res.redirect('/404');
      }
    } catch(e) {
      console.error(e);
      next(e);
    }
  },

  preview_campaign_email: async function (req, res, next) {
    const where_preview = req.query.where;
    let params = {};
    let shouldDisplayMedia = {};
    let singleProduct = false;
    const isCollectionType  = req.body.collection;
    if (where_preview === 'step' || where_preview === 'create') {
      const source = where_preview === 'step' ? req.query : req.body;
      let message = '';
      const sender_name = source.snd_name
        ? decodeURIComponent(source.snd_name)
        : '';
      const sender_company = source.snd_company
        ? decodeURIComponent(source.snd_company)
        : '';
      const receiver_name = source.rec_name
        ? decodeURIComponent(source.rec_name)
        : '';
      if (source.message) {
        message = source.contact ? getContactMessage(source.message, source.contact) : decodeURIComponent(source.message);
      }
      const video = source.video ? decodeURIComponent(source.video) : '';
      const logo = source.logo ? decodeURIComponent(source.logo) : process.env.BASE_URL + '/resources/images/logo.svg';
      const banner = source.banner ? decodeURIComponent(source.banner) : '';
      const gfgLogo = source.showGFGLogo ? `${process.env.BASE_URL}/resources/images/logo.svg` : '';
      shouldDisplayMedia = checkIfMediaShouldBeDisplayed(source, true);
      params = {
        sender_name,
        sender_company,
        receiver_name,
        message,
        video,
        logo,
        banner,
        gfgLogo
      };
    } else if (where_preview === 'dashboard') {
      const campaign_id = req.query.cid;
      const one_contact = await DBBridge.Contact.choose_one_contact(
        campaign_id
      );

      if (one_contact) {
        const message = one_contact['campaign']['email_message'] || one_contact['campaign']['message'];
        singleProduct = one_contact['campaign']['single_product'] ?? false;
        params = {
          sender_name: one_contact['from_first_name'],
          sender_company: one_contact['from_company_name'],
          receiver_name: one_contact['to_first_name'],
          message:
            getContactMessage(message, one_contact),
          video: one_contact['campaign']['video_url'],
          logo: one_contact['campaign']['logo_url'],
          banner: one_contact['campaign']['banner_url'],
          gfgLogo: one_contact['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.svg` : '',
          singleProduct,
          declineGiftUrl: getDeclineGiftUrl(one_contact, true),
        };
      }
      shouldDisplayMedia = checkIfMediaShouldBeDisplayed(one_contact['campaign'], true);
    } else if (where_preview === 'demo') {
      params = await DBBridge.DemoCampaign.get_campaign_email_preview();
    }

    const appSettings = await DBBridge.Setting.getSettings();
    // Show email in v2 if new "Send gift" is enabled or you are previewing from new "Send gift"
    const isNewSendGiftEnabled = appSettings.enable_new_send_gift || isCollectionType;

    if (params && Object.keys(params).length > 0) {
      let v = new View(res, `client/email_templates/${isNewSendGiftEnabled ? 'preview-email-new' : 'preview-email'}`);
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'preview-email',
        page_type: 'email-template',
        ...params,
        ...shouldDisplayMedia,
        sanitizeHtml,
        singleProduct,
        declineGiftUrl: getDeclineGiftUrl(null, true),
      });
    } else {
      return res.redirect('/404');
    }
  },
});
