const db = require('../sequelize');
const Helper = require('../../util/helper');
const { where, fn, col, Op } = require('sequelize');
const moment = require('moment');
const ShortUrlBridge = require('../../models/bridge/ShortUrlBridge');
const { getCustomerLandingPath } = require('../../api/url');
const { checkIfRedeemed, inactiveStatuses } = require('../../api/status');
const { filterAndSortProductsByOrder, addOrRemoveProduct, groupCampaignProductsForLanding } = require('../../api/product');
const { useTimezone, formatToPSTTimezone, priorToNowCondition } = require('../../api/time');
const { createRecordsInBatches } = require('../../api/db');
const { sequelize } = require('../sequelize')
const ConstData = require('../../util/const_data');

module.exports = {
  list_all: async function ({
    user_id,
    with_products,
    is_viewer_admin,
    filter,
    type,
    withContactCount
  }) {
    const { Campaign, Contact } = db.models;
    let whereCondition = {
      enabled: true,
    };

    if (!is_viewer_admin) {
      whereCondition.userId = user_id;
      whereCondition.archived = false;
    }
    if (filter) {
      whereCondition.title = where(
        fn('LOWER', col('title')),
        'LIKE',
        '%' + filter.toLowerCase() + '%'
      );
    }
    if (type === 'live') {
      whereCondition.is_sent = true;
      whereCondition.archived = false;
    } else if (type === 'archived') {
      whereCondition.archived = true;
    } else if (type === 'starred') {
      whereCondition.is_starred = true
    } else if (type === 'unique-url') {
      whereCondition.no_email_invite = true
    }

    const includedModels = withContactCount 
      ? [{ model: Contact, attributes: ['id', 'step'], where: { step: { [Op.not]: 'expired' } }, required: false }] 
      : [];

    let campaigns = await Campaign.findAll({
      where: whereCondition,
      attributes: [
        'id', 
        'title', 
        'expire_date', 
        'archived', 
        'sent_at', 
        'is_scheduled', 
        'scheduled_date', 
        'scheduled_tz', 
        'enabled', 
        'no_email_invite', 
        'is_starred', 
        'product_orders', 
        'excluded_products', 
        'added_products',
        'createdAt',
      ],
      include: includedModels,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    
    for (let i = 0; i < campaigns.length; i++) {
      if (with_products) {
        products = await this.getCampaignProducts({ campaign: campaigns[i], withVariants: false });
        campaigns[i]['products'] = products.slice(0, 12);
      }
      if (withContactCount) {
        campaigns[i]['hasSentContacts'] = campaigns[i]['is_sent'] || 
          campaigns[i].contacts.some(contact => (contact.step !== 'ready' && contact.step !== 'expired'));
      }
    }

    return campaigns;
  },

  get_one: async function (user_id, campaign_id, is_admin, withProducts) {
    const { Campaign, User, SignatureCollection, CampaignAccount, ShortUrl } = db.models;
    const useShopifyProxy = process.env.USE_SHOPIFY_PROXY && process.env.USE_SHOPIFY_PROXY !== 'false';
    let whereCondition = { enabled: true, id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    let campaign = await Campaign.findOne({
      where: whereCondition,
      include: [{
        model: User,
        attributes: ['parent_id']
      },
      {
        model: SignatureCollection,
        attributes: ['type', 'product_order', 'shopify_id']
      }, {
        model: CampaignAccount,
        attributes: ['credit_amount']
      }, {
        model: ShortUrl,
        attributes: ['suffix'],
        required: false,
      }]
    });

    if (withProducts) {
      const products = await this.getCampaignProducts({ campaign, withVariants: true });
      campaign.products = groupCampaignProductsForLanding({ products, useShopifyProxy });
    }

    return campaign;
  },

  get_campaign_reports: async function (sender_ids, campaignId) {
    const { Campaign, Contact, User } = db.models;

    let campaign_report_data = await Campaign.findAll({
      where: { enabled: true, userId: sender_ids, ...(campaignId && { id: campaignId }) },
      attributes: ['id', 'title', 'price', 'sent_at'],
      include: [
        {
          model: User,
          attributes: ['email', 'firstname', 'lastname', 'company'],
        },
        {
          model: Contact,
          attributes: ['id', 'step'],
          where: {
            step: [
              'sent',
              'confirmed',
              'redeemed',
              'canceled',
              'shipped',
              'delivered',
            ],
          }
        }
      ],
      order: [['sent_at', 'DESC NULLS LAST']],
    });

    for (let i = 0; i < campaign_report_data.length; i++) {
      const contacts = campaign_report_data[i]?.contacts || [];
      const redemption_count = contacts.filter(item =>
        checkIfRedeemed(item['step'])
      ).length;
      campaign_report_data[i]['sent_count'] = contacts.length;
      campaign_report_data[i]['redemption_rate'] =
        contacts.length === 0
          ? 0
          : Math.round((redemption_count * 100) / (contacts.length || 1));
    }

    return campaign_report_data;
  },

  get_preview_info: async function (campaign_id) {
    const { Campaign } = db.models;

    const campaign = await Campaign.findOne({
      where: { id: campaign_id, enabled: true },
      raw: true,
    });
    if (!campaign) {
      return false;
    }
    let products = await this.getCampaignProducts({ campaign, withVariants: false });
    for (let i = 0; i < products.length; i++) {
      if (
        products[i]['tags'].filter((item) => item.trim() === 'donation').length
      ) {
        products[i]['is_donation'] = true;
      }
    }
    return {
      ...campaign,
      products,
    };
  },

  list_unsent: async function () {
    const { Campaign, Contact } = db.models;
    // Unsent campaigns
    const unsentCampaigns = await Campaign.findAll({
      where: { enabled: true, archived: false, no_email_invite: false },
      attributes: {
        include: [[fn('COUNT', col('contacts.id')), 'contactCount']]
      },
      include: {
        model: Contact,
        where: {
          step: 'ready',
          enabled: true
        },
        attributes: []
      },
      group: ['campaign.id'],
      order: [['is_starred', 'DESC'], ['updatedAt', 'DESC']],
      raw: true
    });

    // Only return campaigns which have one or more unsent contacts
    return unsentCampaigns.filter(campaign => (parseInt(campaign.contactCount) > 0));
  },

  list_products: async function (
    user_id,
    campaign_id,
    offset,
    count,
    is_admin
  ) {
    const { Campaign, SignatureCollection } = db.models;
    let whereCondition = {
      enabled: true,
      id: campaign_id,
    };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
      include: [SignatureCollection]
    });

    if (campaign) {
      let products = await this.getCampaignProducts({ campaign, withVariants: false });

      if (count > 0) {
        products = products.slice(offset, offset + count);
      }

      return products;
    } else {
      return [];
    }
  },

  create_campaign: async function (user_id, campaign_data, credits_to_earmark) {
    const { Campaign, Contact, SignatureCollection } = db.models;
    const isV2 = process.env.PLATFORM_VERSION >= 2;
    const campaign_products = campaign_data['products'];
    const campaign_contacts = campaign_data['contacts'];
    const monthsToExpiration = campaign_data['months_to_expiration'];
    let expireDate = moment().add(parseInt(monthsToExpiration) || 12, 'months');
    expireDate = moment.utc(expireDate);
    expireDate = moment(expireDate).set({
      hour: 15,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    const collection = await SignatureCollection.findOne({
      where: { shopify_id: campaign_data?.collection_id },
      attributes: ['product_order']
    });
    const isMultipleProductOrder = collection?.product_order.split(',')?.length > 1 ?? false;
    const singleProduct = (campaign_data?.products?.length === 1 || !isMultipleProductOrder) ?? false;

    if (
      ((campaign_products && campaign_products.length) || campaign_data['collection_id']) &&
      campaign_contacts &&
      campaign_contacts.length
    ) {
      const isCollectionType = isV2 && (!campaign_products ||!campaign_products.length);
      // Create campaign record
      const campaign = await Campaign.create({
        title: campaign_data['title'],
        message: campaign_data['brands']['message'],
        email_message: campaign_data['brands']['email_message'],
        email_subject: campaign_data['brands']['email_subject'],
        signature: campaign_data['brands']['signature'],
        video_url: campaign_data['brands']['video'],
        logo_url: campaign_data['brands']['logo'],
        banner_url: campaign_data['brands']['banner'],
        landing_include_logo: isCollectionType ? !!campaign_data['brands']['landing_include_logo'] : null,
        landing_include_banner: isCollectionType ? !!campaign_data['brands']['landing_include_banner'] : null,
        email_include_logo: isCollectionType ? !!campaign_data['brands']['email_include_logo'] : null,
        email_include_banner: isCollectionType ? !!campaign_data['brands']['email_include_banner'] : null,
        email_include_gfg_logo: !!campaign_data['brands']['email_include_gfg_logo'],
        userId: user_id,
        is_scheduled: campaign_data['brands']['scheduled'],
        scheduled_date:
          typeof campaign_data['brands']['scheduled_datetime'] == 'string'
            ? campaign_data['brands']['scheduled_datetime'].slice(0, 19) +
              ':00' +
              moment.tz(campaign_data['brands']['scheduled_tz']).format('Z')
            : null,
        scheduled_tz: campaign_data['brands']['scheduled_tz'],
        expire_date: expireDate,
        price: campaign_data['price'],
        is_starred: true,
        collection_id: campaign_data['collection_type'] !== 'campaign' ? campaign_data['collection_id'] : null,
        is_collection_products_type: isCollectionType,
        donate_unredeemed: campaign_data['donate_unredeemed'],
        no_email_invite: campaign_data['no_email_invite'],
        single_product: singleProduct,
      });

      // Create relationships between the products records and the campaign record (only for old app version)
      if (!isCollectionType) {
        await this.addCampaignProducts({ products: campaign_products, campaignId: campaign.id });
      }

      let pastDatesCount = 0;
      let newDeliveryDate = '';
      // Create contacts records
      const contactsToInsert = campaign_contacts.map(contact => {
        const { send_on_date, send_on_time } = contact;
        let combinedDateAndTime = (send_on_date && send_on_time) ? `${send_on_date} ${send_on_time}` : null;

        if (send_on_date && !send_on_time) {
            combinedDateAndTime = `${send_on_date} 09:00`;
        }

        const isPastDate = combinedDateAndTime && moment().diff(moment(combinedDateAndTime)) > 0;
        if (isPastDate) {
          pastDatesCount++;
          newDeliveryDate = moment().add(1, 'days');
        }
        return {
          from_first_name: contact['from_first_name'],
          from_last_name: contact['from_last_name'],
          from_company_name: contact['from_company_name'],
          from_email: contact['from_email'],
          to_first_name: contact['to_first_name'],
          to_last_name: contact['to_last_name'],
          to_company_name: contact['to_company_name'],
          to_email: contact['to_email'],
          campaignId: campaign['id'],
          // Delivery date is relative to PST time
          delivery_date: isPastDate ? newDeliveryDate : useTimezone(combinedDateAndTime),
        }
      });
      const insertedContacts = await createRecordsInBatches({ data: contactsToInsert, batchSize: 1000, model: Contact });
      await ShortUrlBridge.createForAll(insertedContacts);

      const contactsCount = contactsToInsert.length;

      return { campaign, contactsCount , pastDatesCount, newDeliveryDate: formatToPSTTimezone(newDeliveryDate) };
    }
  },

  add_new_contacts: async function (
    user_id,
    campaign_id,
    new_contacts,
    is_admin,
    transaction
  ) {
    const { Campaign, Contact } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });
    if (!campaign || new_contacts.length === 0) {
      return false;
    }

    let pastDatesCount = 0;
    let newDeliveryDate = '';
    let insertedContacts = [];
    // Create contacts records
    for (let i = 0; i < new_contacts.length; i++) {
      const { send_on_date, send_on_time } = new_contacts[i];
      const combinedDateAndTime = (send_on_date && send_on_time) ? `${send_on_date} ${send_on_time}` : null;
      const isPastDate = combinedDateAndTime && moment().diff(moment(combinedDateAndTime)) > 0;
      if (isPastDate) {
        pastDatesCount++;
        newDeliveryDate = moment().add(1, 'days');
      }
      const contact = await Contact.create({
        from_first_name: new_contacts[i]['from_first_name'],
        from_last_name: new_contacts[i]['from_last_name'],
        from_company_name: new_contacts[i]['from_company_name'],
        from_email: new_contacts[i]['from_email'],
        to_first_name: new_contacts[i]['to_first_name'],
        to_last_name: new_contacts[i]['to_last_name'],
        to_company_name: new_contacts[i]['to_company_name'],
        to_email: new_contacts[i]['to_email'],
        campaignId: campaign_id,
        // Delivery date is relative to PST time
        delivery_date: isPastDate ? newDeliveryDate : useTimezone(combinedDateAndTime),
      }, { transaction });
      insertedContacts.push(contact);
    }
    await campaign.update({
      is_starred: true
    }, { transaction });
    return { insertedContacts, contactsCampaign: campaign };
  },

  rename_campaign: async function (user_id, campaign_id, new_campaign_title) {
    const { Campaign } = db.models;
    const campaign = await Campaign.findOne({
      where: {
        userId: user_id,
        id: campaign_id,
      },
    });

    if (campaign) {
      await campaign.update({ title: new_campaign_title });
      return true;
    } else {
      return false;
    }
  },

  update_campaign: async function (campaign_id, user_id, updateData, is_admin) {
    const { Campaign } = db.models;

    const where = is_admin
      ? {
          id: campaign_id,
        }
      : user_id
      ? {
          userId: user_id,
          id: campaign_id,
        }
      : {
          id: campaign_id,
        };

    const updated_campaigns = await Campaign.update(updateData, {
      where: where,
    });
    return updated_campaigns.length > 0;
  },

  remove_product: async function (user_id, campaign_id, variant_id, is_admin, single_product) {
    const { Campaign, Product } = db.models;
    let whereCondition = {
      id: campaign_id,
    };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });

    const product = await Product.findOne({ where: { variant_id }, attributes: ['product_id'] })
    if (campaign) {
      if (Helper.isTrue(campaign.is_collection_products_type)) {
        const { newList, shouldAddEntry } = addOrRemoveProduct({ product: product.product_id, sourceList: campaign.added_products, targetList: campaign.excluded_products });
        const newValue = shouldAddEntry ? { excluded_products: newList } : { added_products: newList };

        await Campaign.update({
          ...newValue,
          single_product,
        }, { where: whereCondition });
      } else {
        const query =
          'DELETE FROM "productCampaign" WHERE "campaign_id"=:campaign_id AND "product_id"=:variant_id';
        await db.sequelize.query(query, {
          replacements: { campaign_id: campaign_id, variant_id },
          type: db.Sequelize.QueryTypes.DELETE,
        });
      }
      return true;
    } else {
      return false;
    }
  },

  add_product: async function (user_id, campaign_id, product_id, is_admin, single_product, variant_id) {
    const { Campaign, Product } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }

    const campaign = await Campaign.findOne({
      where: whereCondition,
    });
    const product = await Product.findOne({
      where: {product_id: product_id}
    });

    if (campaign && product) {
      if (Helper.isTrue(campaign.is_collection_products_type)) {
        const { newList, shouldAddEntry } = addOrRemoveProduct({ product: product.product_id, sourceList: campaign.excluded_products, targetList: campaign.added_products });
        const newValue = shouldAddEntry ? { added_products: newList } : { excluded_products: newList };
        await Campaign.update({
          ...newValue,
          single_product,
        }, { where: whereCondition });
      } else {
        let query =
          'SELECT "product_id" FROM "productCampaign" WHERE "campaign_id"=:campaign_id AND "product_id"=:product_id';
        const result = await db.sequelize.query(query, {
          replacements: { campaign_id, product_id },
          type: db.Sequelize.QueryTypes.SELECT,
        });

        if (result.length > 0) {
          // already exist
          return { status: false, msg: 'This product was already added.' };
        } else {
          const sql = `INSERT INTO "productCampaign" ("campaign_id","product_id","createdAt","updatedAt")
          VALUES (:campaign_id,:product_id,:createdAt,:updatedAt)`;
          await db.sequelize.query(sql, {
            replacements: {
              campaign_id,
              product_id: variant_id.toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            type: db.Sequelize.QueryTypes.INSERT,
          });
          let productOrders = campaign['product_orders'];
          await campaign.update({
            product_orders: productOrders + ',' + product['product_id'],
          });
        }
      }
      return { status: true, msg: 'Product has been added.', product };
    } else {
      return { status: false, msg: 'Campaign is not exist.' };
    }
  },

  /**
   * Change sequence of products in the campaign
   * @param user_id
   * @param campaign_id
   * @param changed_product_id   Moving product
   * @param previous_product_id  The product which moving product should be placed after
   * @returns {Promise<{msg: string, status: boolean}>}
   */
  change_sequence: async function (
    user_id,
    campaign_id,
    changed_product_id,
    previous_product_id,
    is_admin,
    currentOrder
  ) {
    const { Campaign, SignatureCollection } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
      include: [SignatureCollection]
    });

    if (campaign) {
      const products = await this.getCampaignProducts({ campaign, withVariants: false });
      const order = products.map((product) => product.product_id);
      const currentIndex = order.indexOf(changed_product_id);
      // Remove at current index
      if (currentIndex > -1) {
        order.splice(currentIndex, 1);
      }
      const previousIndex = order.indexOf(previous_product_id);
      // Insert after the product
      if (previous_product_id && previousIndex > -1) {
        order.splice(previousIndex, 0, changed_product_id);
      } else {
        order.push(changed_product_id);
      }

      await campaign.update({ product_orders: order.join(',') });
      return { status: true, msg: 'Product sequence has been changed.' };
    } else {
      return { status: false, msg: 'Campaign is not exist.' };
    }
  },

  update_product_order: async function (collectionId, newProducts = []) {
    const { Campaign } = db.models;

    if (!collectionId || !newProducts.length) {
      return;
    }

    const campaigns = await Campaign.findAll({
      attributes: ['id', 'product_orders'],
      where: {
        collection_id: collectionId,
      },
    });

    for (const campaign of campaigns) {
      if (campaign.product_orders) {
        const currentProducts = campaign.product_orders.split(',').map((x) => x.toString());
        const newProductsInCampaign = newProducts.map((x) => x.toString()).filter((x) => !currentProducts.includes(x));
        const order = [...currentProducts, ...newProductsInCampaign];

        await campaign.update({ product_orders: order.join(',') });
      }
    }
  },

  // Update campaign with new produts
  update_products: async function (user_id, campaign_id, products_ids) {
    const { Campaign } = db.models;
    const campaign = await Campaign.findOne({
      where: {
        userId: user_id,
        id: campaign_id,
      },
    });

    if (campaign) {
      let query =
        'SELECT "product_id" FROM "productCampaign" WHERE "campaign_id"=:campaign_id';
      const result = await db.sequelize.query(query, {
        replacements: { campaign_id },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      const current_products_ids = result.map((record) => record['product_id']);

      const to_remove_ids = current_products_ids.filter(
        (id) => !products_ids.includes(id)
      );
      const to_add_ids = products_ids.filter(
        (id) => !current_products_ids.includes(id)
      );

      // Add new products' relations
      for (let i = 0; i < to_add_ids.length; i++) {
        query =
          'INSERT INTO "productCampaign" ("campaign_id","product_id","createdAt","updatedAt") ' +
          'VALUES (:campaign_id,:product_id,:createdAt,:updatedAt)';
        await db.sequelize.query(query, {
          replacements: {
            campaign_id,
            product_id: to_add_ids[i],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          type: db.Sequelize.QueryTypes.INSERT,
        });
      }

      // Remove products' relations
      if (to_remove_ids.length > 0) {
        query =
          'DELETE FROM "productCampaign" WHERE "campaign_id"=:campaign_id AND "product_id" IN (:products_ids)';
        await db.sequelize.query(query, {
          replacements: {
            campaign_id,
            products_ids: to_remove_ids,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          type: db.Sequelize.QueryTypes.INSERT,
        });
      }

      return true;
    } else {
      return false;
    }
  },

  update_campaign_email_subject: async function (
    user_id,
    campaign_id,
    email_subject,
    is_admin
  ) {
    const { Campaign } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });
    if (campaign) {
      await campaign.update({ email_subject });
      return true;
    } else {
      return false;
    }
  },

  update_campaign_email_message: async function (
    user_id,
    campaign_id,
    email_message,
    is_admin
  ) {
    const { Campaign } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });
    if (campaign) {
      await campaign.update({ email_message });
      return true;
    } else {
      return false;
    }
  },

  update_campaign_message: async function (
    user_id,
    campaign_id,
    message,
    is_admin
  ) {
    const { Campaign } = db.models;
    let whereCondition = { id: campaign_id };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });
    if (campaign) {
      await campaign.update({ message });
      return true;
    } else {
      return false;
    }
  },

  update_campaign_settings: async function (user_id, campaign_data, is_admin) {
    const { Campaign, CampaignAccount, Contact, SavingsAccount, CreditTransaction } = db.models;

    let whereCondition = { id: campaign_data.cid };
    if (!is_admin) {
      whereCondition.userId = user_id;
    }
    const campaign = await Campaign.findOne({
      where: whereCondition,
    });

    const campaignAccount = await CampaignAccount.findOne({
      where: {
        campaignId: campaign_data.cid,
      },
    });

    if (!campaign || !campaignAccount) return;

    const campaignExpirationDate = moment(campaign.expire_date);
    const updatedCampaignExpirationDate = moment(campaign_data.expire_date);

    if (campaignAccount.closed && campaignExpirationDate < updatedCampaignExpirationDate) {
      const activeContacts = await Contact.findAndCountAll({
        where:
          {
            campaignId: campaign_data.cid,
            step: {
              [Op.notIn]: inactiveStatuses
            }
          }
      });
      const activeContactsCount = activeContacts.count;
      const giftPrice = campaign.price
      const refundCreditsAmount = activeContactsCount * giftPrice;

      const savingsAccount = await SavingsAccount.findOne({ where: { userId: campaign.userId } });
      const savingsAccountBalance = savingsAccount.balance;

      if (savingsAccountBalance < refundCreditsAmount) {
        return { errorMessage: 'Not enough credits in savings account' };
      }

      const transaction = await sequelize.transaction();
      try {
        await campaignAccount.update({ closed: false }, { transaction });
        await savingsAccount.update({ balance: savingsAccountBalance - refundCreditsAmount }, { transaction });
        await campaignAccount.update({
          closed: false,
          credit_amount: campaignAccount.credit_amount + refundCreditsAmount
        }, { transaction });

        await CreditTransaction.create({
          userId: campaign.userId,
          creditAmount: refundCreditsAmount,
          comment: 'Refund credits from savings account to campaign account',
          type: ConstData.WITHDRAWL_TRANSACTION,
          savingsAccountId: savingsAccount.id,
          savingsBalance: savingsAccountBalance - refundCreditsAmount,
          campaignId: campaign.id,
          campaignBalance: campaignAccount.credit_amount + refundCreditsAmount,
        }, { transaction });

        transaction.commit();
      } catch (error) {
        transaction.rollback();
        console.error(error);
      }
    }

    const data = Helper.change_empty_fields_to_null(campaign_data);
    data['scheduled_date'] = useTimezone(data['scheduled_date'], data['scheduled_tz']);
    [1,2,3,4].forEach(i => {
      const reminderKey = `reminder${i}_date`;
      data[reminderKey] = useTimezone(data[reminderKey], data['scheduled_tz']);
    });

    data.authenticationProviderId = data.authenticationProviderId || campaign.authenticationProviderId;
    if (data.authenticationProviderId === 'none') {
      data.authenticationProviderId = null;
    }

    await campaign.update(data);
    return { campaign };
  },

  /**
   * Update campaign status to "sent"
   * @param campaign_id
   * @returns {Promise<Model>}
   */
  update_campaign_sent: async function (campaign_id) {
    const { Campaign } = db.models;
    let campaign = await Campaign.findByPk(campaign_id);
    if (campaign) {
      await campaign.update({ is_sent: true, sent_at: new Date(), is_starred: false });
    }
    return campaign;
  },

  /**
   * Get all unsent campaigns that are schedule for autosend
   * @param campaign_id
   * @returns {Promise<Model>}
   */
  get_todays_scheduled_campaigns: async function () {
    const { Campaign } = db.models;

    const campaigns = await Campaign.findAll({
      where: {
        enabled: true,
        archived: false,
        is_scheduled: true,
        no_email_invite: false,
        scheduled_date: priorToNowCondition(),
      },
      order: [['createdAt', 'ASC']],
    });

    return campaigns;
  },
  getTotalCampaignPrice: async function (campaign_id) {
    const { Contact, Campaign } = db.models;
    const contacts = await Contact.findAndCountAll({
      where: { campaignId: campaign_id },
      raw: true,
      attributes: [],
      include: [
        { model: Campaign, attributes: ['price'] }
      ]
    });
    return contacts.count * contacts.rows[0]['campaign.price'];
  },
  getUserCampaigns: async function(userId) {
    const { Campaign } = db.models;
    const userCampaigns = await Campaign.findAll({
      attributes: ['id', 'title'],
      where: { userId, enabled: true },
      order: [
        ['title', 'ASC'],
      ]
    });
    return userCampaigns;
  },
  getAndSortCampaignProducts: async function({ query, replacements, order, addedProducts }) {
    let products = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return filterAndSortProductsByOrder({ products, order, addedProducts });
  },
  addCampaignProducts: async function({ products, campaignId }) {
    for (let i = 0; i < products.length; i++) {
      const query =
        'INSERT INTO "productCampaign" ("campaign_id","product_id","createdAt","updatedAt") ' +
        'VALUES (:campaign_id,:product_id,:createdAt,:updatedAt)';
      await db.sequelize.query(query, {
        replacements: {
          campaign_id: campaignId,
          product_id: products[i]['variant_id'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        type: db.Sequelize.QueryTypes.INSERT,
      });
    }
  },
  duplicateCampaign: async function (campaignId, userId) {
    const { Product, Campaign } = db.models;
    const data = await Campaign.findOne({
      where: { id: campaignId },
      include: Product,
    });
    if (data.price <= 0) {
      return { error: 'Campaign cannot have price 0' };
    }
    try {
      const dup_campaign = await Campaign.create({
        title: '(copy)' + data.title,
        message: data.message,
        video_url: data.video_url,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        userId: userId,
        is_scheduled: false,
        scheduled_date: Date.now() + 100,
        scheduled_tz: Date.now() + 100,
        expire_date: Date.now() + 100,
        price: data.price,
        collection_id: data.collection_id,
        reminder1_subject:
          'Gentle reminder: :from_company_name has sent you a gift for good!',
        reminder1_content:
          ":to_first_name, <br/>A<br/> quick reminder that :from_first_name at :from_company_name sent you a collection of gift choices and you never redeemed your gift. Don't forget to claim your gift and read how it's changing someone's life around the world. Let's do some good!",
        reminder2_subject:
          'Friendly reminder: redeem your gift that gives back from :from_company_name',
        reminder2_content:
          ":to_first_name, <br/><br/>Just a friendly reminder that :from_company_name sent you a gift that you never redeemed. By choosing a gift, you will help to support a nonprofit or small business in need. So this is just a gentle reminder that there's still time to choose an awesome gift and do some good! ",
        reminder3_subject:
          'Reminder: choose your gift from :from_company_name and change the world!',
        reminder3_content:
          ":to_first_name, <br/><br/>Just a friendly reminder that your gift from :from_company_name will expire soon. And along with it, the opportunity to do good. By redeeming a gift, you will help to support a charitable cause around the world. We hope you'll choose to gift it forward by enjoying a great gift that does good in the world!",
        reminder4_subject:
          'Last chance to redeem your gift from :from_company_name',
        reminder4_content:
          'Your gift from :from_company_name is about to expire. We hope you will choose to redeem a gift that helps people and the planet by clicking the link below!',
      });
      // Create relationships between the products records and the campaign record
      await this.addCampaignProducts({ products: data.products, campaignId: dup_campaign.id });
      return { error: false };
    } catch (e) {
      console.log('error', e);
    }
  },
  getCampaignProducts: async function({ campaign, withVariants }) {
    let products = [];
    if (campaign) {
      const { collection_id, is_collection_products_type, added_products: campaignAddedProducts, excluded_products: campaignProductExclusions, createdAt: campaignCreatedAt, block_new_products } = campaign;
      let query = '';
      let replacements = {};
      // Get products by collection id (new type) or products directly associated with campaign (old type)
      if (collection_id && Helper.isTrue(is_collection_products_type)) {
        query =
          `SELECT ${!withVariants ? 'DISTINCT ON (p.product_id)' : ''} variant_id, p.product_id, product_title, variant_title, price, image_data, variant_image, qty, tags, inventory_management, product_type, impact_icon, impact_story_collection, shippable_countries ` +
          'FROM products p ' +
          'LEFT JOIN public."productCollection" pc ON p.variant_id = pc.product_id ' +
          `WHERE ((pc.collection_id=:collection_id ${block_new_products ? 'AND p."createdAt" < :campaignCreatedAt' : ''}) OR p.product_id in (:added_products)) AND p.product_id NOT IN (:excluded_products)`;
        replacements = { collection_id, campaignCreatedAt, added_products: campaignAddedProducts ? campaignAddedProducts.split(',') : '', excluded_products: campaignProductExclusions ? campaignProductExclusions.split(',') : '' };
      } else {
        query =
        `SELECT ${!withVariants ? 'DISTINCT ON ("product_id")' : ''} * FROM "products" WHERE "enabled"=true AND "variant_image" != \'\' ` +
        '   AND "variant_image" IS NOT NULL AND "variant_id" IN ' +
        '    (SELECT "product_id" FROM "productCampaign" WHERE "campaign_id"=:campaign_id)';
        replacements = { campaign_id: campaign.id };
      }
      const collectionOrder = campaign.signatureCollection && campaign.signatureCollection.product_order;
      const productOrders = campaign.product_orders || collectionOrder || '';
      const addedProducts = campaignAddedProducts ? campaignAddedProducts.split(',') : [];
      products = await this.getAndSortCampaignProducts({ query, replacements, order: productOrders, addedProducts });
    }
    return products;
  },
  allowMultipleRedemptions: async function(campaignId, transaction) {
    const { Campaign, Contact } = db.models;
    await Campaign.update({
      allow_multiple_redemptions: true,
      no_email_invite: true,
    }, {
      where: { id: campaignId }
    }, { transaction });
    await Contact.destroy({
      where: {
        campaignId
      }
    }, { transaction });
  },
};
