const View = require('../views/base');
const moment = require('moment');
const { ForbiddenError } = require('@casl/ability');
const QRCode = require('qrcode');
const { Parser } = require('@json2csv/plainjs');
const BaseController = require('./BaseController');
const { sendMail, getContactMessage } = require('../api/mail');
const DBBridge = require('../models/bridge');
const UserPermissionBridge = require('../models/bridge/UserPermissionsBridge');
const ConstData = require('../util/const_data');
const parseToCsv = require('../util/parse_to_csv');
const { statusHelper, getCampaignStatus, checkIfRedeemed } = require('../api/status');
const { generate_token_string } = require('../util/helper');
const {
  sortOptions,
  statusFilterOptions,
  emailFilterOptions,
  thanksFilterOptions,
  getCampaignsByIds,
  getSenderIds } = require('../api/reports');
const { getGlobalTemplateData } = require('../api/template');
const { mapUserTypes, groupUsersByParent } = require('../api/user');
const { checkAccess } = require('../api/acl');
const { checkIfMediaShouldBeDisplayed } = require('../api/campaign');
const sanitizeHtml = require('sanitize-html');

module.exports = BaseController.extend({
  name: 'ClientController',

  dashboard: async function (req, res, next) {
    try {
      const current_client = req.session.user;

      const signature_collections = await DBBridge.SignatureCollection.list_all(
        true,
        null,
        null,
        current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
      );
      const campaigns = await DBBridge.Campaign.list_all({
        user_id: current_client['id'],
        with_products: true,
      });

      let v = new View(res, 'client/dashboard/client-dashboard');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-dashboard',
        page_type: 'client-dashboard-page',
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        signature_collections,
        campaigns,
      });
    } catch (err) {
      console.log(err);
    }
  },

  list_gifts: async function (req, res, next) {
    try {
      const current_client = req.session.user;
      const senderIds = [current_client['id'], current_client['parent_id']];
      const sortMode = req.query.hasOwnProperty('sm') ? req.query.sm : 'na';
      const viewMode = req.query.hasOwnProperty('vm') ? req.query.vm : 'all';
      const search = req.query.search || null;
      const page = req.query.page || 1;
      const limit = 200;
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const contacts = await DBBridge.Contact.filter_contacts({
        senderIds,
        viewMode,
        sortMode,
        campaignId: activeCampaignIds,
        page,
        limit,
        search,
      });
      const campaigns = await DBBridge.Campaign.getUserCampaigns(senderIds);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      const activeStatusFilter = statusFilterOptions.find(el => el.code === viewMode) || {};
      const maxPage = Math.ceil(contacts.count / limit);

      let v = new View(res, 'client/dashboard/client-gifts');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-gifts',
        page_type: 'client-dashboard-page',
        vm: viewMode,
        sm: sortMode,
        page,
        maxPage,
        contacts: contacts.rows,
        campaigns,
        activeCampaigns,
        activeCampaignIds: activeCampaignIds || [],
        sortOptions,
        statusFilterOptions,
        activeStatusFilter,
        search,
        checkIfRedeemed,
        moment: moment,
      });
    } catch (err) {
      console.log(err);
    }
  },

  reports: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Report');
      const current_client = req.session.user;
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const sender_ids = [current_client['id'], current_client['parent_id']];
      const page = req.query.page || 1;
      const limit = 200;

      // Email opened count
      const opened_count = await DBBridge.Contact.get_opened_count(sender_ids, activeCampaignIds);

      // Shipped gifts count
      const shipped_count = await DBBridge.Contact.get_shipped_count(
        sender_ids,
        activeCampaignIds
      );

      // Delivered gifts count
      const delivered_count = await DBBridge.Contact.get_delivered_count(
        sender_ids,
        activeCampaignIds
      );

      // Sent count
      const sent_count = await DBBridge.Contact.get_sent_count(sender_ids, activeCampaignIds);

      // Redeemed gifts
      let redeemed_contacts = await DBBridge.Contact.get_redeemed_contacts(
        sender_ids,
        activeCampaignIds,
        page,
        limit
      );
    const redeemed_count = redeemed_contacts.count;
      const campaigns = await DBBridge.Campaign.getUserCampaigns(sender_ids);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      const maxPage = Math.ceil(redeemed_contacts.count / limit);
      let v = new View(res, 'client/dashboard/statistics/client-reports');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-reports',
        page_type: 'client-dashboard-page',
        contacts: redeemed_contacts.rows,
        opened_count,
        shipped_count,
        delivered_count,
        redeemed_count,
        sent_count,
        campaigns,
        activeCampaigns,
        activeCampaignIds: activeCampaignIds || [],
        page,
        maxPage,
        moment: moment,
      });
    } catch (err) {
      next(err);
    }
  },

  campaign_reports: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Report');
      const current_client = req.session.user;
      const sender_ids = getSenderIds(req.query.onlymine, current_client);
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const campaign_reports = await DBBridge.Campaign.get_campaign_reports(
        sender_ids,
        activeCampaignIds
      );
      const campaigns = await DBBridge.Campaign.getUserCampaigns(sender_ids);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      let v = new View(
        res,
        'client/dashboard/statistics/client-campaign-reports'
      );
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-campaign-reports',
        page_type: 'client-dashboard-page',
        reports: campaign_reports,
        campaigns,
        activeCampaigns,
        activeCampaignIds: activeCampaignIds || [],
        onlymine: req.query.onlymine || 'false',
        moment: moment,
        statusHelper,
      });
    } catch (err) {
      next(err);
    }
  },

  export_campaign_reports: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Report');
      const current_client = req.session.user;
      const sender_ids = getSenderIds(req.query.onlymine, current_client);
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const campaign_reports = await DBBridge.Campaign.get_campaign_reports(
        sender_ids,
        activeCampaignIds
      );

      const fields = ["No", "Sender Company", "Sender Name", "Sender Email", "Collection Sent", "Total Gifts Sent",
        "Redemption Rate", "Send Date"];

      const formattedReports = campaign_reports.map((report, index) => {
        return {
          "No": index + 1,
          "Sender Company": report.user.company,
          "Sender Name": `${report.user.firstname} ${report.user.lastname}`,
          "Sender Email": report.user.email,
          "Collection Sent": report.title,
          "Total Gifts Sent": report.sent_count,
          "Redemption Rate": `${report.redemption_rate} %`,
          "Send Date": report.sent_at,
        }
      });

      const csv = parseToCsv(formattedReports, fields);

      res.header('Content-Type', 'text/csv');
      res.attachment('report.csv');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  },

  recipient_reports: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Report');
      const current_client = req.session.user;
      const senderIds = getSenderIds(req.query.onlymine, current_client);
      const viewMode = req.query.fm || 'all';
      const emailFilter = req.query.email || null;
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const sortMode = 'na';
      const search = req.query.search || null;
      const page = req.query.page || 1;
      const limit = 200;
      const recipients_reports = await DBBridge.Contact.filter_contacts({
        senderIds,
        viewMode,
        sortMode,
        campaignId: activeCampaignIds,
        page,
        limit,
        search,
        emailFilter,
      });

      const campaigns = await DBBridge.Campaign.getUserCampaigns(senderIds);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      const maxPage = Math.ceil(recipients_reports.count / limit);
      let v = new View(
        res,
        'client/dashboard/statistics/client-recipient-reports'
      );
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-recipient-reports',
        page_type: 'client-dashboard-page',
        reports: recipients_reports.rows,
        campaigns,
        activeCampaigns,
        activeCampaignIds: activeCampaignIds || [],
        fm: viewMode,
        email: emailFilter,
        page,
        maxPage,
        limit,
        onlymine: req.query.onlymine || 'false',
        filterOptions: statusFilterOptions.filter((option) => option.code !== 'opened'),
        emailFilterOptions,
        search,
        moment: moment,
        statusHelper,
      });
    } catch (err) {
      next(err);
    }
  },

  thanks_reports: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Report');
      const current_client = req.session.user;
      const sort_order = req.query.order || 'filo';
      const is_only_mine = req.query.onlymine || 'false';
      const filter = req.query.fm || 'responded';
      const activeCampaignIds = req.query.campaign ? req.query.campaign.split(',') : null;
      const page = req.query.page || 1;
      const limit = 200;
      const sender_ids = getSenderIds(is_only_mine, current_client);

      const campaigns = await DBBridge.Campaign.getUserCampaigns(sender_ids);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      const thanks_reports =
        await DBBridge.Contact.get_thanks_note_from_recipients(
          sort_order,
          sender_ids,
          activeCampaignIds,
          filter,
          page,
          limit
        );
      const maxPage = Math.ceil(thanks_reports.count / limit);

      let v = new View(
        res,
        'client/dashboard/statistics/client-thanks-reports'
      );
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-thanks-reports',
        page_type: 'client-dashboard-page',
        reports: thanks_reports.rows,
        campaigns,
        activeCampaigns,
        activeCampaignIds: activeCampaignIds || [],
        order: sort_order,
        onlymine: is_only_mine,
        filter,
        filterOptions: thanksFilterOptions,
        page,
        maxPage,
        limit,
        moment: moment,
      });
    } catch (err) {
      next(err);
    }
  },

  top_gifts_reports: async function(req, res, next) {
    try {
      const { session: { user }, query: { campaign } } = req;
      const userIds = [user.id, user.parent_id];
      const activeCampaignIds = campaign ? campaign.split(',') : [];
      const campaigns = await DBBridge.Campaign.getUserCampaigns(userIds);
      const activeCampaigns = getCampaignsByIds(campaigns, activeCampaignIds);
      let gifts = await DBBridge.Contact.getUserTopGifts(userIds, activeCampaignIds);
      const totalContactCount = await DBBridge.Contact.getUserContactCount(userIds, activeCampaignIds);
      gifts = gifts.map(gift => ({
        ...gift,
        percentage: `${((gift.redemption_number / totalContactCount) * 100).toFixed(2)}%`
      }));
      let v = new View(
        res,
        'client/dashboard/statistics/client-gifts-reports'
      );
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-gifts-reports',
        page_type: 'client-dashboard-page',
        campaigns,
        gifts,
        activeCampaigns,
        activeCampaignIds,
        totalContactCount,
        isHotjarEnabled: false,
      });
    } catch(e) {
      console.log(e);
      return res.redirect('/404');
    }
  },

  getFullThanksReportsData: async function(req, res, next) {
    try {
      const { session: { user }, query: { order, onlymine, fm, campaign } } = req;
      const senderIds = getSenderIds(onlymine, user);
      const reports = await DBBridge.Contact.get_thanks_note_from_recipients(
        order,
        senderIds,
        campaign,
        fm,
        0,
        null
      );
      const fields = ["No", "Sender Name", "Sender Company", "Date", "Recipient Name", "Recipient Email", "Thank you note"];

      const formattedReports = reports.rows.map((report, index) => {
        return {
          No: index + 1,
          "Sender Name": `${report.from_first_name} ${report.from_last_name}`,
          "Sender Company": report.from_company_name,
          "Date": report.thanks_at,
          "Recipient Name": `${report.to_first_name} ${report.to_last_name}`,
          "Recipient Email": report.to_email,
          "Thank you note": report.thank_note,
        }
      });

      const csv = parseToCsv(formattedReports, fields);

      res.header('Content-Type', 'text/csv');
      res.attachment('reports.csv');
      return res.send(csv);
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  getFullRecipientsReportsData: async function(req, res, next) {
    try {
      const { session: { user }, query: { order, onlymine, fm, campaign, ef } } = req;
      const senderIds = getSenderIds(onlymine, user);
      const reports = await DBBridge.Contact.filter_contacts({
        senderIds,
        viewMode: fm || 'all',
        sortMode: order || 'na',
        campaignId: campaign,
        emailFilter: ef || 'all',
      });

      const urlPrefix = `${req.protocol}://${req.get('host')}`
      const formattedReports = reports.rows.map((report, index) => {
        const shortUrlSuffix = report['shortUrl']['suffix']
        const shortUrl = `${urlPrefix}/s/${shortUrlSuffix}`

        return {
          "No": index + 1,
          "Campaign": report.campaign.title || '',
          "Sender Company": report.from_company_name || '',
          "Sender First Name": report.from_first_name || '',
          "Sender Last Name": report.from_last_name || '',
          "Sender Name": `${report.from_first_name} ${report.from_last_name}` || '',
          "Sender Email": report.from_email || '',
          "Recipient First Name": report.to_first_name || '',
          "Recipient Last Name": report.to_last_name || '',
          "Recipient Name": `${report.to_first_name} ${report.to_last_name}` || '',
          "Recipient Email": report.to_email || '',
          "Recipient Company": report.to_company_name || '',
          "Product": report.product ? report.product.product_title : '',
          "Gift Status": report.step || '',
          "Redeemed On": report.redeemed_at,
          "Email Sent On": report.sent_at,
          "Email Opened On": report.email_opened_at,
          "Email Clicked On": report.email_clicked_at,
          "Declined reason": report.decline_reason || '',
          "Short URL": shortUrl,
        }
      });

      const fields = ["No", "Campaign", "Sender Company", "Sender First Name", "Sender Last Name", "Sender Name", "Sender Email", "Recipient First Name", "Recipient Last Name", "Recipient Name", "Recipient Email", "Recipient Company",
        "Product", "Gift Status", "Redeemed On", "Email Sent On", "Email Opened On", "Email Clicked On", "Declined reason", "Short URL"
      ];

      const csv = parseToCsv(formattedReports, fields);

      res.header('Content-Type', 'text/csv');
      res.attachment('reports.csv');
      return res.send(csv);
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  getFullGiftsReportsData: async function(req, res, next) {
    try {
      const { session: { user }, query: { sm, vm, campaign } } = req;
      const senderIds = [user['id'], user['parent_id']];
      const contacts = await DBBridge.Contact.filter_contacts({
        senderIds,
        viewMode: vm || 'na',
        sortMode: sm || 'all',
        campaignId: campaign || null,
      });

      const formattedContacts = contacts.rows.map((contact, index) => {
        return {
          "No": index + 1,
          "First Name": contact.to_first_name || '',
          "Last Name": contact.to_last_name || '',
          "Email": contact.to_email || '',
          "Company": contact.to_company_name || '',
          "Shipping First Name": contact.shipping_first_name || '',
          "Shipping Last Name": contact.shipping_last_name || '',
          "Shipping Email": contact.shipping_email || '',
          "Status": contact.step || '',
          "Link": contact.link || '',
          "Order ID": contact.productVariantId ? contact.order_id: '',
          "Product ID: ": contact.productVariantId ? contact.productVariantId : '',
          "Product Title": (contact.productVariantId && contact.product) ? contact.product.product_title : '',
          "Product Description": (contact.productVariantId && contact.product) ? contact.product['short-desc'] : '',
          "Send Date": (contact.productVariantId && contact.product) ? contact.createdAt : '',
        }
      });

      const fields = [
        "No",
        "First Name",
        "Last Name",
        "Email",
        "Company",
        "Shipping First Name",
        "Shipping Last Name",
        "Shipping Email",
        "Status",
        "Link",
        "Order ID",
        "Product ID",
        "Product Title",
        "Product Description",
        "Send Date"
      ];

      const csv = parseToCsv(formattedContacts, fields);

      res.header('Content-Type', 'text/csv');
      res.attachment('campaigns.csv');
      return res.send(csv);
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  users: async function (req, res, next) {
    try {
      const { session: { user: current_client }, query: { search, type }, ability } = req;

      ForbiddenError.from(ability).throwUnlessCan('read', 'User');
      if (type) {
        ForbiddenError.from(ability).throwUnlessCan('manage', 'all');
      }

      const isAdmin = ability.can('manage', 'all');
      const users = isAdmin
          ? await DBBridge.User.list_all_users(search, type)
          : await DBBridge.User.list_sib_users([current_client['id'], current_client['parent_id']], search);
      const groupedUsers = search ? users : groupUsersByParent(users);

      let v = new View(res, 'client/dashboard/client-users');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: `client-users${type ? `-${type}` : ''}`,
        page_type: 'client-dashboard-page',
        users,
        groupedUsers,
        type,
        search,
        mapUserTypes,
        moment: moment,
        checkAccess,
      });
    } catch (err) {
      next(err);
    }
  },
  add_user: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('create', 'User');
      const current_client = req.session.user;
      const { avatar, first_name, last_name, email, password, job, company, type, permissions } =
        req.body;

      const existing_client = await DBBridge.User.findByName(email);
      if (existing_client) {
        res.status(400);
        res.send({ status: 'failed', msg: 'An account with this email already exists' });
      } else {
        const newClient = await DBBridge.User.createUserByParent(
          current_client['parent_id'] || current_client['id'],
          email,
          first_name,
          last_name,
          avatar,
          job,
          company,
          password,
          type,
        );
        if (type === ConstData.STANDARD_CLIENT_USER) {
          await UserPermissionBridge.saveUserPermissions(newClient.id, permissions);
        }
        return res.send({ status: 'success', data: newClient });
      }
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  reset_password: async function(req, res, next) {
    try {
      const resetToken = generate_token_string(
        process.env.FORGOT_TOKEN_PREFIX,
        process.env.FORGOT_TOKEN_SUFFIX
      );
      let resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
      await DBBridge.User.setResetToken(req.body.id, resetToken);
      return res.send({ status: 'success', resetLink });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  updateUserEmail: async function(req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'User');
      await DBBridge.User.updateEmail(req.body.email, req.body.id);
      return res.send({ status: 'success' });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: e.errors && e.errors.length ? e.errors[0].message  : 'Invalid operation',
      });
    }
  },

  updateUserPermissions: async function(req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'User');
      const { body: { userId, permissions, userType } } = req;
      await DBBridge.User.updateType(userId, userType);
      if (permissions) {
        await UserPermissionBridge.updateUserPermissions(userId, permissions);
      }
      return res.send({ status: 'success' });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'failed',
        msg: e.errors && e.errors.length ? e.errors[0].message  : 'Invalid operation',
      });
    }
  },

  do_test_email: async function (req, res, next) {
    try {
      const contact_id = req.body.cid;
      const emails = req.body.emails.split(',');
      const contact = await DBBridge.Contact.getContactDetails({ id: contact_id, isEmail: true });

      if (contact) {
        const param = {
          type: 'send-test-gift',
          targets: emails,
          data: contact,
        };
        await sendMail(param);

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
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },

  review_email: async function (req, res, next) {
    try {
      const campaign_id = req.query.cid || 0;
      const contact = await DBBridge.Contact.choose_one_contact(campaign_id);
      if (contact) {
        const message = contact['campaign']['email_message'] || contact['campaign']['message'];
        const shouldDisplayMedia = checkIfMediaShouldBeDisplayed(contact['campaign'], true);

        const contactData = {
          sender_name: contact['from_first_name'],
          sender_company: contact['from_company_name'],
          receiver_name: contact['to_first_name'],
          message:
            getContactMessage(message, contact),
          video: contact['campaign']['video_url'],
          logo: contact['campaign']['logo_url'],
          banner: contact['campaign']['banner_url'],
          gfgLogo: contact['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.svg` : '',
          singleProduct: contact['campaign']['single_product'] ?? false,
        }

        let v = new View(res, 'client/dashboard/review-email');
        v.render({
          ...getGlobalTemplateData(req, res),
          page_title: 'review-email',
          page_type: 'email-template',
          cid: contact['id'],
          ...contactData,
          ...shouldDisplayMedia,
          sanitizeHtml,
        });
      }
    } catch (err) {
      console.log(err);
    }
  },
  list_campaigns: async function (req, res, next) {
    try {
      const { ability, session: { user, companyUsers }} = req;
      ForbiddenError.from(ability).throwUnlessCan('read', 'Campaign');
      const getFamilyCampaigns = !!(ability.can('read', 'CompanyCampaign') && companyUsers.length);
      const campaigns = await DBBridge.Campaign.list_all({
        user_id: getFamilyCampaigns ? companyUsers : user.id,
        with_products: false,
        withContactCount: true,
      });

      const campaignsStatus = campaigns.map((campaign) => {
        const hasSentContacts = campaign.hasSentContacts;
        const expireDate = campaign.expire_date;
        const isIncludeUrl = campaign.no_email_invite;

        return getCampaignStatus(hasSentContacts, expireDate, isIncludeUrl);
      });

      let v = new View(res, 'client/dashboard/client-campaigns');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-campaigns',
        page_type: 'client-dashboard-page',
        campaignsStatus,
        campaigns,
        moment: moment,
        statusHelper,
      });
    } catch (err) {
      next(err);
    }
  },
  edit_campaign: async function (req, res, next) {
    try {
      const { ability, session: { user, query, companyUsers } } = req;
      ForbiddenError.from(ability).throwUnlessCan('update', 'Campaign');
      const canEditCompany = !!(ability.can('update', 'CompanyCampaign') && companyUsers.length);
      const userIds = canEditCompany ? companyUsers : user.id;
      const campaign_id = req.query.cid;
      const type = req.body.type || 'lazy';
      const search = req.query.search || '';
      const users = await DBBridge.User.list_all_users();
      const authenticationProviders = await DBBridge.AuthenticationProvider.get_providers();
      const campaign = await DBBridge.Campaign.get_one(
        userIds,
        campaign_id,
        user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER
      );
      const products = await DBBridge.Campaign.list_products(
        userIds,
        campaign_id,
        0,
        0,
        user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER
      );
      const { contacts } = await DBBridge.Contact.get_contacts(campaign_id, null, type, 1, search);
      const redeemedCount = await DBBridge.Contact.get_redeemed_count(userIds, campaign_id)
      const failedContacts = await DBBridge.Contact.getAllFailedContacts(campaign_id);
      const authenticationProvider = await campaign.getAuthenticationProvider();
      const multipleRedemptionsUrl = campaign.shortUrl ? `${process.env.BASE_URL}/s/${campaign.shortUrl.suffix}` : '';
      const qr = multipleRedemptionsUrl ?  await QRCode.toDataURL(multipleRedemptionsUrl) : null;

      let v = new View(res, 'client/dashboard/client-edit-campaign');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'client-edit-campaign',
        page_type: 'client-dashboard-page',
        campaign,
        contacts,
        products,
        users,
        failedContacts,
        authenticationProvider,
        authenticationProviders,
        search,
        moment: moment,
        site_link: process.env.BASE_URL,
        is_admin: user.type === ConstData.ADMIN_USER || user.type === ConstData.STANDARD_ADMIN_USER,
        reminderDefaultValues: ConstData.REMINDERS_CONTENT,
        multipleRedemptionsUrl,
        qr,
        redeemedCount,
      });
    } catch (err) {
      next(err);
    }
  },
  pull_campaigns_products: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('read', 'Campaign');
      const current_client = req.session.user;
      const offset = 0;
      let count = 20;
      const collection_type = req.body.ctype || 'signature';
      const collection_id =
        req.body.cid || process.env.SHOPIFY_25_COLLECTION_ID;

      let products = [];
      if (collection_type === 'signature') {
        products = await DBBridge.SignatureCollection.list_products(
          collection_id,
          offset,
          count
        );
      } else if (collection_type === 'campaign') {
        products = await DBBridge.Campaign.list_products(
          [current_client['id'], current_client['parent_id']],
          collection_id,
          offset,
          count,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
        );
      }

      const collections = {
        signature: await DBBridge.SignatureCollection.list_all(
          false,
          null,
          null,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER
        ),
        campaign: await DBBridge.Campaign.list_all({ user_id: current_client['id'], with_products: false }),
      };

      return res.send({
        status: 'success',
        collections,
        products,
        offset,
        count: products.length,
        cid: collection_id,
        ctype: collection_type,
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({ status: 'failed', msg: err });
    }
  },
  change_campaign_products: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Campaign');
      const current_campaign_id = req.query.cid;
      const current_client = req.session.user;
      const products = await DBBridge.SignatureCollection.list_products(
        process.env.SHOPIFY_25_COLLECTION_ID,
        0,
        20
      );
      const current_campaign_products = await DBBridge.Campaign.list_products(
        current_client['id'],
        current_campaign_id,
        0,
        0
      );

      const collections = {
        signature: await DBBridge.SignatureCollection.list_all(
          false,
          null,
          null,
          current_client.type === ConstData.ADMIN_USER || current_client.type === ConstData.STANDARD_ADMIN_USER 
        ),
        campaign: await DBBridge.Campaign.list_all({ user_id: current_client['id'], with_products: false }),
      };

      let v = new View(res, 'client/dashboard/change-campaign-products');
      v.render({
        ...getGlobalTemplateData(req, res),
        page_title: 'change-campaign-products',
        page_type: 'client-dashboard-page',
        collections,
        products,
        current_campaign_id,
        current_campaign_products,
        offset: 0,
        count: products.length,
        cid: process.env.SHOPIFY_25_COLLECTION_ID,
        ctype: 'signature',
      });
    } catch (err) {
      console.log(err);
      return res.redirect('/404');
    }
  },
  set_campaign_products: async function (req, res, next) {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan('update', 'Campaign');
      const campaign_id = req.body.cid;
      const products_ids = JSON.parse(req.body.products);
      const current_client = req.session.user;
      if (
        await DBBridge.Campaign.update_products(
          current_client['id'],
          campaign_id,
          products_ids
        )
      ) {
        return res.send({
          status: 'success',
          msg: 'Campaign has been updated with new products.',
        });
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid campaign data',
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

  customer_question: async function (req, res, next) {
    try {
      const { question, name, email, sender } = req.body;

      if (question && name && email) {
        const param = {
          type: 'customer-question',
          from: email,
          // to: creator['email'],
          to: process.env.SENDGRID_SENDER_EMAIL,
          name: name,
          question: question,
        };

        if (await sendMail(param)) {
          return res.send({
            status: 'success',
          });
        } else {
          res.status(400);
          return res.send({
            status: 'failed',
            msg: 'Question not sent.',
          });
        }
      } else {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Invalid input',
        });
      }
    } catch (err) {
      console.log(err);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation',
      });
    }
  },
});
