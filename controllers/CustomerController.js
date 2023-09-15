let View = require('../views/base');
let BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const { sequelize } = require('../models/sequelize');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const ConstData = require('../util/const_data');
const { hasProductTag, isProductShippable, getCountriesForDropdown } = require('../util/shopify_helper')
const { checkGiftPagesStatus, checkIfInactive } = require('../api/status');
const { getShopifyUrl, getCustomerLandingPath, getCampaignLandingPath } = require('../api/url');
const { getProductOptions } = require('../api/product');
const { checkIfMediaShouldBeDisplayed, getCampaignDataForRedemptionFlow } = require('../api/campaign');
const { getContactMessage } = require('../api/mail');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
  name: 'CustomerController',

  landing_page: async function (req, res, next) {
    const { query: { cid: contact_id, token, campaign: campaignId }, session } = req;
    const isMultipleRedemptionsFlow = !!campaignId;
    const { campaign, contact } = await getCampaignDataForRedemptionFlow({ contactId: contact_id, campaignId, isMultipleRedemptionsFlow });

    let isTokenCorrect = false;
    const shortUrlCampaigns = process.env.CAMPAIGNS_SHORT_URL ? process.env.CAMPAIGNS_SHORT_URL.split(',') : [];
    const isShortUrlCampaign = shortUrlCampaigns.includes(campaign.id.toString());

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const idToCheck = isMultipleRedemptionsFlow ? campaignId : contact_id;
        isTokenCorrect = decoded.id == idToCheck;
      } catch(e) {
        console.error(e);
        return next(e);
      }
    }

    if (!campaign || (!contact && !isMultipleRedemptionsFlow) || (token && !isTokenCorrect)) {
      return next(e);
    }

    const shouldRequestNewLink = !token && !isShortUrlCampaign;
    const { isRedeemed, isExpired, isActive } = checkGiftPagesStatus({
      step: contact?.step,
      campaign,
      shouldRequestNewLink,
    });
    const authenticationProvider = await campaign.getAuthenticationProvider();
    const isAuthenticatedCampaign = authenticationProvider ? true : false;
    const showAuthenticationInterstitial = isAuthenticatedCampaign && session.authenticated_campaign != campaign.id;
    const isInternationalCollection = campaign?.signatureCollection?.type === 'international';
    const showLocationInterstitial = !showAuthenticationInterstitial && isInternationalCollection && !session.intl_location;

    const country = Object.keys(ConstData.COUNTRIES).reduce((value, key) => {
      const entry = ConstData.COUNTRIES[key];

      if (entry.code === req.session.intl_location) {
        value = {
          ...entry,
          name: key,
        };
      }

      return value;
    }, {
      ...ConstData.COUNTRIES['United States'],
      name: 'United States',
    });

    if (isInternationalCollection) {
      campaign.products = campaign.products.filter(product => {

        // Always include donation products
        if (hasProductTag(product, 'donation')) {
          return true;
        }

        // Otherwise, confirm the customer's country matches the the product eligibility
        if (!product.shippable_countries) {
          return false;
        }

        return isProductShippable(product, session.intl_location);
      });
    }
    const shouldDisplayMedia = checkIfMediaShouldBeDisplayed(campaign);

    if (!isActive) {
      let v = new View(res, 'customer/gift-not-available');
      v.render({
        page_title: 'landing-inactive',
        page_type: 'customer-page',
        session,
        contact,
        campaign,
        isExpired,
        isRedeemed,
        shouldRequestNewLink,
        isInternationalCollection,
        getShopifyUrl,
        ...shouldDisplayMedia,
        isHotjarEnabled: true,
      });
    } else {
      campaign['message'] = getContactMessage(campaign['message'], contact);
      const singleProduct = campaign?.products?.length === 1 ?? false;

      let v = new View(res, 'customer/landing-page');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'landing',
        page_type: 'customer-page',
        contact,
        campaign,
        demo: false,
        ...shouldDisplayMedia,
        isAuthenticatedCampaign,
        showAuthenticationInterstitial,
        authenticationProvider,
        country,
        showLocationInterstitial,
        isInternationalCollection,
        activeLocation: session.intl_location,
        countries: getCountriesForDropdown(),
        isPreview: false,
        singleProduct,
        getShopifyUrl,
        sanitizeHtml,
        isHotjarEnabled: true,
      });
    }
  },

  gift_detail: async function (req, res, next) {
    const { query: { cid: contact_id, pid: product_id, campaign: campaignId } } = req;
    const isMultipleRedemptionsFlow = !!campaignId;
    const { campaign, contact } = await getCampaignDataForRedemptionFlow({ contactId: contact_id, campaignId, isMultipleRedemptionsFlow });
    const variants = await DBBridge.Product.get_variants({ product_id });
    const landingUrl = isMultipleRedemptionsFlow ? getCampaignLandingPath(campaignId) : getCustomerLandingPath({ isDemo: false, id: contact_id });
    const { isRedeemed, isExpired, isActive } = checkGiftPagesStatus({
      step: contact?.step,
      campaign,
      shouldRequestNewLink: false
    });

    if (!isActive) {
      let v = new View(res, 'customer/gift-not-available');
      v.render({
        page_title: 'gift-detail',
        page_type: 'customer-page',
        session: req.session,
        contact,
        campaign,
        isExpired,
        isRedeemed,
        getShopifyUrl
      });
    } else if (variants.length) {
      const { colorOptions, otherOptions } = getProductOptions(variants);
      const singleProduct = campaign?.products?.length === 1 ?? false;
      let v = new View(res, 'customer/gift-detail');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'gift-detail',
        page_type: 'customer-page',
        products: variants,
        colorOptions,
        otherOptions,
        cid: contact_id,
        campaign,
        demo: false,
        landingUrl,
        wellToldImages: ConstData.WELL_TOLD_IMAGES,
        states: ConstData.STATES,
        isMarketing: false,
        getShopifyUrl,
        singleProduct,
        isHotjarEnabled: true,
      });
    } else {
      return res.redirect('/404');
    }
  },

  gift_shipping: async function (req, res, next) {
    const { query: { cid: contact_id, vid: variant_id, hometown, coords, state, campaign: campaignId } } = req;
    const isMultipleRedemptionsFlow = !!campaignId;
    const { campaign, contact } = await getCampaignDataForRedemptionFlow({ contactId: contact_id, campaignId, isMultipleRedemptionsFlow });
    const variant = await DBBridge.Product.get_variant(variant_id);
    const landingUrl = isMultipleRedemptionsFlow ? getCampaignLandingPath(campaignId) : getCustomerLandingPath({ isDemo: false, id: contact_id });
    const { isRedeemed, isExpired, isActive } = checkGiftPagesStatus({
      step: contact?.step,
      campaign,
      shouldRequestNewLink: false,
    });

    const isInternationalCollection = campaign?.signatureCollection?.type === 'international';

    let address_format = 5;

    const country = Object.keys(ConstData.COUNTRIES).reduce((value, key) => {
      const entry = ConstData.COUNTRIES[key];

      if (entry.code === req.session.intl_location) {
        value = {
          ...entry,
          name: key,
        };
      }

      return value;
    }, {
      ...ConstData.COUNTRIES['United States'],
      name: 'United States',
    });

    if (isInternationalCollection) {
      address_format = country.address_format.edit;
    }

    if (!isActive) {
      let v = new View(res, 'customer/gift-not-available');
      v.render({
        page_title: 'gift-detail',
        page_type: 'customer-page',
        session: req.session,
        contact,
        campaign,
        isExpired,
        isRedeemed,
        getShopifyUrl
      });
    } else if (contact && variant) {
      let v = new View(res, 'customer/gift-shipping');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'gift-shipping',
        page_type: 'customer-page',
        contact,
        campaign,
        variant,
        hometown,
        coords,
        state,
        demo: false,
        landingUrl,
        addressFormat: address_format,
        country,
        POBoxesPattern: ConstData.PO_BOXES_PATTERN,
        namePattern: ConstData.NAME_PATTERN,
        uspsUser: process.env.USPS_USER,
        isInternationalCollection,
        isAddressVerificationEnabled: process.env.USPS_ADDRESS_VERIFICATION_ENABLED && !isInternationalCollection,
        states: ConstData.STATES,
        getShopifyUrl,
        isHotjarEnabled: true,
        isMultipleRedemptionsFlow,
      });
    }
  },
  // Customer confirm gift
  confirm_gift: async function (req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      let contact;
      const {
        body: {
          cid: contact_id,
          vid: variant_id,
          campaignId,
          first_name,
          last_name,
          address,
          apartment,
          city,
          state,
          zip_code,
          country,
          phone,
          hometown,
          coords,
          email,
          optionState
        },
      } = req;

      if (!email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
        return res.send({
          status: 'failed',
          msg: 'Invalid email address',
        });
      }

      // Validate against using PO Boxes in address field
      if (!ConstData.PO_BOXES_PATTERN.test(address)) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'You cannot use PO Box as your address',
        });
      }

      const campaign = await DBBridge.Campaign.get_one(
        null,
        campaignId,
        true
      );
      const isMultipleRedemptionsFlow = campaign && campaign['allow_multiple_redemptions'];

      if (isMultipleRedemptionsFlow) {
        if (campaign.price > campaign.campaignAccount['credit_amount']) {
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Sorry, this gift is no longer available!',
          });
        }
        contact = await DBBridge.Contact.createContactForMultipleRedemptionsCampaign({ data: req.body, transaction });
      } else {
        contact = await DBBridge.Contact.confirm_contact({
          data: {
            contact_id,
            variant_id,
            first_name,
            last_name,
            address,
            apartment,
            city,
            state,
            zip_code,
            country,
            phone,
            hometown,
            coords,
            email,
            optionState
          },
          transaction
        });
      }

      if (contact) {
        //Deduct from CampaignAccount
        const user = await campaign.getUser();
        await DBBridge.CreditTransaction.update_campaign_account_balance({
          user,
          amount: campaign.price,
          campaignId: campaign.id,
          transactionType: ConstData.WITHDRAWL_TRANSACTION,
          comment: `withdrawl - campaign ${campaign.id} - campaign name: ${campaign.title} - contact id: ${contact_id} - contact email: ${contact.to_email}`,
          transaction,
        });
        transaction.commit();

        res.status(200);
        return res.send({
          status: 'success',
          redirectPath: `/customer/gift-confirmation?cid=${contact.id}&vid=${variant_id}`,
        });
      } else {
        transaction.rollback();
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid contact information',
        });
      }
    } catch (err) {
      transaction.rollback();
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  gift_confirmation: async function (req, res, next) {
    const { query: { cid: contactId, vid: variantId } } = req;
    const contact = await DBBridge.Contact.getContactDetails({ id: contactId, isEmail: false });

    if (!contact) {
      return res.redirect('/404');
    }

    const isDonation = await DBBridge.Product.is_donation_product(variantId);
    const { isActive } = checkGiftPagesStatus({ step: contact.step, campaign: contact.campaign, shouldRequestNewLink: false });

    if (isActive) {
      const landingUrl = getCustomerLandingPath({ isDemo: false, id: contactId });
      return res.redirect(landingUrl);
    } else {
      let v = new View(res, 'customer/gift-confirmation');
      v.render({
        page_title: 'gift-confirmation',
        page_type: 'customer-page',
        session: req.session,
        i18n: res,
        cid: contactId,
        isDonation,
        demo: false,
        contact,
        getShopifyUrl,
        isHotjarEnabled: true,
      });
    }
  },

  gift_note_thank: async function (req, res, next) {
    const contact_id = req.query.cid;
    const contact = await DBBridge.Contact.getContactDetails({ id: contact_id, isEmail: false });
    if (!contact.thank_note) {
      let v = new View(res, 'customer/gift-note-thank');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'gift-note-thank',
        page_type: 'customer-page',
        cid: contact_id,
        demo: false,
        contact,
        getShopifyUrl,
        isHotjarEnabled: true,
      });
    } else {
      return res.redirect('/404');
    }
  },
  add_thank_note: async function (req, res, next) {
    try {
      const contact_id = req.body.cid;
      const thank_note = req.body.thank_note;
      const contact = await DBBridge.Contact.add_thank_note(
        contact_id,
        thank_note
      );

      if (contact) {
        return res.send({
          status: 'success',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid contact information.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },
  set_location: async function (req, res, next) {
    try {
      const {
        location,
      } = req.body;

      req.session.intl_location = location;

      return res.send({
          status: 'success',
          msg: 'Thank you!  Your location has been set.'
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
  authenticate_campaign: async function (req, res, next) {
    try {
      const {
        contactId,
        campaignId,
        providerId,
        token,
      } = req.body;

      // Evaluate the token relative to the provider and confirm its valid
      const authToken = await DBBridge.AuthenticationToken.get_unauthenticated_token(providerId, token);

      if (!authToken) {
        res.status(404);
        return res.send({
          status: 'failed',
          msg: 'Invalid token',
        });
      }

      // If there is an associated contact, that means it has been previously authenticated
      // once authenticated, the contact cannot be changed
      const contact = await authToken.getContact();

      // If the associated contact has confirmed/redeemed the gift, then the token is invalid
      if (contact && (contact.step == 'confirmed' || contact.step == 'redeemed')) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Token already redeemed',
        });
      }

      // Record the token authentication, associating the current contact
      await DBBridge.AuthenticationToken.set_token_authenticated(providerId, token, contactId);

      // Create session variable so the prompt for authentication does not need to be repeated
      req.session.authenticated_campaign = campaignId;

      return res.send({
          status: 'success',
          msg: 'Token validated'
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
  decline_gift: async function (req, res, next) {
    const { query: { token, preview } } = req;
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET) || {};

    if (!decodedToken.id) {
      return res.redirect('/404');
    }

    const contact = await DBBridge.Contact.getContactDetails({ id: decodedToken.id });

    if (!contact) {
      return res.redirect('/404');
    }

    const isStatusInactive = checkIfInactive(contact.step);

    let v = new View(res, 'customer/decline-gift');
    v.render({
      page_title: 'decline-gift',
      page_type: 'customer-page',
      session: req.session,
      i18n: res,
      cid: decodedToken.id,
      activeContact: !isStatusInactive,
      isPreview: !!preview,
    });
  },
  decline_contact: async function (req, res, next) {
    try {
      const contactId = req.body.contactId;
      const reason = req.body.reason;
      const reasonText = req.body.reasonText;
      const contact = await DBBridge.Contact.decline_contact({ contactId, reason, reasonText });

      if (!contact) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid contact information.',
        });
      }

      return res.send({
        status: 'success',
      })
    } catch (err) {
      console.error(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      })
    }
  },
});
