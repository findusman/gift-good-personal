const db = require('../sequelize');
const Helper = require('../../util/helper');
const { where, fn, col } = require('sequelize');
const { filterAndSortProductsByOrder } = require('../../api/product');
const CampaignBridge = require('./CampaignBridge');

module.exports = {
  list_all: async function (
    with_products,
    product_count_only,
    filter,
    is_viewer_admin
  ) {
    const { SignatureCollection } = db.models;
    let whereCondition = { enabled: true };

    if (filter) {
      whereCondition.title = where(
        fn('LOWER', col('title')),
        'LIKE',
        '%' + filter.toLowerCase() + '%'
      );
    }
    // When current page is not the admin collections page
    if (!product_count_only && !is_viewer_admin) {
      whereCondition.internal = false;
    }

    let collections = await SignatureCollection.findAll({
      where: whereCondition,
      order: [['sequence', 'DESC']],
    });

    if (product_count_only) {
      for (let i = 0; i < collections.length; i++) {
        const query =
          'SELECT COUNT(DISTINCT "product_id") AS "count" FROM "products" WHERE "enabled"=true AND "variant_id" IN (SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:shopify_id)';
        const products_count = await db.sequelize.query(query, {
          replacements: { shopify_id: collections[i]['shopify_id'] },
          type: db.Sequelize.QueryTypes.SELECT,
        });
        if (products_count && products_count.length > 0) {
          collections[i]['products_count'] = products_count[0]['count'];
        }
      }
    } else if (with_products) {
      for (let i = 0; i < collections.length; i++) {
        const query =
          'SELECT DISTINCT ON ("product_id") * FROM "products" WHERE "enabled"=true AND "variant_image" != \'\' ' +
          '   AND "variant_image" IS NOT NULL AND "variant_id" IN ' +
          '    (SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:shopify_id) ' +
          '   LIMIT 12';
        collections[i]['products'] = await db.sequelize.query(query, {
          replacements: { shopify_id: collections[i]['shopify_id'] },
          type: db.Sequelize.QueryTypes.SELECT,
        });
      }
    }

    return collections;
  },

  list_products: async function (collection_id, offset = 0, count) {
    const { SignatureCollection } = db.models;
    const collection = await SignatureCollection.findByPk(collection_id);
    const query =
      'SELECT DISTINCT ON ("product_id") * FROM "products" WHERE "enabled"=true AND "variant_image" != \'\' ' +
      '   AND "variant_image" IS NOT NULL AND "variant_id" IN ' +
      '    (SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:shopify_id)';
    let products = await db.sequelize.query(query, {
      replacements: { shopify_id: collection_id, offset: offset, limit: count },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    products = filterAndSortProductsByOrder({ products, order: collection.product_order });
    if (count) {
      products = products.slice(offset, offset + count);
    }

    // For 'luxe' and 'custom' collections, should show collection titles for the products
    if (
      collection_id === process.env.SHOPIFY_CUSTOM_COLLECTION_ID ||
      collection_id === process.env.SHOPIFY_LUXE_COLLECTION_ID
    ) {
      for (let i = 0; i < products.length; i++) {
        const query1 =
          'SELECT title FROM "signatureCollections" WHERE "shopify_id" IN ' +
          '(SELECT "collection_id" FROM "productCollection" WHERE "collection_id" NOT IN (:excluded_shopify_ids) AND "product_id"=:product_id)';
        const titles = await db.sequelize.query(query1, {
          replacements: {
            excluded_shopify_ids: [
              process.env.SHOPIFY_CUSTOM_COLLECTION_ID,
              process.env.SHOPIFY_LUXE_COLLECTION_ID,
            ],
            product_id: products[i]['variant_id'],
          },
          type: db.Sequelize.QueryTypes.SELECT,
        });
        if (titles.length) {
          products[i]['collection_title'] = titles[0]['title'];
        }
      }
    }

    return products;
  },

  listCollectionProducts: async function (
    collection_id,
    offset,
    count,
    sort_by,
    brand_only
  ) {
    const { SignatureCollection } = db.models;
    const collection = await SignatureCollection.findOne({ 
      where: { shopify_id: collection_id },
      attributes: ['product_order']
    });
    const productOrder = collection.product_order && JSON.stringify(collection.product_order.split(',')).replace(/"/g, "'");
    let query =
      'SELECT product_id, product_title, price, impact_icon, impact_story_collection, impact_story_description, variant_image, image_data, tags FROM ' +
      '   (SELECT DISTINCT ON ("product_id") * FROM "products" WHERE "enabled"=true AND "variant_image" != \'\' ' +
      '   AND "variant_image" IS NOT NULL AND "variant_id" IN ' +
      '    (SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:shopify_id) ';
    if (brand_only) {
      query += " AND tags @> ARRAY['branded']::varchar[]";
    }
    query += ') AS sub ';

    if (sort_by === 'top-rated') {
      query += ' ORDER BY "sub".product_title ASC ';
    } else if (sort_by === 'best-selling') {
      query += ' ORDER BY "sub".product_title DESC ';
    } else if (sort_by === 'price-descending') {
      query += ' ORDER BY "sub".price DESC ';
    } else if (sort_by === 'price-ascending') {
      query += ' ORDER BY "sub".price ASC ';
    } else if (productOrder) {
      query += ` ORDER BY array_position(array${productOrder}::varchar[], "sub".product_id) `; 
    }

    query += ' OFFSET :offset LIMIT :limit ';

    return await db.sequelize.query(query, {
      replacements: { shopify_id: collection_id, offset: offset, limit: count },
      type: db.Sequelize.QueryTypes.SELECT,
    });
  },

  get_collection_details: async function (collection_id) {
    const { SignatureCollection } = db.models;

    const collection = await SignatureCollection.findOne({
      where: {
        shopify_id: collection_id,
      },
    });
    const products = await this.list_products_except_specified(collection_id, [
      '',
    ]);

    return { collection, products };
  },

  list_products_except_specified: async function (
    collection_id,
    removed_product_ids
  ) {
    const query =
      'SELECT DISTINCT ON ("product_id") * FROM "products" WHERE "enabled"=true AND "variant_image" != \'\' ' +
      '   AND "variant_image" IS NOT NULL AND "variant_id" NOT IN(:removed_ids) AND "variant_id" IN ' +
      '    (SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:shopify_id)';

    const products = await db.sequelize.query(query, {
      replacements: {
        removed_ids: removed_product_ids,
        shopify_id: collection_id,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    for (let i = 0; i < products.length; i++) {
      if (
        products[i]['tags'].filter((item) => item.trim() === 'donation').length
      ) {
        products[i]['is_donation'] = true;
      }
    }

    return products;
  },

  update_collection: async function (collection_id, updateData) {
    const { SignatureCollection } = db.models;

    await SignatureCollection.update(updateData, {
      where: { shopify_id: collection_id },
    });

    return true;
  },

  clone_collection: async function (collection_id, new_collection_name) {
    const { SignatureCollection } = db.models;

    const base_collection = await SignatureCollection.findOne({
      where: { shopify_id: collection_id },
    });

    let new_randomized_id = '';
    do {
      new_randomized_id = Helper.generate_randomized_id('sc', 'cus', 14);
    } while (
      await SignatureCollection.findOne({
        where: { shopify_id: new_randomized_id },
      })
    );

    if (base_collection) {
      await SignatureCollection.create({
        shopify_id: new_randomized_id,
        title: new_collection_name,
        price: base_collection.price,
      });

      const query =
        'SELECT product_id FROM "productCollection" WHERE collection_id=:shopify_id';
      const product_ids = await db.sequelize.query(query, {
        replacements: { shopify_id: collection_id },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      for (let i = 0; i < product_ids.length; i++) {
        await db.sequelize.query(
          `INSERT INTO "productCollection" (collection_id, product_id, "createdAt", "updatedAt") VALUES ('${new_randomized_id}', '${
            product_ids[i]['product_id']
          }', to_timestamp(${Date.now()} / 1000.0), to_timestamp(${Date.now()} / 1000.0))`,
          { type: db.Sequelize.QueryTypes.INSERT }
        );
      }
    } else {
      return false;
    }

    return true;
  },

  add_product: async function (collection_id, product_id) {
    const { SignatureCollection, Product } = db.models;
    let whereCondition = { shopify_id: collection_id };

    const collection = await SignatureCollection.findOne({
      where: whereCondition,
    });

    if (collection) {
      let query =
        'SELECT "product_id" FROM "productCollection" WHERE "collection_id"=:collection_id AND "product_id"=:product_id';
      const result = await db.sequelize.query(query, {
        replacements: { collection_id, product_id },
        type: db.Sequelize.QueryTypes.SELECT,
      });

      if (result.length > 0) {
        // already exist
        return { status: false, msg: 'This product was already added.' };
      } else {
        query =
          'INSERT INTO "productCollection" ("collection_id","product_id","createdAt","updatedAt") ' +
          'VALUES (:collection_id,:product_id,:createdAt,:updatedAt)';
        await db.sequelize.query(query, {
          replacements: {
            collection_id,
            product_id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          type: db.Sequelize.QueryTypes.INSERT,
        });
        const product = await Product.findByPk(product_id);
        return { status: true, msg: 'Product has been added.', product };
      }
    } else {
      return { status: false, msg: 'Collection is not exist.' };
    }
  },

  remove_product: async function (collection_id, product_id) {
    const { SignatureCollection } = db.models;
    let whereCondition = {
      shopify_id: collection_id,
    };

    const collection = await SignatureCollection.findOne({
      where: whereCondition,
    });
    if (collection) {
      const query =
        'DELETE FROM "productCollection" WHERE "collection_id"=:collection_id AND "product_id"=:product_id';
      await db.sequelize.query(query, {
        replacements: { collection_id, product_id },
        type: db.Sequelize.QueryTypes.DELETE,
      });
      return true;
    } else {
      return false;
    }
  },
  saveDefaultProductOrder: async function ({ products, collectionId }) {
    const { SignatureCollection } = db.models;

    const productOrderArray = products ? products.map(product => product.id) : [];

    const collection = await SignatureCollection.findOne({
      where: { shopify_id: collectionId },
      attributes: ['product_order']
    });
    const signatureProductOrder = (collection?.product_order ?? '').split(',');

    const newProducts = productOrderArray.filter((x) => !signatureProductOrder.includes(x));
    const alreadyAddedProducts = productOrderArray.filter((x) => !newProducts.includes(x));
    const newProductOrderArray = alreadyAddedProducts.concat(newProducts);

    const newProductOrder = newProductOrderArray.join(',');

    await SignatureCollection.update(
      { product_order: newProductOrder },
      { where: { shopify_id: collectionId } }
    );
    await CampaignBridge.update_product_order(collectionId, newProducts);
  },
  getCollectionListWithBasicInfo: async function(isAdmin) {
    const { SignatureCollection } = db.models;
    const whereInternal = isAdmin ? {} : { internal: false };
    const collections = await SignatureCollection.findAll({
      where: {
        enabled: true,
        ...whereInternal,
      },
      order: [['sequence', 'DESC']],
      attributes: ['shopify_id', 'title', 'title_short', 'title_long', 'title_dropdown', 'price', 'product_order', 'type', 'internal']
    });
    return collections;
  }
};
