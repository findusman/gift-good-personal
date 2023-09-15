const SignatureCollectionBridge = require('../models/bridge/SignatureCollectionBridge');
const ContactBridge = require('../models/bridge/ContactBridge');
const ProductBridge = require('../models/bridge/ProductBridge');
const path = require('path');
const db = require('../models/sequelize');
const { sleep, convertToKebabCase, parseJSON } = require('../util/helper');
const { parseHrtime } = require('../api/time');
const { sendNotificationMail } = require('../api/mail');
const {
  create_order,
  extract_product_data,
  extract_variant_data,
  get_orders,
  pull_metafields,
  get_product_variant,
  pull_products,
  pullMediaImages
} = require('../util/shopify_helper');


const saveProductOptions = async function(options, variantId, mediaImages) {
  const { ProductOptions } = db.models;
  try {
    if (options) {
      options.forEach(async option => {
        const record = await ProductOptions.findOne({ where: { optionId: option.id.toString(), productVariantId: variantId } });
        const valuesWithImages = option.values.map(option => (
          {
            title: option,
            image: mediaImages.find(image => (
              path.parse(image).name === convertToKebabCase(option)
            ) || '')
          }
        ));
        const optionData = { 
          values: JSON.stringify(valuesWithImages),
          optionId: option.id.toString(), 
          position: option.position, 
          name: option.name, 
          productVariantId: variantId 
        }
        if (record) {
          record.update(optionData);
        } else {
          ProductOptions.create(optionData);
        }
      });
    }
  } catch(e) {
    console.error(e);
  }
};

// Pull products from online shopify into local database
const pullProducts = async function (is_check_meta_fields) {
  const startTime = process.hrtime();
  try {
    console.log(new Date().toISOString(), ' : pull_products calling');
    const { Product, SignatureCollection } = db.models;
    // First put updated flag false for all records
    await Product.update({ updated: false }, { where: {} });

    // Remove all records in the product & signature collection relation temp table
    await db.sequelize.query('delete from "productCollectionBKs"', {
      type: db.Sequelize.QueryTypes.DELETE,
    });

    // Get registered collections on the shopify
    const signature_collections = await SignatureCollection.findAll({
      where: { shopify: true },
    });

    const mediaImages = await pullMediaImages();
    for (let i = 0; i < signature_collections.length; i++) {
      const collection_sid = signature_collections[i]['shopify_id'];

      // Get products belonged to this collection
      const products_data = await pull_products(collection_sid);
      console.log(
        'Pulling products and variants in the collection id: ',
        collection_sid,
        ' title: ',
        signature_collections[i]['title'],
        ' products count: ',
        products_data.length
      );

      await SignatureCollectionBridge.saveDefaultProductOrder({ products: products_data, collectionId: collection_sid });

      let variants_count = 0;
      let out_of_stock_variants_count = 0;

      for (let j = 0; j < products_data.length; j++) {
        try {
          const product_data = products_data[j];
          const {
            product_id,
            product_title,
            product_type,
            html_body,
            vendor,
            created_at,
            updated_at,
            published_at,
            tags,
            image_data,
            image_id_url_map,
            shopify_template,
            shopify_handle
          } = extract_product_data(product_data);

          let meta_data_pulled = false;
          let impact_short_description = '';
          let impact_story_description = '';
          let impact_story_image = '';
          let impact_story_collection = '';
          let impact_icon = '';
          let bundled_product_ids = '';
          let shippable_countries = [];

          if (product_data.hasOwnProperty('variants')) {
            const variants_data = product_data['variants'];
            variants_count += variants_data.length;

            for (let k = 0; k < variants_data.length; k++) {
              let {
                variant_id,
                variant_title,
                variant_image,
                variant_options,
                price,
                qty,
                inventory_management
              } = extract_variant_data(
                variants_data[k],
                image_id_url_map,
                image_data['main']
              );
              // When product is run out of stock
              if (qty <= 0 && inventory_management !== null) {
                out_of_stock_variants_count++;
                continue;
              }

              if (!variant_image) {
                variant_image = '/resources/images/products/no-image.png';
              }

              let record_data = {
                product_id,
                variant_id,
                product_title,
                product_type,
                variant_title,
                variant_options,
                inventory_management,
                price,
                image_data,
                variant_image,
                qty,
                html_body,
                vendor,
                tags,
                created_at,
                updated_at,
                published_at,
                enabled: true,
                updated: true,
                shopify_template,
                shopify_handle
              };

              let product = await Product.findOne({
                where: { product_id, variant_id },
              });

              if (
                product &&
                (!impact_short_description ||
                  !impact_story_description ||
                  !impact_story_image ||
                  !impact_story_collection ||
                  !impact_icon ||
                  !bundled_product_ids ||
                  !shippable_countries)
              ) {
                impact_short_description =
                  product['impact_short_description'];
                impact_story_description =
                  product['impact_story_description'];
                impact_story_image = product['impact_story_image'];
                impact_story_collection = product['impact_story_collection'];
                impact_icon = product['impact_icon'];
                bundled_product_ids = product['bundled_product_ids'];
                shippable_countries = product['shippable_countries'];
              }

              let isProductBundle = product && product.shopify_template === 'bundle';

              if (
                isProductBundle || 
                !impact_short_description ||
                !impact_story_description ||
                !impact_story_image ||
                !impact_story_collection ||
                !impact_icon ||
                !bundled_product_ids ||
                !shippable_countries ||
                (is_check_meta_fields && !meta_data_pulled)
              ) {
                // Pull product meta fields
                let meta_fields = await pull_metafields(product_id);
                // await sleep(1500);

                impact_short_description =
                  meta_fields['impact_short_description'];
                impact_story_description =
                  meta_fields['impact_story_description'];
                impact_story_image = meta_fields['impact_story_image'];
                impact_story_collection =
                  meta_fields['impact_story_collection'];
                impact_icon = meta_fields['impact_icon'];
                bundled_product_ids = meta_fields['bundled_product_ids'];
                shippable_countries = meta_fields['shippable_countries'];
                meta_data_pulled = true;
              }

              record_data['impact_short_description'] =
                impact_short_description;
              record_data['impact_story_description'] =
                impact_story_description;
              record_data['impact_story_image'] = impact_story_image;
              record_data['impact_story_collection'] =
                impact_story_collection;
              record_data['impact_icon'] = impact_icon;
              record_data['shippable_countries'] = shippable_countries;
              record_data['bundled_product_ids'] = bundled_product_ids;

              // Bundle specific logic
              if (isProductBundle) {
                let product_ids = parseJSON(record_data['bundled_product_ids']);

                // If there are no bundled products, then disable the entire product
                if (!product_ids.length) {
                  continue;
                }

                // Confirm the inventory for each of the bundled items
                let bundled_products = await Promise.all(product_ids.map(get_product_variant));
                let allInStock = bundled_products.reduce((value, { inventory_quantity, inventory_management }) => value && (Number(inventory_quantity) > 0 || inventory_management == null), true);

                if (!allInStock) {
                  console.log('Product bundle is out of stock', product_id);
                  out_of_stock_variants_count++;
                  continue;  
                }

                // Save variant data in database to support order replication
                for (let idx in bundled_products) {
                  let bundled_product = bundled_products[idx];
                  let variant_data = extract_variant_data(bundled_product, {}, '');

                  let variant = await Product.findOne({
                    where: { variant_id: variant_data.variant_id },
                  });

                  if (!variant) {
                    variant = new Product(variant_data);
                    await variant.save();
                  } 
                  else {
                    await variant.update(variant_data);
                  }  
                }
              }
              
              record_data['shippable_countries'] = shippable_countries;

              if (!product) {
                product = new Product(record_data);
                await product.save();
              } else {
                await product.update(record_data);
              }

              await saveProductOptions(products_data[j].options, record_data.variant_id, mediaImages);

              // Insert new records in the product & signature collection relation temp table
              await db.sequelize.query(
                `insert into "productCollectionBKs" (collection_id, product_id, "createdAt", "updatedAt") values (${collection_sid}, ${variant_id}, to_timestamp(${Date.now()} / 1000.0), to_timestamp(${Date.now()} / 1000.0))`,
                { type: db.Sequelize.QueryTypes.INSERT }
              );
            }
          }
        } catch (err) {
          console.log(err);
        }
      }

      console.log(
        'Collection title: ',
        signature_collections[i]['title'],
        ' variants count: ',
        variants_count,
        ' : out of stock count ',
        out_of_stock_variants_count
      );
    }

    // Remove all product and signature collection relation
    await db.sequelize.query('delete from "productCollection"', {
      type: db.Sequelize.QueryTypes.DELETE,
    });

    // Copay all records from temp table to real table
    await db.sequelize.query(
      'insert into "productCollection" (collection_id, product_id, "createdAt", "updatedAt") select collection_id, product_id, "createdAt", "updatedAt" from "productCollectionBKs"',
      { type: db.Sequelize.QueryTypes.INSERT }
    );

    // Make disable products which are not updated
    await Product.update({ enabled: false }, { where: { updated: false } });
  } catch (err) {
    console.log('Exception in pull_products function => ', err);
  }
  console.log(`Elapsed time for pulling products ${is_check_meta_fields ? '(with metafields)' : ''} is ${parseHrtime(startTime)}`);
};

// Create orders from confirmed orders
const createOrders = async function () {
  const startTime = process.hrtime();
  try {
    console.log(new Date().toISOString(), ' : create_orders calling');

    const confirmed_contacts = await ContactBridge.get_confirmed_contacts(
      process.env.SHOPIFY_ORDER_LIMIT
    );
    console.log('creating ', confirmed_contacts.length, ' orders now...');

    for (let i = 0; i < confirmed_contacts.length; i++) {
      const confirmed_contact = confirmed_contacts[i];

      // Create order, return order id
      const variant = await ProductBridge.get_variant(
        confirmed_contact['productVariantId']
      );
      if (variant) {
        console.log(
          'creating order for variant id',
          confirmed_contact['productVariantId']
        );
        const orderData = await create_order(confirmed_contact, variant);
        await ContactBridge.order_created(
          confirmed_contact['id'],
          orderData,
          orderData.reason
        );
        if (orderData.saveAsFailed) {
          await sendNotificationMail({
            content: `<p>Shopify order couldn't be created for contact with id ${confirmed_contact.id} and email ${confirmed_contact.to_email}<p><p>Campaign name: ${confirmed_contact.campaign.title}</p><p>Reason: <code>${orderData.reason}</code></p>`,
            subject: `Failed order creation`,
            ccAdmin: true
          });
        } else {
          // Time window for Jetti request
          await sleep(parseInt(process.env.SHOPIFY_ORDER_DELAY));
        }
      } else {
        console.log(
          'Order Failed: No Variant',
          confirmed_contact['productVariantId']
        );
        await ContactBridge.order_created(
          confirmed_contact['id'],
          { saveAsFailed: true },
          'Variant missing'
        );
        await sendNotificationMail({
          content: `<p>Order couldn't be created for contact with id ${confirmed_contact.id} and email ${confirmed_contact.to_email}<p>
                    <p>Campaign name: ${confirmed_contact.campaign.title}</p>
                    <p>Reason: missing variant</p>
                    <p>Selected variant: ${confirmed_contact.productVariantId}</p>`,
          subject: `Failed order creation - missing variant`,
          ccAdmin: true
        });
      }
    }
  } catch (err) {
    console.log('Exception in create_order function => ', err);
  }
  console.log(`Elapsed time for creating orders is ${parseHrtime(startTime)}`);
};

// Track orders frequently to get confirmed orders
const trackOrders = async function () {
  const startTime = process.hrtime();
  try {
    console.log(new Date().toISOString(), ' : track_orders calling');

    const shopify_order_ids =
      await ContactBridge.get_on_shopify_contact_order_ids();
    // Get orders from these ids
    const orders_data = await get_orders(shopify_order_ids);

    for (let i = 0; i < orders_data.length; i++) {
      const order_data = orders_data[i];
      if (order_data['cancelled_at']) {
        await ContactBridge.order_declined(order_data['id']);
        console.log('order was declined ', order_data['id']);
      } else {
        const fulfillments = order_data['fulfillments'];
        for (let j = 0; j < fulfillments.length; j++) {
          if (fulfillments[j]['shipment_status'] === 'delivered') {
            await ContactBridge.order_delivered(
              order_data['id'],
              fulfillments[j]['tracking_number'],
              fulfillments[j]['tracking_url']
            );
            console.log('order was delivered ', order_data['id']);
            break;
          } else if (fulfillments[j]['tracking_number']) {
            await ContactBridge.order_tracked(
              order_data['id'],
              fulfillments[j]['tracking_number'],
              fulfillments[j]['tracking_url']
            );
          }
        }
      }
    }
  } catch (err) {
    console.log('Exception in track_orders function => ', err);
  }
  console.log(`Elapsed time for tracking orders is ${parseHrtime(startTime)}`);
};

module.exports = {
  pullProducts,
  createOrders,
  trackOrders
}
