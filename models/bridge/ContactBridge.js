let cheerio = require('cheerio');
const db = require('../sequelize');
const { Op } = require('sequelize');
const moment = require('moment');
const ConstData = require('../../util/const_data');
const { isValidHttpUrl } = require('../../api/url');
const { checkIfInactive, redeemedStatuses } = require('../../api/status');
const { isLast24Hours, formatToPSTTimezone, priorToNowCondition, isPastDate } = require('../../api/time');
const { groupCampaignProductsForLanding } = require('../../api/product');
const { getCustomerLandingShortUrl } = require('../../api/url');
const { getSearchCondition, mailContactAttributes, mailCampaignAttributes } = require('../../api/contact');
const CampaignBridge = require('./CampaignBridge');

module.exports = {
  /**
   * Get email opened count of senders
   * @param sender_ids
   * @returns {Promise<*>}
   */

  update: async function (contact, transaction) {
    const { Contact } = db.models;
    const updated_contact = await Contact.update(contact, {
      where: { id: contact['id'] },
    }, { transaction });
    return updated_contact;
  },
  get_opened_count: async function (sender_ids, campaignId) {
    const { Campaign, Contact } = db.models;
    return await Contact.count({
      where: {
        email_opened: true,
        enabled: true,
        ...(campaignId && { campaignId }),
      },
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
        },
      },
    });
  },

  /**
   * Get email clicked count of senders
   * @param sender_ids
   * @returns {Promise<*>}
   */
  get_clicked_count: async function (sender_ids) {
    const { Campaign, Contact } = db.models;
    return await Contact.count({
      where: { email_clicked: true },
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
          enabled: true,
        },
      },
    });
  },

  /**
   * Get invites sent count of senders
   * @param sender_ids
   * @returns {Promise<*>}
   */
  get_sent_count: async function (sender_ids, campaignId) {
    const { Campaign, Contact } = db.models;
    // Never count expired and bounced contacts as sent
    // For unique URL (no email invites), allow contacts with status ready
    return await Contact.count({
      where: {
        [Op.and]: [
          { step: { [Op.ne]: 'expired' } },
          { step: { [Op.ne]: 'bounced' } },
          { [Op.or]: [
            { '$campaign.no_email_invite$': true },
            { step: { [Op.ne]: 'ready' } },
          ] }
        ],
        ...(campaignId && { campaignId })
      },
      include: {
        model: Campaign,
        where: {
          enabled: true,
          userId: sender_ids,
        },
      },
    });
  },

  /**
   * Get shipped gift order count
   * @param sender_ids
   * @returns {Promise<*>}
   */
  get_shipped_count: async function (sender_ids, campaignId) {
    const { Campaign, Contact } = db.models;
    return await Contact.count({
      where: {
        [Op.or]: [{ step: 'shipped' }, { step: 'delivered' }],
        ...(campaignId && { campaignId })
      },
      include: {
        model: Campaign,
        where: {
          enabled: true,
          userId: sender_ids,
        },
      },
    });
  },

  /**
   * Get delivered gift order count
   * @param sender_ids
   * @returns {Promise<*>}
   */
  get_delivered_count: async function (sender_ids, campaignId) {
    const { Campaign, Contact } = db.models;
    return await Contact.count({
      where: { step: 'delivered', ...(campaignId && { campaignId }) },
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
          enabled: true,
        },
      },
    });
  },

  /**
   * Get delivered gift order count
   * @param sender_ids
   * @returns {Promise<*>}
   */
   get_redeemed_count: async function (sender_ids, campaignId) {
    const { Campaign, Contact } = db.models;
    return await Contact.count({
      where: {
        step: ['confirmed', 'delivered', 'shipped', 'redeemed'],
        ...(campaignId && { campaignId })
      },
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
          enabled: true,
        },
      },
    });
  },

  getContact: async function(id) {
    const { Contact } = db.models;
    return await Contact.findOne({
      where: { id, enabled: true },
      attributes: [
        'id',
        'to_email',
        'step',
        'confirmed_at',
        'sent_at'
      ]
    });
  },

  // Get contact from contact id
  getContactDetails: async function ({ id, isEmail, withProducts }) {
    const { Campaign, Contact, ShortUrl, SignatureCollection } = db.models;
    const useShopifyProxy = process.env.USE_SHOPIFY_PROXY && process.env.USE_SHOPIFY_PROXY !== 'false';
    const campaignContentAttributes = isEmail 
      ? ['email_message', 'email_subject', 'signature', 'email_include_logo', 'email_include_banner', 'email_include_gfg_logo'] 
      : ['landing_include_logo', 'landing_include_banner', 'product_orders', 'price', 'excluded_products', 'added_products', 'lock_emails'];
    let products = [];
    let contact = await Contact.findOne({
      as: 'contact',
      where: { id, enabled: true },
      attributes: [
        ...mailContactAttributes,
        'step',
        'thank_note'
      ],
      include: [
        {
          model: Campaign,
          as: 'campaign',
          where: {
            enabled: true,
            [Op.or]: [{ archived: false }, { '$contact.step$': 'reactivated' }]
          },
          attributes: [
            'id', 
            'title',
            'userId',
            'message', 
            'video_url', 
            'banner_url',
            'logo_url',
            'expire_date', 
            'is_collection_products_type',
            'collection_id',
            'createdAt',
            'single_product',
            'cc_email',
            ...campaignContentAttributes
          ],
          include: {
            model: SignatureCollection,
            attributes: ['shopify_id', 'product_order', 'type']
          }
        },
        {
          model: ShortUrl
        }
      ],
    });
    if (contact && !isEmail && withProducts) {
      products = await CampaignBridge.getCampaignProducts({ campaign: contact.campaign, withVariants: true });
      contact['campaign']['products'] =  groupCampaignProductsForLanding({ products, useShopifyProxy });
    }
    return contact;
  },

  // Get contacts in the campaign
  get_contacts: async function (campaign_id, step, type = 'lazy', page, search) {
    const { Contact, ShortUrl, Campaign } = db.models;
    let condition;

    if (step === 'unredeemed') {
      condition = {
        campaignId: campaign_id,
        step: ['sending', 'sent', 'reactivated', 'ready', 'bounced']
      };
    } else if (step) {
      condition = { campaignId: campaign_id, step };
    } else {
      condition = { campaignId: campaign_id };
    }

    if (search) {
      condition[Op.or] = getSearchCondition(search);
    }

    let results;
    const options = {
      where: condition,
      attributes: [
        'id',
        ['to_first_name', 'first_name'],
        ['to_last_name', 'last_name'],
        ['to_company_name', 'company_name'],
        ['to_email', 'email'],
        'from_first_name',
        'from_last_name',
        'from_company_name',
        'from_email',
        'step',
        'failed_order',
        'delivery_date',
        'sent_at'
      ],
      include: [ShortUrl, Campaign]
    };

    if (type === 'lazy') {
      options.limit = page && 100;
      options.offset = page ? (page - 1) * 100 : 0;
    }

    if (type === 'lazy') {
      results = await Contact.findAndCountAll(options);
    } else {
      results = await Contact.findAll(options);
    }

    const rows = type === 'lazy' ? results?.rows : results;
    const count = results?.count;
    const hasNextPage = type === 'lazy' && page ? count > page * 100 : false;

    const inactiveStatuses = ['redeemed', 'confirmed', 'canceled'];
    const contacts = rows.map(contact => {
      const { dataValues: { campaign, shortUrl, step, ...values } } = contact;
      const deliveryDate = formatToPSTTimezone(contact['delivery_date']);
      const sentAtDate = formatToPSTTimezone(contact['sent_at']);

      return {
        ...values,
        status: step,
        delivery_date: deliveryDate || '-',
        sent_at: sentAtDate,
        formatted_delivery_date: deliveryDate ? moment(deliveryDate).format('YYYY-MM-DDThh:mm') : '-',
        campaign_schedule_date: (campaign['is_scheduled'] && campaign['scheduled_date']) ? campaign['scheduled_date'] : null,
        link: campaign['allow_multiple_redemptions'] ? '' : getCustomerLandingShortUrl({ shortUrl, id: contact['id'] }),
        canReactivate: contact.failed_order || inactiveStatuses.includes(step) || (isPastDate(campaign.expire_date) && step !== 'reactivated'),
        canReactivateShipped: ['tracked', 'delivered'].includes(step),
        canExpire: !checkIfInactive(step),
      }
    });

    return {
      contacts,
      hasNextPage,
      activePage: parseInt(page) || 1,
    };
  },

  // Get sent but still unredeemed contacts for reminding
  get_sent_unredeemed_contacts: async function () {
    const { Campaign, Contact, ShortUrl } = db.models;
    const unredeemedContacts = await Contact.findAll({
      attributes: [
        ...mailContactAttributes,
        'reminder1_sent',
        'reminder2_sent',
        'reminder3_sent',
        'reminder4_sent',
      ],
      where: {
        [Op.or]: [
          { step: 'sent' },
          { [Op.and]: [{ step: 'ready' }, { '$campaign.send_only_reminder_emails$': true }] },
        ],
        enabled: true,
      },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: [
            ...mailCampaignAttributes,
            'reminder1_date',
            'reminder2_date',
            'reminder3_date',
            'reminder4_date',
            'reminder1_subject',
            'reminder2_subject',
            'reminder3_subject',
            'reminder4_subject',
            'reminder1_content',
            'reminder2_content',
            'reminder3_content',
            'reminder4_content',
          ],
          where: { enabled: true },
        }, {
          model: ShortUrl
        }
      ],
    });

    let contactsToRemind = [];
    const defaultContent = ConstData.REMINDERS_CONTENT;

    unredeemedContacts.forEach(contact => {
      // Check for all four reminders
      [1,2,3,4].forEach(function(i) {
        if (
          !contact[`reminder${i}_sent`] &&
          isLast24Hours(contact['campaign'][`reminder${i}_date`])
        ) {
          return contactsToRemind.push({
            ...contact,
            reminderNumber: i,
            subject: contact['campaign'][`reminder${i}_subject`] || defaultContent[i].subject,
            content: contact['campaign'][`reminder${i}_content`] || defaultContent[i].content,
          });
        }
      });
    });

    return contactsToRemind;
  },

  sent_reminder_to_unreedemed_contacts: async function (unredeemed_contacts) {
    const { Contact } = db.models;
    for (let i = 0; i < unredeemed_contacts.length; i++) {
      const unredeemed_contact = unredeemed_contacts[i];

      if (unredeemed_contact['reminder_type'] === 'reminder1') {
        // Reminder1 date
        await Contact.update(
          { reminder1_sent: true },
          { where: { id: unredeemed_contact['id'] } }
        );
      } else if (unredeemed_contact['reminder_type'] === 'reminder2') {
        //Reminder2 date
        await Contact.update(
          { reminder2_sent: true },
          { where: { id: unredeemed_contact['id'] } }
        );
      } else if (unredeemed_contact['reminder_type'] === 'reminder3') {
        // Reminde3 date
        await Contact.update(
          { reminder3_sent: true },
          { where: { id: unredeemed_contact['id'] } }
        );
      } else if (unredeemed_contact['reminder_type'] === 'reminder4') {
        // Reminder4 date
        await Contact.update(
          { reminder4_sent: true },
          { where: { id: unredeemed_contact['id'] } }
        );
      }
    }
  },

  // Get redeemed contacts which sent from these users
  get_redeemed_contacts: async function (sender_ids, campaignId, page, limit) {
    const { Campaign, Contact, Product } = db.models;
    const offset = (page && limit) ? (page - 1) * limit : 0;

    const contacts = await Contact.findAndCountAll({
      where: {
        step: ['confirmed', 'delivered', 'shipped', 'redeemed'],
        ...(campaignId && { campaignId })
      },
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
          enabled: true,
        },
      },
      raw: true,
      nest: true,
      limit,
      offset
    });
    let redeemed_contacts = contacts.rows;
    // Product short/long description is html content, so make it as html text
    for (let i = 0; i < redeemed_contacts.length; i++) {
      if (redeemed_contacts[i]['productVariantId']) {
        redeemed_contacts[i]['product'] =
          (await Product.findOne({
            where: {
              variant_id: redeemed_contacts[i]['productVariantId'],
            },
            raw: true,
          })) || {};
        const product_content = redeemed_contacts[i]['product']['html_body'];
        const $ = cheerio.load(product_content);
        redeemed_contacts[i]['product']['short-desc'] =
          $('p.short-desc').html();
        redeemed_contacts[i]['product']['long-desc'] =
          $('div.long-desc').html();
      }
    }

    return { rows: redeemed_contacts, count: contacts.count };
  },

  // Get confirmed contacts
  get_confirmed_contacts: async function (limit) {
    const { Campaign, Contact } = db.models;
    return await Contact.findAll({
      where: {
        step: 'confirmed',
        order_id: { [Op.or]: ['', null] },
      },
      include: {
        model: Campaign,
      },
      limit: limit,
    });
  },

  get_on_shopify_contact_order_ids: async function () {
    const { Contact } = db.models;
    // Get order ids which were sent to shopify
    const confirmed_contacts = await Contact.findAll({
      where: {
        [Op.and]: [
          { step: { [Op.or]: ['redeemed', 'shipped'] } },
          { failed_order: false },
          { order_id: { [Op.ne]: '' } },
          { order_id: { [Op.ne]: null } },
        ],
      },
    });

    return confirmed_contacts.map((confirmed_contact) => {
      return confirmed_contact['order_id'];
    });
  },

  get_thanks_note_from_recipients: async function (sort_order, sender_ids, campaignId, filter, page, limit) {
    const { Contact, Campaign } = db.models;
    const offset = limit ? (page - 1) * limit : 0;
    let condition = [{ failed_order: false }];
    if (filter === 'responded') {
      condition = condition.concat([{ thank_note: { [Op.ne]: '' } }, { thank_note: { [Op.ne]: null } }]);
    } else if (filter === 'notresponded') {
      condition.push({ thank_note: { [Op.or]: ['', null] } })
    }
    return Contact.findAndCountAll({
      where: {
        [Op.and]: condition,
        ...(campaignId && { campaignId })
      },
      order: [['thanks_at', sort_order === 'fifo' ? 'ASC' : 'DESC']],
      include: {
        model: Campaign,
        where: {
          userId: sender_ids,
          enabled: true,
        },
      },
      attributes: [
        'from_first_name',
        'from_last_name',
        'from_company_name',
        'thanks_at',
        'to_first_name',
        'to_last_name',
        'to_email',
        'thank_note',
      ],
      limit: limit || null,
      offset,
    });
  },

  /**
   * Filter contacts by view mode and sort them by sort mode
   * When users try to view gifts page, this would be called
   * @param sender_ids
   * @param viewMode
   * @param sort_mode
   * @returns {Promise<Model[]>}
   */
  filter_contacts: async function ({ senderIds, viewMode, sortMode, campaignId, page, limit, search, emailFilter }) {
    const offset = limit ? (page - 1) * limit : 0;
    let condition = campaignId ? { campaignId } : {};
    // Available steps as the "viewMode"
    if (viewMode === 'all') {
      condition.step = [
        'sent',
        'bounced',
        'confirmed',
        'redeemed',
        'canceled',
        'shipped',
        'delivered',
      ];
    } else if (viewMode === 'sent') {
      condition.step = [
        'sent',
        'confirmed',
        'redeemed',
        'canceled',
        'shipped',
        'delivered',
      ];
    } else if (viewMode === 'opened') {
      condition.email_opened = true;
    } else if (viewMode === 'redeemed') {
      condition.step = ['redeemed', 'shipped', 'delivered', 'confirmed'];
      condition.failed_order = false;
    } else if (viewMode === 'unredeemed') {
      condition.step = ['sent', 'bounced', 'canceled'];
    } else if (viewMode === 'failed') {
      condition.step = 'redeemed';
      condition.failed_order = true;
      condition.order_id = null;
    } else if (viewMode === 'canceled') {
      condition[Op.or] = [{ step: 'canceled' }, { step: 'redeemed', order_id: null, failed_order: true }];
    } else {
      condition.step = viewMode;
    }

    if (emailFilter === 'email_opened') {
      condition.email_opened = true;
    } else if (emailFilter === 'email_unopened') {
      condition.email_opened = false;
    } else if (emailFilter === 'email_clicked') {
      condition.email_clicked = true;
    } else if (emailFilter === 'email_not_clicked') {
      condition.email_clicked = false;
    }

    if (search) {
      
      if (condition[Op.or]) {
        condition[Op.and] = [{ [Op.or]: condition[Op.or] }, { [Op.or]: getSearchCondition(search) }];
        delete condition[Op.or];
      } else {
        condition[Op.or] = getSearchCondition(search);
      }
    }

    // Sort array
    let sort_array = [];
    if (sortMode === 'na') {
      sort_array.push(['sent_at', 'DESC NULLS LAST']);
    } else if (sortMode === 'nd') {
      sort_array.push(['to_first_name', 'DESC']);
      sort_array.push(['to_last_name', 'DESC']);
    } else if (sortMode === 'ea') {
      sort_array.push(['to_email', 'ASC']);
    } else if (sortMode === 'ed') {
      sort_array.push(['to_email', 'DESC']);
    } else if (sortMode === 'ta') {
      sort_array.push(['redeemed_at', 'ASC']);
    } else if (sortMode === 'ed') {
      sort_array.push(['redeemed_at', 'DESC']);
    }

    const { Campaign, Contact, Product, ShortUrl } = db.models;

    // Filter contacts match the view mode
    let contacts = await Contact.findAndCountAll({
      where: condition,
      include: [
        { model: Product },
        {
          model: Campaign,
          where: {
            enabled: true,
            userId: senderIds,
          },
        },
        {
          model: ShortUrl
        },
      ],
      order: sort_array,
      raw: true,
      nest: true,
      limit: limit || null,
      offset,
    });

    // Product short/long description is html content, so make it as html text
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i]['productVariantId']) {
        const product_content = contacts[i]['product']['html_body'];
        const $ = cheerio.load(product_content);
        contacts[i]['product']['short-desc'] = $('p.short-desc').html();
        contacts[i]['product']['long-desc'] = $('div.long-desc').html();
      } else {
        contacts[i]['product'] = {};
      }
      contacts[i]['link'] = getCustomerLandingShortUrl({ shortUrl: contacts[i]['shortUrl'], id: contacts[i]['id'] });
    }

    return contacts;
  },

  choose_one_contact: async function (campaign_id) {
    const { Campaign, Contact } = db.models;
    return Contact.findOne({
      where: { campaignId: campaign_id },
      include: Campaign,
    });
  },

  remove_contacts_in_campaign: async function (campaign_id) {
    const { Contact } = db.models;
    await Contact.update(
      { enabled: false },
      { where: { campaignId: campaign_id, step: 'ready' } }
    );
  },

  get_ready_contacts_in_campaign: async function ({ campaignId, includeContactsWithDeliveryDate }) {
    const { Campaign, Contact, ShortUrl } = db.models;
    return await Contact.findAll({
      where: {
        step: 'ready',
        campaignId,
        ...(!includeContactsWithDeliveryDate && { delivery_date: null })
      },
      attributes: mailContactAttributes,
      include: [
        { model: Campaign, attributes: mailCampaignAttributes }, 
        { model: ShortUrl },
      ],
    });
  },

  gift_email_sent: async function (contacts) {
    const { Contact } = db.models;

    const contactIds = contacts.map((contact) => contact.id);

    await Contact.update(
      { step: 'sent', sent_at: new Date() },
      {
        where: {
          id: contactIds,
        },
      }
    );
    return true;
  },

  gift_email_not_sent: async function (contacts) {
    const { Contact } = db.models;

    const contactIds = contacts.map((contact) => contact.id);

    await Contact.update(
      { step: 'ready' },
      {
        where: {
          id: contactIds,
        },
      }
    );
    return true;
  },

  confirm_contact: async function ({ transaction, data: {
      contact_id,
      variant_id,
      first_name: shipping_first_name,
      last_name: shipping_last_name,
      address: shipping_address,
      apartment: shipping_apartment,
      city: shipping_city,
      state: shipping_state,
      zip_code: shipping_zip_code,
      country: shipping_country,
      phone: shipping_phone,
      hometown,
      coords,
      email: shipping_email,
      state,
    }
  }) {
    const { Contact } = db.models;
    let contact = await Contact.findByPk(contact_id);
    if (contact && !checkIfInactive(contact.step)) {
      const sent_date = contact['sent_at'] || new Date();
      const email_opened_date = contact['email_opened_at'] || new Date();
      const email_clicked_date = contact['email_clicked_at'] || new Date();
      const updatedContact = await Contact.update({
        productVariantId: variant_id,
        shipping_first_name,
        shipping_last_name,
        shipping_address,
        shipping_apartment,
        shipping_city,
        shipping_state,
        shipping_zip_code,
        shipping_country,
        shipping_phone,
        shipping_email: shipping_email || contact['to_email'],
        step: 'confirmed',
        email_opened: true,
        email_clicked: true,
        sent_at: sent_date,
        confirmed_at: new Date(),
        email_opened_at: email_opened_date,
        email_clicked_at: email_clicked_date,
        hometown,
        coords,
        state
      }, {
        where: {
          id: contact_id,
          step: ['sending', 'sent', 'ready', 'bounced', 'reactivated']
        },
        transaction,
        lock: true,
      });
      return updatedContact[0] ? contact : null;
    }
  },

  createContactForMultipleRedemptionsCampaign: async function({ data, transaction }) {
    const { Contact } = db.models;
    const {
      campaignId, 
      vid,
      first_name: shipping_first_name,
      last_name: shipping_last_name,
      address: shipping_address,
      apartment: shipping_apartment,
      city: shipping_city,
      state: shipping_state,
      zip_code: shipping_zip_code,
      country: shipping_country,
      phone: shipping_phone,
      hometown,
      coords,
      email,
      state,
      to_company_name,
    } = data;
    const [contact, created] = await Contact.findOrCreate(
      { 
        where: { to_email: email, campaignId },
        defaults: {
          productVariantId: vid,
          to_first_name: shipping_first_name,
          to_last_name: shipping_last_name,
          shipping_first_name,
          shipping_last_name,
          shipping_address,
          shipping_apartment,
          shipping_city,
          shipping_state,
          shipping_zip_code,
          shipping_country,
          shipping_phone,
          shipping_email: email,
          to_email: email,
          to_company_name,
          step: 'confirmed',
          confirmed_at: new Date(),
          hometown,
          coords,
          state,
          campaignId,
        },
        transaction,
        lock: true,
      },
    );
    return created ? contact : null;
  },

  add_thank_note: async function (contact_id, thank_note) {
    const { Contact } = db.models;
    let contact = await Contact.findByPk(contact_id);
    if (contact) {
      await contact.update({
        thank_note,
        thanks_at: new Date(),
      });
    }
    return contact;
  },

  order_created: async function (contact_id, orderData, failed_reason) {
    const { Contact, FailedContact } = db.models;
    let contact = await Contact.findByPk(contact_id);
    if (contact) {
      // Order created successfully
      if (orderData && orderData.orderId) {
        await contact.update({
          step: 'redeemed',
          order_id: orderData.orderId,
          redeemed_at: new Date(),
        });
      }
      // Order creation failed
      else if (orderData.saveAsFailed) {
        await FailedContact.create({
          reason: failed_reason,
          contactId: contact_id,
        });
        // Update contact to redeemed manually to avoid repeat creating order on the later cron jobs
        await contact.update({
          step: 'redeemed',
          failed_order: true,
        });
        console.error(`Order Failed for Contact Id: ${contact_id}`);
      }
    }
  },

  order_declined: async function (order_id) {
    const { Contact } = db.models;
    await Contact.update(
      {
        step: 'canceled',
      },
      { where: { order_id: order_id } }
    );
  },

  order_tracked: async function (order_id, tracking_number, tracking_url) {
    const { Contact } = db.models;
    await Contact.update(
      {
        tracking_number: tracking_number,
        tracking_url: tracking_url,
        step: 'shipped',
      },
      { where: { order_id: order_id } }
    );
  },

  order_delivered: async function (order_id, tracking_number, tracking_url) {
    const { Contact } = db.models;
    await Contact.update(
      {
        tracking_number: tracking_number,
        tracking_url: tracking_url,
        step: 'delivered',
      },
      { where: { order_id: order_id } }
    );
  },

  delete: async function (contact_id) {
    const { Contact } = db.models;
    let contact = await Contact.findByPk(contact_id);
    if (contact) {
      await contact.destroy();
    }
    return true;
  },

  searchContacts: async function({ query, type, page, pageLimit }) {
    const { Contact, Campaign, User } = db.models;
    const campaignFilterFields = ['campaign_title']
    const userFilterFields = ['client_name', 'client_email']
    let where = {};
    let campaignFilter = {};
    let userFilter = {};

    if (type && type !== 'short_url' && !campaignFilterFields.includes(type) && !userFilterFields.includes(type)) {
      where = type === 'email'
        ? { [Op.or]: [{ shipping_email: { [Op.iLike]: query } }, { to_email: { [Op.iLike]: query } } ] }
        : { [type]: { [Op.iLike]: query } };
    }

    if (type && type ==='short_url') {
      const contactIds = await this.getContactIdsFromShortUrl(query);

      where = {
        id: { [Op.in]: contactIds }
      }
    }

    if (type && campaignFilterFields.includes(type) && !userFilterFields.includes(type)) {
      campaignFilter = {
        title: {
          [Op.like]: `%${query}%`,
        },
      }
    }

    if (type && !campaignFilterFields.includes(type) && userFilterFields.includes(type)) {
      if (type === 'client_name') {
        userFilter = {
          name: {
            [Op.like]: `%${query}%`,
          },
        }
      }
      if (type === 'client_email') {
        userFilter = {
          email: {
            [Op.like]: `%${query}%`,
          },
        }
      }
    }

    const contacts = await Contact.findAndCountAll({
      include: [{
        model: Campaign,
        where: campaignFilter,
        include: [{
          model: User,
          where: userFilter,
        }]
      }],
      where,
      limit: pageLimit,
      offset: (page - 1) * pageLimit
    });
    return contacts;
  },

  getContactIdsFromShortUrl: async function(url) {
    const { ShortUrl } = db.models;
    const pathname = isValidHttpUrl(url) ? (new URL(url)).pathname : url
    const suffix = pathname.slice(pathname.indexOf('/s/') + 3)

    const shortUrls = await ShortUrl.findAll({
      where: {
        suffix: {
          [Op.like]: `%${suffix}%`,
        },
      },
    });

    return shortUrls.map((shortUrl) => shortUrl.contactId)
  },

  getScheduledContacts: async function() {
    const { Contact, Campaign, ShortUrl } = db.models;
    return await Contact.findAll({
      attributes: mailContactAttributes,
      where: {
        step: 'ready',
        delivery_date: priorToNowCondition(),
      },
      include: [{
        model: Campaign,
        attributes: mailCampaignAttributes,
        where: {
          enabled: true,
          archived: false,
          no_email_invite: false,
          [Op.or]: [
            { expire_date: { [Op.gte]: new Date() }, },
            { expire_date: null },
          ]
        }
      }, {
        model: ShortUrl
      }],
    });
  },
  getAllFailedContacts: async function(campaignId) {
    const { Contact } = db.models;
    return await Contact.findAll({
      where: {
        step: ['canceled', 'redeemed'],
        failed_order: true,
        campaignId,
        order_id: null
      },
      attributes: ['id']
    });
  },
  batchReactivateContacts: async function(contacts, campaignPrice) {
    const { Contact } = db.models;
    return await Contact.update(
      { step: 'reactivated', failed_order: false, order_id: null }, 
      { where: { id: contacts } }
    );
  },
  decline_contact: async function ({ contactId, reason, reasonText }) {
    const { Contact } = db.models;
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      throw new Error('Contact not found');
    }

    const isStatusInactive = checkIfInactive(contact.step);
    if (isStatusInactive) {
      throw new Error('Contact is already inactive');
    }

    const declineReason = reason === 'reason-other' ? `Other: ${reasonText}` : reason;
    await contact.update({
      step: 'declined',
      decline_reason: declineReason,
    });

    return contact;
  },
  getUserTopGifts: async function(userIds, campaignIds) {
    const gifts = await db.sequelize.query(
      `SELECT count(p.product_id) as redemption_number, product_title, image_data
        FROM public.contacts c
        LEFT JOIN products p on p.variant_id = c."productVariantId"
        LEFT JOIN campaigns ca on c."campaignId" = ca.id
        WHERE "userId" IN (:userIds) AND c."productVariantId" IS NOT NULL ${campaignIds.length ? 'AND "campaignId" IN (:campaignIds)' : ''}
        GROUP BY product_title, product_id, image_data ORDER BY count(p.product_id) DESC
        LIMIT 20;`, 
      {
        replacements: { userIds, campaignIds: campaignIds },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );
    return gifts;
  },
  getUserContactCount: async function(userIds, campaignIds) {
    const { Contact, Campaign } = db.models;
    return await Contact.count({
      where: {
        step: redeemedStatuses,
      },
      include: [{
        model: Campaign,
        where: {
          userId: userIds,
          ...(campaignIds.length && { id: campaignIds })
        }
      }]
    });
  }
};
