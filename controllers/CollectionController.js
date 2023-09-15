const moment = require('moment');
const { ForbiddenError } = require('@casl/ability');
let View = require('../views/base');
const db = require('../models/sequelize');
let BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');
const ConstData = require('../util/const_data');
const parseToCsv = require('../util/parse_to_csv');
const sanitizeHtml = require('sanitize-html');
const { getShopifyUrl, getCustomerLandingPath, getCustomerLandingShortUrl, getCampaignLandingPath } = require('../api/url');
const { sendNotificationMail } = require('../api/mail');
const { getProductOptions } = require('../api/product');
const { checkIfMediaShouldBeDisplayed } = require('../api/campaign');
const { getGlobalTemplateData } = require('../api/template');
const { getAvailableCompanyUsers } = require('../api/acl');
const { hydrateReminderMessage } = require('../api/message');
const { statusHelper } = require('../api/status');

module.exports = BaseController.extend({
  name: 'CollectionController',

  delete_collection: async function (req, res, next) {
    try {
      const collection_id = req.body.cid;
      if (
        await DBBridge.SignatureCollection.update_collection(collection_id, {
          enabled: false,
        })
      ) {
        return res.send({
          status: 'success',
          msg: 'Deleted collection successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid collection.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  update_collection: async function (req, res, next) {
    try {
      const collection_id = req.body.cid;
      const data = {};

      if (req.body.type) {
        data.type = req.body.type;
      }

      if (req.body.price) {
        data.price = req.body.price;
      }

      if (req.body.title) {
        data.title = req.body.title;
      }

      if (req.body.title_short) {
        data.title_short = req.body.title_short;
      }

      if (req.body.title_long) {
        data.title_long = req.body.title_long;
      }

      if (typeof req.body.title_dropdown === 'string') {
        data.title_dropdown = req.body.title_dropdown;
      }

      await DBBridge.SignatureCollection.update_collection(collection_id, data);
      return res.send({
        status: 'success',
        msg: `Collection has been updated`,
        data
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

  update_internal: async function (req, res, next) {
    try {
      const campaign_id = req.body.cid;
      const is_internal = req.body.internal;
      await DBBridge.SignatureCollection.update_collection(campaign_id, {
        internal: is_internal,
      });
      return res.send({
        status: 'success',
        msg: 'Collection status has been changed',
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

  update_campaign: async function (req, res, next) {
    try {
      const campaign_id = req.body.cid;
      const action_type = req.body.type;
      const current_client = req.session.user;

      const updateData = function () {
        switch (action_type) {
          case 'remove-campaign':
            ForbiddenError.from(req.ability).throwUnlessCan('delete', 'Campaign');
            closePrevAccount(campaign_id);
            return { enabled: false };
          case 'archive-campaign':
            ForbiddenError.from(req.ability).throwUnlessCan('delete', 'Campaign');
            return { archived: true };
          case 'unarchive-campaign':
            return { archived: false };
          case 'update':
            if (req.body.media == 'banner') {
              const {
                includeBannerOnLanding,
                includeBannerInEmail,
              } = req.body.data;

              return {
                banner_url: req.body.media_url,
                landing_include_banner: !!includeBannerOnLanding,
                email_include_banner: !!includeBannerInEmail,
              };
            } else if (req.body.media == 'logo') {
              const {
                includeLogoOnLanding,
                includeLogoInEmail,
                includeGiftsForGoodLogo
              } = req.body.data;

              return {
                logo_url: req.body.media_url,
                landing_include_logo: !!includeLogoOnLanding,
                email_include_logo: !!includeLogoInEmail,
                email_include_gfg_logo: !!includeGiftsForGoodLogo,
              };
            } else return { video_url: req.body.media_url };
          default: {
          }
        }
      };

      if (
        await DBBridge.Campaign.update_campaign(
          campaign_id,
          current_client['id'],
          updateData(),
          current_client['type'] === ConstData.ADMIN_USER || current_client['type'] === ConstData.STANDARD_ADMIN_USER
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Updated campaign successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid collection.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  duplicate_campaign: async function (req, res, next) {
    try {
      const campaign_id = req.body.cid;
      const current_client = req.session.user;
      const result = await DBBridge.Campaign.duplicateCampaign(campaign_id, current_client.id);
      if (result.error) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: result.error,
        });
      }

      return res.send({
        status: 'success',
        msg: 'Duplicated campaign successfully.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  expireCampaign: async function(req, res, next) {
    try {
      const campaignId = req.body.cid;
      const expirationDate = req.body.date || new Date();

      await DBBridge.Campaign.update_campaign(campaignId, null, { expire_date: expirationDate }, true);
      const account = await DBBridge.CreditTransaction.transfer_and_close({ account: null, campaignId });
      if (account) {
        return res.send({
          status: 'success',
          msg: 'Campaign has been expired',
        });
      }

      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Campaign is invalid or it has already expired',
      });
    } catch(e) {
      console.error(e);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  rename_campaign: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Campaign');
      const campaign_id = req.body.cid;
      const new_campaign_title = req.body.title;
      const current_client = req.session.user;
      if (
        await DBBridge.Campaign.rename_campaign(
          current_client['id'],
          campaign_id,
          new_campaign_title
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Renamed collection successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid collection.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },
  update_email_subject: async function (req, res, next) {
    try {
      const { body, session, ability } = req;
      ForbiddenError.from(ability).unlessCan('update', 'Campaign');
      const campaign_id = body.cid;
      const campaign_email_subject = body.subject;
      const current_client = session.user;
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      if (
        await DBBridge.Campaign.update_campaign_email_subject(
          userIds,
          campaign_id,
          campaign_email_subject,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Update gift message subject successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid campaign.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },
  update_email_message: async function (req, res, next) {
    try {
      const { body, session, ability } = req;
      ForbiddenError.from(ability).unlessCan('update', 'Campaign');
      const campaign_id = body.cid;
      const campaign_message = body.message;
      const current_client = session.user;
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      if (
        await DBBridge.Campaign.update_campaign_email_message(
          userIds,
          campaign_id,
          campaign_message,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Update gift message successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid campaign.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  update_message: async function (req, res, next) {
    try {
      const { body, session, ability } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const campaign_id = body.cid;
      const campaign_message = body.message;
      const current_client = session.user;
      if (
        await DBBridge.Campaign.update_campaign_message(
          userIds,
          campaign_id,
          campaign_message,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Update landing page message successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid campaign.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  update_settings: async function (req, res, next) {
    try {
      const { ability, session, body } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const current_client = session.user;
      const { campaign, errorMessage } = await DBBridge.Campaign.update_campaign_settings(
        userIds,
        body,
        current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
      );

      if (!campaign) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: errorMessage || 'Invalid campaign.',
        });
      }

      const newUserId =
        parseInt(req.body.ownerId) !== parseInt(campaign.userId);

      if (newUserId && (current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER)) {
        console.log('newUser!');
        const credit_balance =
          await DBBridge.CreditTransaction.get_credit_balance(
            req.body.ownerId
          );
        const params = {
          ...{ credit_balance: credit_balance },
          ...req.body,
        };
        const data = await fetchData(params);
        const campaignAccountRes = await handleCampaignAccount(data);
        if (campaignAccountRes) {
          return res.send({
            status: 'success',
            msg: 'Update campaign & reminders successfully.',
          });
        } else {
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Please ensure User has enough credits to transfer campaign.',
          });
        }
      } else {
        return res.send({
          status: 'success',
          msg: 'Update campaign & reminders successfully.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid campaign',
      });
    }
  },

  add_contacts: async function (req, res, next) {
    const { session, session: { user }, ability, body: { contacts, cid: campaignId } } = req;
    ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
    const transaction = await db.sequelize.transaction();
    try {
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const balanceHolderId = user.parent_id || user.id;

      const currentBalance = await DBBridge.CreditTransaction.get_credit_balance(balanceHolderId);
      const campaign = await DBBridge.Campaign.get_one(null, campaignId, true);
      const depositAmount = contacts.length * campaign.price;

      if (hasEnoughCredit(currentBalance, depositAmount)) {
        const { contactsCampaign, insertedContacts } = await DBBridge.Campaign.add_new_contacts(
          userIds,
          campaignId,
          contacts,
          user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER,
          transaction
        );
        if (contactsCampaign && insertedContacts.length) {
          await DBBridge.CreditTransaction.transfer_from_savings_to_campaign({
            amount: depositAmount,
            comment: `Add contacts - campaign ${campaign.id} - campaign name: ${campaign.title} - number of contacts: ${contacts.length} - campaign price: ${campaign.price}`,
            campaignId,
            balanceHolderId,
            transaction
          });
          transaction.commit();

          await DBBridge.ShortUrl.createForAll(insertedContacts);
          const campaignLink = `${process.env.BASE_URL}/edit-campaign?cid=${contactsCampaign.id}`
          await sendNotificationMail({
            content: `<p>New contacts have been added to <b>${contactsCampaign.title}</b> campaign<p><p><a href="${campaignLink}">View campaign details</a></p>`,
            subject: `New contacts in ${contactsCampaign.title} campaign`
          });
          return res.send({
            status: 'success',
            msg: 'Emails will be sent soon after review.',
          });
        } else {
          transaction.rollback();
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Invalid campaign.',
          });
        }
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Please ensure User has enough credits to add contacts.',
        });
      }
    } catch (err) {
      transaction.rollback();
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  add_product: async function (req, res, next) {
    try {
      const { ability, session, body } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const campaign_id = body.cid;
      const product_id = body.pid;
      const single_product = body.singleProduct;
      const current_client = session.user;
      const variant_id = body.vid;

      const { status, msg, product } = await DBBridge.Campaign.add_product(
        userIds,
        campaign_id,
        product_id,
        current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER,
        single_product,
        variant_id,
      );
      if (status) {
        return res.send({
          status: 'success',
          msg: msg,
          product,
        });
      }
      if (!status) {
        return res.send({
          status: 'product exists',
          msg: msg,
        });
      }

      res.status(400);
      return res.send({
        status: 'failed',
        msg: msg,
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  change_sequence: async function (req, res, next) {
    try {
      const { ability, session, body } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const campaign_id = body.cid;
      const changed_product_id = body.cpid;
      const previous_product_id = body.ppid;
      const current_client = session.user;

      const { status, msg } = await DBBridge.Campaign.change_sequence(
        userIds,
        campaign_id,
        changed_product_id,
        previous_product_id,
        current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
      );
      if (status) {
        return res.send({
          status: 'success',
          msg: msg,
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: msg,
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  remove_product: async function (req, res, next) {
    try {
      const { ability, session, body } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const userIds = getAvailableCompanyUsers({ session, ability, action: 'update' });
      const campaign_id = body.cid;
      const product_id = body.pid;
      const single_product = body.singleProduct;
      const current_client = session.user;
      if (
        await DBBridge.Campaign.remove_product(
          userIds,
          campaign_id,
          product_id,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER,
          single_product,
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Product has been removed successfully.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid data.',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  preview_reminder_email: async function (req, res, next) {
    try {
      const { query: { cid: campaign_id, expdate: expire_date, key} } = req;
      const contact = await DBBridge.Contact.choose_one_contact(campaign_id);
      const { shouldDisplayLogo, shouldDisplayBanner } = checkIfMediaShouldBeDisplayed(contact['campaign'], true);
      if (contact) {
        const message = hydrateReminderMessage(
          contact['campaign'][`reminder${key}_content`] || ConstData.REMINDERS_CONTENT[key]['content'],
          contact,
          expire_date
        );

        const params = {
          message,
          gfg_logo: contact['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.svg` : '',
          logo_url: shouldDisplayLogo ? `${process.env.BASE_URL}${contact['campaign']['logo_url']}` : '',
          banner_url: shouldDisplayBanner ? `${process.env.BASE_URL}${contact['campaign']['banner_url']}` : '',
          gift_icon_url:
            `${process.env.BASE_URL}/resources/images/gift-icon.png`,
          gift_url: getCustomerLandingShortUrl({ shortUrl: contact['shortUrl'], id: contact['id'] }),
          from_first_name: contact['from_first_name'],
          from_company_name: contact['from_company_name'],
          expire_date: moment(expire_date).format('MM/DD/YYYY'),
          shouldDisplayLogo,
          shouldDisplayBanner,
        }

        let v = new View(res, 'client/email_templates/reminder');
        v.render({
          ...getGlobalTemplateData(req, res),
          ...params,
          page_title: 'preview-' + key,
          page_type: 'email-template',
          session: req.session,
          i18n: res,
          sanitizeHtml,
        });
      } else {
        return res.redirect('/404');
      }
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },

  list_contacts: async function (req, res, next) {
    try {
      const campaign_id = req.body.cid;
      const step = req.body.step || '';
      const type = req.body.type || 'lazy';
      const page = req.body.page || 1;
      const search = req.body.search || '';
      const { contacts, hasNextPage, activePage } = await DBBridge.Contact.get_contacts(campaign_id, step, type, page, search);
      return res.send({
        status: 'success',
        data: {
          contacts,
          hasNextPage,
          activePage,
        },
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
  public_collections: async function (req, res, next) {
    try {
      const signature_collections = await DBBridge.SignatureCollection.list_all(
        true,
        null,
        null,
        false
      );
      const campaigns = await DBBridge.Campaign.list_all({ user_id: null, with_products: true });

      let v = new View(res, 'customer/public/collections');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-dashboard',
        page_type: 'client-dashboard-page',
        signature_collections,
        campaigns,
      });
    } catch (err) {
      console.log(err);
    }
  },
  public_collection: async function (req, res, next) {
    try {
      let collection_id = req.params.collectionId || '';
      let collection_type = 'signature';
      const offset = 0;
      let count = 20;
      let products = [];

      products = await DBBridge.SignatureCollection.list_products(
        collection_id,
        offset,
        count
      );

      const current_user = req.session.user;
      const collections = {
        signature: await DBBridge.SignatureCollection.list_all(
          false,
          null,
          null,
          false
        ),
        campaign: await DBBridge.Campaign.list_all({ user_id: null, with_products: false }),
      };

      let v = new View(res, 'customer/public/collection');
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
        is_admin: false,
        isMarketing: true,
      });
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },
  public_product_detail: async function (req, res, next) {
    const contact_id = null;
    const product_id = req.params.productId;
    const landingUrl = getCustomerLandingPath({ isDemo: false, id: contact_id })

    const variants = await DBBridge.Product.get_variants({ product_id, getOutOfStock: true });
    if (variants.length) {
      const { colorOptions, otherOptions } = getProductOptions(variants);
      let v = new View(res, 'customer/gift-detail');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'gift-detail-marketing',
        page_type: 'public-product-detail',
        products: variants,
        colorOptions,
        otherOptions,
        cid: contact_id,
        campaign: {},
        demo: false,
        landingUrl,
        wellToldImages: ConstData.WELL_TOLD_IMAGES,
        states: ConstData.STATES,
        isMarketing: true,
        getShopifyUrl,
        singleProduct: false,
        isHotjarEnabled: true,
      });
    } else {
      return res.redirect('/404');
    }
  },
  setMultipleRedemptions: async function (req, res, next) {
    const { ability, body: { campaignId, numberOfRedemptions } } = req;
    ForbiddenError.from(ability).throwUnlessCan('manage', 'all');
    const transaction = await db.sequelize.transaction();
    try {
      const campaign = await DBBridge.Campaign.get_one(null, campaignId, true);
      const redeemedCount = await DBBridge.Contact.get_redeemed_count(campaign.userId, campaignId);
      const balanceHolderId = campaign.user.parent_id || campaign.userId;
      const totalBudget = numberOfRedemptions * campaign.price;
      const { campaignAccount, savingsAccount } = await DBBridge.CreditTransaction.getCampaignAccountAndSavings({ campaignId, balanceHolderId });
      const amountToTransfer = totalBudget - campaignAccount.credit_amount;
      if (amountToTransfer > savingsAccount.balance) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Not enough credits available',
        });
      } else if (amountToTransfer < 0) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'New budget cannot be smaller than the current one.',
        });
      } else if (redeemedCount) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'You cannot transform this campaign, there are already redeemed contacts.',
        });
      }

      await DBBridge.Campaign.allowMultipleRedemptions(campaignId, transaction);
      await DBBridge.CreditTransaction.transfer_from_savings_to_campaign({
        amount: amountToTransfer,
        campaignId,
        balanceHolderId,
        comment: 'Set initial budget for multiple redemption campaign',
        transaction,
      });
      await DBBridge.ShortUrl.createForCampaign({
        redirectPath: getCampaignLandingPath(campaignId),
        campaignId,
        transaction
      });
      transaction.commit();

      res.status(200);
      return res.send({
        status: 'success',
        msg: 'Campaign has been updated.',
      });
    } catch(e) {
      transaction.rollback();
      console.error(e);
    }
  },
  export_contacts: async function (req, res, next) {
    try {
      const campaign_id = req.query.cid;
      const step = req.query.step || '';
      const type = req.query.type || 'lazy';
      const page = req.query.page || 1;
      const search = req.query.search || '';
      const campaignTitle = req.query.title || '';

      const { contacts } = await DBBridge.Contact.get_contacts(campaign_id, step, type, page, search);

      if (!contacts) {
        return res.send({
          status: 'failed',
          msg: 'No contacts found',
        });
      }

      const formattedContacts = contacts.map((contact, index) => ({
        "No": index + 1,
        "Recipient First Name": contact.first_name,
        "Recipient Last Name": contact.last_name,
        "Recipient Company": contact.company_name,
        "Recipient Email": contact.email,
        "Sender First Name": contact.from_first_name,
        "Sender Last Name": contact.from_last_name,
        "Sender Company": contact.from_company_name,
        "Sender Email": contact.from_email,
        "Status": statusHelper(contact.status),
        "Link": contact.link,
      }));

      const fields = [
        "No",
        "Recipient First Name",
        "Recipient Last Name",
        "Recipient Company",
        "Recipient Email",
        "Sender First Name",
        "Sender Last Name",
        "Sender Company",
        "Sender Email",
        "Status",
        "Link"
      ];

      const csv = parseToCsv(formattedContacts, fields);
      const csvName = campaignTitle ? `${campaignTitle}contacts_export.csv` : 'contacts_export.csv';

      res.header('Content-Type', 'text/csv');
      res.attachment(csvName);
      return res.send(csv);
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

async function handleCampaignAccount(data) {
  const { credit_balance, credits_to_earmark } = data;
  if (hasEnoughCredit(credit_balance, credits_to_earmark)) {
    const cRes = await closePrevAccount(data.campaign_id);
    const oRes = await openNewAccount(data);
    if (cRes && oRes) {
      return true;
    }
  }
}

async function openNewAccount(data) {
  const { credit_balance, credits_to_earmark, campaign_id, ownerId, parent_id } = data;
  if (hasEnoughCredit(credit_balance, credits_to_earmark)) {
    await DBBridge.Campaign.update_campaign(
      campaign_id,
      null,
      { userId: ownerId },
      true
    );
    await DBBridge.CreditTransaction.create_campaign_account({
      user_id: ownerId,
      parent_id,
      credit_amount: credits_to_earmark,
      comment: 'Setting Up Campaign Account',
      campaign_id: campaign_id
    });

    return true;
  } else {
    console.log('NSF');
    return false;
  }
}

function hasEnoughCredit(credit_balance, credits_to_earmark) {
  return credit_balance >= credits_to_earmark;
}

async function closePrevAccount(campaignId) {
  await DBBridge.CreditTransaction.transfer_and_close({ account: null, campaignId, changingOwnership: true });
  return true;
}

async function fetchData(campaign_data) {
  const { credit_balance, ownerId, parent_id } = campaign_data;
  const campaign_id = campaign_data.cid;
  const credits_to_earmark = await DBBridge.Campaign.getTotalCampaignPrice(
    campaign_id
  );
  return {
    credit_balance,
    credits_to_earmark,
    campaign_id,
    ownerId,
    parent_id
  };
}
