let View = require('../views/base');
let moment = require('moment');
const db = require('../models/sequelize');
const { ForbiddenError } = require('@casl/ability');

let BaseController = require('./BaseController');
const { sendInitialGiftMail, sendGiftCampaign } = require('../api/mail');
const DBBridge = require('../models/bridge');
const ConstData = require('../util/const_data');
const parseToCsv = require('../util/parse_to_csv');
const { statusHelper } = require('../api/status');
const { getGlobalTemplateData } = require('../api/template');
const { mapUserTypes } = require('../api/user');

module.exports = BaseController.extend({
  name: 'AdminController',

  list_all_campaigns: async function (req, res, next) {
    try {
      const filter = req.query.key;
      const type = req.query.type || '';
      const current_user = req.session.user;
      const campaigns = await DBBridge.Campaign.list_all({
        user_id: current_user['id'],
        with_products: false,
        is_viewer_admin: true,
        filter,
        type,
        withContactCount: true,
      });
      const page_title =
        type === 'live'
          ? 'admin-live-campaigns'
          : type === 'archived'
          ? 'admin-archived-campaigns'
          : 'admin-campaigns';
      let v = new View(res, 'client/dashboard/admin/admin-campaigns');

      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: page_title,
        page_type: 'client-dashboard-page',
        campaigns,
        moment: moment,
        statusHelper: statusHelper,
        key: filter,
        type: type,
      });
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },

  list_all_collections: async function (req, res, next) {
    const current_user = req.session.user;
    try {
      const filter = req.query.key;
      const collections = await DBBridge.SignatureCollection.list_all(
        false,
        true,
        filter,
        current_user.type === ConstData.ADMIN_USER || current_user.type === ConstData.STANDARD_ADMIN_USER
      );

      let v = new View(res, 'client/dashboard/admin/admin-collections');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'admin-collections',
        page_type: 'client-dashboard-page',
        collections,
        key: filter,
      });
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },

  list_queues: async function (req, res, next) {
    try {
      const campaigns = await DBBridge.Campaign.list_unsent();

      let v = new View(res, 'client/dashboard/admin/admin-queues');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'admin-queues',
        page_type: 'client-dashboard-page',
        campaigns,
        moment: moment,
        statusHelper,
      });
    } catch (err) {
      console.log(err);
    }
  },

  listContacts: async function(req, res, next) {
    try {
      const query =  req.query.q || '';
      const type = req.query.type || '';
      const page = req.query.page || 1;
      const pageLimit = 200;
      const contacts = await DBBridge.Contact.searchContacts({ query, type, page, pageLimit });

      const maxPage = Math.ceil(contacts.count ?? 1 / pageLimit);
      let v = new View(res, 'client/dashboard/admin/admin-contacts');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'admin-contacts',
        page_type: 'client-dashboard-page',
        statusHelper,
        contacts: contacts.rows ?? contacts,
        page,
        type,
        query,
        maxPage,
      });
    } catch(e) {
      console.error(e);
      return res.redirect('/404');
    }
  },

  showSettings: async function(req, res, next) {
    try {
      const settings = await DBBridge.Setting.getSettings();
      const v = new View(res, 'client/dashboard/admin/settings');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'admin-settings',
        page_type: 'client-dashboard-page',
        settings,
        isV2: process.env.PLATFORM_VERSION >= ConstData.VERSION_ALPHA,
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  updateSettings: async function(req, res, next) {
    try {
      const { body: { enableNewSendGift } } = req;
      await DBBridge.Setting.updateSettings({
        enable_new_send_gift: enableNewSendGift
      });
      res.send({
        status: 'success',
        msg: 'Settings have been updated.',
      });
    } catch (e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Server error occured.',
      });
    }
  },

  manageAuthenticationProviders: async function(req, res, next) {
    try {
      const providers = await DBBridge.AuthenticationProvider.get_providers();
      const v = new View(res, 'client/dashboard/admin/admin-authentication-providers');
      v.render({
        page_title: 'admin-authentication-providers',
        page_type: 'client-dashboard-page',
        providers,
        adapters: ConstData.AUTHENTICATION_ADAPTERS,
        moment,
        session: req.session,
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  getAuthenticationProvider: async function(req, res, next) {
    try {
      const { params: { id } } = req;
      const provider = await DBBridge.AuthenticationProvider.get_provider(id);
      res.send({
        status: 'success',
        data: {
          provider
        },
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  createAuthenticationProvider: async function(req, res, next) {
    try {
      const { body: { name, adapter, config } } = req;
      await DBBridge.AuthenticationProvider.create_provider(name, adapter, JSON.parse(config));
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  updateAuthenticationProvider: async function(req, res, next) {
    try {
      const { body: { id, name, adapter, config } } = req;
      await DBBridge.AuthenticationProvider.update_provider(id, name, adapter, JSON.parse(config));
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  deleteAuthenticationProvider: async function(req, res, next) {
    try {
      const { body: { id } } = req;
      await DBBridge.AuthenticationProvider.delete_provider(id);
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  manageAuthenticationTokens: async function(req, res, next) {
    try {
      const { provider_id, token = '', limit = 50, offset = 0 } = req.query;
      const providers = await DBBridge.AuthenticationProvider.get_providers();
      let filteredTokens = null;
      if (provider_id) {
        filteredTokens = await DBBridge.AuthenticationToken.filter_tokens_by_provider(provider_id, { token, limit, offset });
      }
      const v = new View(res, 'client/dashboard/admin/admin-authentication-tokens');
      v.render({
        page_title: 'admin-authentication-tokens',
        page_type: 'client-dashboard-page',
        provider_id,
        providers,
        filteredTokens,
        token,
        limit: parseInt(limit),
        offset: parseInt(offset),
        moment,
        session: req.session,
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  getAuthenticationToken: async function(req, res, next) {
    try {
      const { params: { id } } = req;
      const token = await DBBridge.AuthenticationToken.get_token(id);
      res.send({
        status: 'success',
        data: {
          token
        },
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  createAuthenticationToken: async function(req, res, next) {
    try {
      const { body: { authenticationProviderId, token } } = req;
      await DBBridge.AuthenticationToken.create_token(authenticationProviderId, token);
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  createAuthenticationTokens: async function(req, res, next) {
    try {
      const { body: { authenticationProviderId, tokens } } = req;
      const tokensToCreate = tokens.map(token => ({ token, authenticationProviderId }));
      await DBBridge.AuthenticationToken.bulk_create_tokens(tokensToCreate);
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  updateAuthenticationToken: async function(req, res, next) {
    try {
      const { body: { id, token, authenticatedAt, contactId } } = req;
      await DBBridge.AuthenticationToken.update_token(id, token, authenticatedAt ? new Date(authenticatedAt) : null, contactId || null);
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  deleteAuthenticationToken: async function(req, res, next) {
    try {
      const { body: { id } } = req;
      await DBBridge.AuthenticationToken.delete_token(id);
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  getAllProviderTokens: async function(req, res, next) {
    try {
      const { query: { id } } = req;
      const tokens = await DBBridge.AuthenticationToken.filter_tokens_by_provider(id, { token: '' });
      res.send({
        tokens,
        status: 'success',
      });
    } catch(e) {
      console.log(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  adminVerifyUser: async function (req, res, next) {
    const user_id = req.body.uid;
    await DBBridge.User.setVerified(user_id);
    res.send({
      status: 'success',
      msg: 'Verified!',
    });
  },

  send_queue: async function (req, res, next) {
    try {
      const campaignId = req.body.cid;
      await sendGiftCampaign({ campaignId, includeContactsWithDeliveryDate: true });

      res.status(200);
      res.send({
        status: 'success',
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
  send_individual_invite: async function (req, res, next) {
    try {
      const contact_id = req.body.cid;
      const { Contact } = db.models;
      const contact = await DBBridge.Contact.getContactDetails({ id: contact_id, isEmail: true });

      if (!contact) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid operation.',
        });
      }
      const isCCEnabled = contact.campaign.cc_email;

      await Contact.update({ step: 'sent' }, { where: { id: contact_id } });
      await sendInitialGiftMail({ contacts: [contact], ccEnabled: isCCEnabled });

      res.status(200);
      res.send({
        status: 'success',
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
  adminArchiveUser: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('delete', 'User');
      const user_id = req.body.uid;
      await DBBridge.User.archive(user_id);
      res.send({
        status: 'success',
        msg: 'User has been archived.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  do_remove_campaign_queue: async function (req, res, next) {
    try {
      c;
      await DBBridge.Contact.remove_contacts_in_campaign(campaign_id);
      res.send({
        status: 'success',
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

  list_user_credits_history: async function (req, res, next) {
    try {
      const { params: { userId } } = req;
      const companyUsers = await DBBridge.User.listCompanyUsersIds({ id: userId });
      const transaction_history = await DBBridge.CreditTransaction.get_history(companyUsers);

      res.send({
        status: 'success',
        data: transaction_history.map(item => {
          let prefix = '';
          if (item.type === ConstData.WITHDRAWL_TRANSACTION) {
            prefix = '-';
          } else if ([ConstData.DEPOSIT_TRANSACTION, ConstData.STRIPE_TRANSACTION].indexOf(item.type) >= 0) {
            prefix = '+';
          }

          return {
            ...item,
            creditAmount: item.creditAmount > 0 ? prefix + item.creditAmount : item.creditAmount,
            updatedAt: moment(item.updatedAt).format('YYYY-MM-DD hh:mm')
          }
        })
      });
    } catch (e) {
      console.log(e);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  list_users_credits: async function (req, res, next) {
    try {
      const query =  req.query.q || '';
      const type = req.query.type || '';
      const page = req.query.page || 1;
      const pageLimit = 100;

      const users = await DBBridge.User.list_users_credits({ query, type });

      const users_credits = users.groupedUsers.map(function (u) {
        const savingsLiability = u?.savingsAccount !== null ? u.savingsAccount?.balance : 0;
        let allCampaignAccounts = u.campaignAccounts || [];
        u.children.forEach((child) => {
          if (child.campaignAccounts) {
            allCampaignAccounts = allCampaignAccounts.concat(child.campaignAccounts)
          }
        });
        const campaignLiability =
          allCampaignAccounts.length
            ? allCampaignAccounts
                .map((l) => l.dataValues.credit_amount)
                .reduce((a, b) => a + b, 0)
            : 0;
        return {
          ...u,
          savingsLiability,
          campaignLiability,
          total: savingsLiability + campaignLiability
        }
      });
      const masterTotalLiability = users_credits.reduce((a, b) => a + b.total, 0);

      const maxPage = Math.ceil(users.count / pageLimit);
      const paginatedUsers = users_credits.slice((page - 1) * pageLimit, page * pageLimit);

      let v = new View(res, 'client/dashboard/admin/admin-credits');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'admin-credits',
        page_type: 'client-dashboard-page',
        users_credits: paginatedUsers,
        masterTotalLiability,
        moment: moment,
        excludedAccounts: process.env.CREDITS_REPORT_EXCLUDED_ACCOUNTS || '',
        mapUserTypes,
        page,
        maxPage,
        query,
        type,
      });
    } catch (err) {
      console.log(err);
    }
  },

  export_users_credits: async function (req, res, next) {
    try {
      const query =  req.query.q || '';
      const type = req.query.type || 'all';
      const users = await DBBridge.User.list_users_credits({ query, type });

      const users_credits = users.groupedUsers.map(function (u) {
        const savingsLiability = u?.savingsAccount !== null ? u.savingsAccount?.balance : 0;
        let allCampaignAccounts = u.campaignAccounts || [];
        u.children.forEach((child) => {
          if (child.campaignAccounts) {
            allCampaignAccounts = allCampaignAccounts.concat(child.campaignAccounts)
          }
        });
        const campaignLiability =
          allCampaignAccounts.length
            ? allCampaignAccounts
              .map((l) => l.dataValues.credit_amount)
              .reduce((a, b) => a + b, 0)
            : 0;
        return {
          ...u,
          savingsLiability,
          campaignLiability,
          total: savingsLiability + campaignLiability
        }
      });
      const excludedAccounts = process.env.CREDITS_REPORT_EXCLUDED_ACCOUNTS;
      const filteredUserCredits = users_credits.filter(el => !el.email.includes('@giftsforgood.com') && !excludedAccounts?.split(',')?.includes(el.email));

      const fields = ["No", "name", "email", "company", "remaining credits"];

      const formattedUsersCredits = filteredUserCredits.map((el, index) => {
        const savingsLiability = el.savingsAccount !== null ? el.savingsAccount.balance : 0;
        const campaignLiability = el.campaignAccounts !== null ? el.campaignAccounts.map(l => l.credit_amount).reduce((a, b) => a + b, 0) : 0;
        const totalLiability = savingsLiability + campaignLiability

        return {
          "No": index + 1,
          "name": `${el.firstname} ${el.lastname}`,
          "email": el.email,
          "company": el.company,
          "remaining credits": totalLiability,
        }
      });

      const csv = parseToCsv(formattedUsersCredits, fields);

      res.header('Content-Type', 'text/csv');
      res.attachment('report.csv');
      return res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  },

  toggleCampaignStar: async function(req, res, next) {
    const { Campaign } = db.models;
    const { body: { star: is_starred, id } } = req;
    try {
      await Campaign.update({ is_starred }, { where: { id, archived: false } });
      res.send({
        status: 'success',
      });
    } catch(e) {
      console.error(e);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'An error occured.',
      });
    }
  }
});
