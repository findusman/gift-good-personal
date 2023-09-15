const axios = require('axios');
const https = require('https');
const Shopify = require('shopify-api-node');
const Bottleneck =  require('bottleneck');
const { TAX_APPLIED_CITIES, TAX_APPLIED_STATES, COUNTRIES } = require('./const_data');
const db = require('../models/sequelize');
const { parseJSON } = require('./helper');

const parseVariantId = (variant_id) => String(variant_id).replace(/^gid:\/\/shopify\/ProductVariant\/(.+)$/, '$1');

// Configured to work with queue of queries with cost ~500
const graphqlLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 5000
});

graphqlLimiter.on('failed', function (error, jobInfo) {
  const retryLimit = 1;
  const { options: { id } } = jobInfo;
  console.warn(`job ${id} failed, will retry`);
  if (jobInfo.retryCount < retryLimit) {
    return 10000;
  }
});

// Reservoir values based on Bottleneck example for Shopify and updated for Shopify Plus (https://github.com/SGrondin/bottleneck#increase-interval)
const limiter = new Bottleneck({
  reservoir: 80,
  reservoirIncreaseAmount: 4,
  reservoirIncreaseInterval: 1000,
  reservoirIncreaseMaximum: 80,
  maxConcurrent: 5,
  minTime: 250
});

// Retry 2 times if job failed
limiter.on('failed', function (error, jobInfo) {
  const retryLimit = 2;
  const { options: { id } } = jobInfo;
  console.warn(`job ${id} failed, will retry ${retryLimit - jobInfo.retryCount} times`);
  if (jobInfo.retryCount < retryLimit) {
    return 25;
  }
});

// Get page content from the given url
function downloadPage(url) {
  return new Promise((resolve, reject) => {
    let page_data = '';
    const request = https
      .get(url, (res) => {
        if (res.statusCode != 200) {
          reject('Invalid status code <' + res.statusCode + '>');
        }
        res.on('data', function (chunk) {
          page_data += '' + chunk;
        });
        res.on('end', function () {
          resolve(page_data);
        });
      })
      .on('error', (e) => {
        // console.error(e);
        reject(e);
      });
    request.end();
  });
}

function get_shopify_url_prefix() {
  return `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_PASSWORD}@${process.env.SHOPIFY_APP_NAME}${process.env.SHOPIFY_ADMIN_API}`;
}

// Get orders with given ids
async function get_orders(orders_ids, callback) {
  let orders_data = [];
  const url_prefix = get_shopify_url_prefix();
  const url = `${url_prefix}/orders.json`;
  // Get bulk orders, max 250 orders
  for (let i = 0; i < orders_ids.length; i = i + 250) {
    const sub_orders_ids = orders_ids.slice(i, i + 250);
    try {
      const str_data = await limiter.schedule(() => downloadPage(
        url + '?ids=' + sub_orders_ids.join(',') + '&limit=250&status=any'
      ));
      const json_array = JSON.parse(str_data);
      json_array['orders'].forEach((json_data) => {
        if (
          json_data.hasOwnProperty('id') &&
          json_data.hasOwnProperty('fulfillments')
        ) {
          orders_data.push({
            id: json_data['id'],
            cancelled_at: json_data['cancelled_at'],
            fulfillments: json_data['fulfillments'],
          });
        }
      });
    } catch (err) {
      console.log(
        '[get_orders] api call failed ==> ',
        sub_orders_ids.join(','),
        JSON.stringify(err)
      );
    }
  }
  return orders_data;
}

// Pull product
function get_product_variant(variant_id, callback) {
  const shopify = new Shopify({
    shopName: process.env.SHOPIFY_APP_NAME,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
    apiVersion: process.env.SHOPIFY_API_VERSION,
  });
  const id = parseVariantId(variant_id);
  return limiter.schedule(() => shopify.productVariant.get(id));
}

// Pull products belonged to given collection
async function pull_products(collection_sid, callback) {
  const shopify = new Shopify({
    shopName: process.env.SHOPIFY_APP_NAME,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
    apiVersion: process.env.SHOPIFY_API_VERSION,
  });
  const defaultParams = {
    collection_id: collection_sid,
    limit: 250,
    status: 'active'
  };

  let salesChannelProducts = [];
  let products = [];

  await (async () => {
    let params = defaultParams;

    do {
      const collectionProducts = await limiter.schedule(() => shopify.productListing.list(params));
      salesChannelProducts = salesChannelProducts.concat(collectionProducts);
      params = collectionProducts.nextPageParameters;
    } while (params !== undefined);

    if (salesChannelProducts.length) {
      params = { limit: 250, status: 'active', sort_order: 'manual' };
      do {
        const pageProducts = await shopify.collection.products(collection_sid ,params);
        const newProducts = pageProducts
          .filter(product => salesChannelProducts.find(el => el.product_id === product.id))
          .map(item => {
            return {
              ...item,
              ...salesChannelProducts.find(el => el.product_id === item.id),
            }
          });
        products = products.concat(newProducts);
        params = pageProducts.nextPageParameters;
      } while (params !== undefined);
    }
  })().catch(console.error);
  return products;
}

// Pull meta fields of product
async function pull_metafields(product_id, callback) {
  const shopify = new Shopify({
    shopName: process.env.SHOPIFY_APP_NAME,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
    apiVersion: process.env.SHOPIFY_API_VERSION,
  });

  let meta_fields = [];

  await (async () => {
    let params = {
      metafield: { owner_resource: 'product', owner_id: product_id },
      limit: 250,
    };

    do {
      const page_meta_fields = await limiter.schedule(() => shopify.metafield.list(params));
      meta_fields = meta_fields.concat(page_meta_fields);
      // TODO: page_meta_fields is an array of metafield entries, nextPageParameters will never be set
      // previously param limit was unset so the default value of 50 was being used and not all metafields 
      // were being returned which was limiting the logic that builds up data based on metafields
      params = page_meta_fields.nextPageParameters;
    } while (params !== undefined);
  })().catch(console.error);

  let bundled_product_ids = '';
  let impact_short_description = '';
  let impact_story_description = '';
  let impact_story_image = '';
  let impact_story_collection = '';
  let impact_icon = '';
  let shippable_countries = [];
  meta_fields.forEach((meta_field) => {
    if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'impact' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'description_short' &&
      meta_field.hasOwnProperty('value')
    ) {
      impact_short_description = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'impact' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'description' &&
      meta_field.hasOwnProperty('value')
    ) {
      impact_story_description = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'impact' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'image' &&
      meta_field.hasOwnProperty('value')
    ) {
      impact_story_image = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'impact' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'grid_text' &&
      meta_field.hasOwnProperty('value')
    ) {
      impact_story_collection = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'impact' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'icon' &&
      meta_field.hasOwnProperty('value')
    ) {
      impact_icon = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'bundle' &&
      meta_field.hasOwnProperty('key') &&
      meta_field['key'] === 'products' &&
      meta_field.hasOwnProperty('value')
    ) {
      bundled_product_ids = meta_field['value'];
    } else if (
      meta_field.hasOwnProperty('namespace') &&
      meta_field['namespace'] === 'international' &&
      meta_field.hasOwnProperty('key') &&
      (meta_field['key'] === 'shipping_countries' || meta_field['key'] === 'shipping_group') &&
      meta_field.hasOwnProperty('value')
    ) {
      meta_field.value.split(',').forEach(value => {
        shippable_countries.push(value.trim().toUpperCase());
      });
    }
  });

  return {
    impact_short_description,
    impact_story_description,
    impact_story_image,
    impact_story_collection,
    impact_icon,
    bundled_product_ids,
    shippable_countries,
  };
}

async function getOrderData(contact, variant) {

  let order_price = variant['price'];
  let order_tags = ['GiftForward'];
  let lineItems = [];
  let properties = null;

  if (contact.coords !== 'undefined' || contact.state !== 'undefined') {
    properties = contact.coords !== 'undefined' ? [
      {
        name: 'Hometown',
        value: contact.hometown,
      },
      {
        name: '_coords',
        value: contact.coords,
      }
    ] : [
      {
        name: 'State',
        value: contact.state
      }
    ];
  }

  // If bundle, expand to represent the bundled items
  if (variant.shopify_template === 'bundle') {
    const { Product } = db.models;

    let products = await Promise.all(parseJSON(variant.bundled_product_ids, []).map(id => {
      return Product.findOne({
        where: { variant_id: parseVariantId(id) },
      });
    }));

    order_price = 0;
    products.forEach(product => {
      order_price += product.price;

      lineItems.push({
        variant_id: product.variant_id,
        quantity: 1,
        price: product.price,
        ...(properties && { properties })
      });
    });

    order_tags.push(`Bundle Product`);
    order_tags.push(`${variant.product_title?.substr(0, 40)}`);
    order_tags.push(`${variant.product_id}`);
  }
  // Otherwise, single line item
  else {
    lineItems.push({
      variant_id: contact['productVariantId'],
      quantity: 1,
      price: variant['price'],
      ...(properties && { properties })
    });  
  }

  order_tags.push(contact['campaign']['title']
      ? contact['campaign']['title'].substr(0, 32)
      : '');

  let tax_lines = [];
  let total_tax = 0;
  if (TAX_APPLIED_STATES.indexOf(contact['shipping_state']) >= 0) {
    tax_lines.push({
      price: order_price * 0.0725,
      rate: 0.0725,
      title: 'State tax',
    });
    total_tax += order_price * 0.0725;
  }
  if (TAX_APPLIED_CITIES.indexOf(contact['shipping_city']) >= 0) {
    tax_lines.push({
      price: order_price * 0.0225,
      rate: 0.0225,
      title: 'City tax',
    });
    total_tax += order_price * 0.0225;
  }

  return {
    order: {
      line_items: lineItems,
      tax_lines: tax_lines,
      total_tax: total_tax,
      shipping_address: {
        first_name: contact['shipping_first_name'],
        last_name: contact['shipping_last_name'],
        address1: contact['shipping_address'],
        address2: contact['shipping_apartment'],
        phone: contact['shipping_phone'],
        city: contact['shipping_city'],
        province: contact['shipping_state'],
        zip: contact['shipping_zip_code'],
        country: contact['shipping_country'] || 'US',
      },
      customer: {
        first_name: contact['shipping_first_name'],
        last_name: contact['shipping_last_name'],
        email: contact['shipping_email'] || contact['to_email'],
      },
      tags: order_tags,
      financial_status: 'paid',
      inventory_behaviour: 'decrement_obeying_policy', // For making product inventory deducted
      ...(variant['is_donation'] && {fulfillment_status: 'fulfilled'})
    },
  };
}

// Create order from the given database record
async function create_order(contact, variant) {
  console.log('creating order for', contact['to_email']);
  const postData = await getOrderData(contact, variant);
  const postUrl = `${get_shopify_url_prefix()}/orders.json`;
  let saveAsFailed = true;
  let orderId = '';
  let reason = '';
  try {
    response = await limiter.schedule(() => axios.post(postUrl, postData));
    if (response.status !== 200 && response.status !== 201) {
      console.log('Invalid status code <' + res.status + '>');
    } else {
      console.log(
        new Date().toISOString(),
        ' New order created email => ',
        contact['shipping_email'],
        ' variant_id => ',
        contact['productVariantId']
      );
      orderId = response.data.order.id;
      saveAsFailed = false;
    }
  } catch(e) {
    console.log(
      'order create api call failed email ==> ',
      contact['shipping_email'],
      ' variant_id ==> ',
      contact['productVariantId'],
      ' error ==> ',
      e.response ? JSON.stringify(e.response.data) : 'Unknown'
    );
    saveAsFailed = e.response.status && e.response.status !== 429;
    reason = e.response && JSON.stringify(e.response.data);
  }
  console.log('create order: order_id', orderId);
  return { orderId, saveAsFailed, reason };
}

async function pullMediaImages() {
  const fileList = [];
  let shouldPull = true;
  let activeCursor = '';
  const shopify = new Shopify({
    shopName: process.env.SHOPIFY_APP_NAME,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
    apiVersion: process.env.SHOPIFY_API_VERSION,
  });
  const query = `query ($cursor: String) {
    files(first: 165, after: $cursor) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          preview {
            image {
              src
            }
          }
        }
      }
    }
  }`;
  try {
    while(shouldPull) {
      const data = await graphqlLimiter.schedule(() => shopify.graphql(query, activeCursor ? { cursor: activeCursor } : {}));
      const { files: { pageInfo: { hasNextPage }, edges } } = data;
      fileList.push(...edges.map(el => (el.node.preview.image.src)));
      shouldPull = hasNextPage;
      activeCursor = edges[edges.length - 1].cursor;
    }
  } catch(e) {
    console.error(e);
  }
  return fileList;
}

// Extract necessary product data from the pulled json data
function extract_product_data(json_data) {
  const product_id = json_data['id'] + '';
  const product_title = json_data.hasOwnProperty('title')
    ? json_data['title']
    : '';
  const product_type = json_data.hasOwnProperty('product_type')
    ? json_data['product_type']
    : '';
  const html_body = json_data.hasOwnProperty('body_html')
    ? json_data['body_html']
    : '';
  const vendor = json_data.hasOwnProperty('vendor') ? json_data['vendor'] : '';
  const created_at = json_data.hasOwnProperty('created_at')
    ? json_data['created_at']
    : '';
  const updated_at = json_data.hasOwnProperty('updated_at')
    ? json_data['updated_at']
    : '';
  const published_at = json_data.hasOwnProperty('published_at')
    ? json_data['published_at']
    : '';
  const tags = json_data.hasOwnProperty('tags')
    ? json_data['tags'].split(',')
    : [];
  const shopify_template = json_data.hasOwnProperty('template_suffix') ? json_data['template_suffix'] : '';
  const shopify_handle = json_data.hasOwnProperty('handle') ? json_data['handle'] : '';
  const main_image =
    json_data['image'] && json_data['image']['src']
      ? json_data['image']['src']
      : '';
  let image_id_url_map = {};
  let sub_images = [];
  if (json_data.hasOwnProperty('images')) {
    for (let k = 0; k < json_data['images'].length; k++) {
      const image_data = json_data['images'][k];
      if (image_data.hasOwnProperty('id') && image_data.hasOwnProperty('src')) {
        image_id_url_map[image_data['id']] = image_data['src'];
        sub_images.push(image_data['src']);
      }
    }
  }
  const image_data = { main: main_image, sub: sub_images };
  return {
    product_id,
    product_title,
    product_type,
    html_body,
    vendor,
    tags,
    created_at,
    updated_at,
    published_at,
    image_id_url_map,
    image_data,
    shopify_template,
    shopify_handle
  };
}

// Extract necessary variant data from the pulled json data
function extract_variant_data(json_data, image_map, default_image, mediaImages) {
  const inventory_quantity = json_data.hasOwnProperty('inventory_quantity')
    ? json_data['inventory_quantity']
    : 0;
  const variant_id = json_data.hasOwnProperty('id') ? json_data['id'] + '' : '';
  const variant_title = json_data.hasOwnProperty('title')
    ? json_data['title']
    : '';

  const variant_price = json_data.hasOwnProperty('price')
    ? json_data['price']
    : 0.0;
  const variant_image_id = json_data.hasOwnProperty('image_id')
    ? json_data['image_id']
    : '';
  const variant_image = image_map.hasOwnProperty(variant_image_id)
    ? image_map[variant_image_id]
    : default_image;
  const variant_inventory_management = json_data.hasOwnProperty(
    'inventory_management'
  )
    ? json_data['inventory_management']
    : '';
  const variant_options = json_data.hasOwnProperty('option_values') 
    ? JSON.stringify(json_data.option_values.map(el => el.value))
    : JSON.stringify([json_data.option1, json_data.option2, json_data.option3]);
  return {
    variant_id,
    variant_title,
    price: variant_price,
    variant_image,
    variant_options,
    qty: inventory_quantity,
    inventory_management: variant_inventory_management
  };
}

function hasProductTag(product, tag) {
  if (!(product && product.tags && tag)) {
    return false;
  }

  return product.tags.filter(item => item.trim().toLowerCase() === tag.toLowerCase()).length > 0;
}

function isProductShippable(product, country) {
  if (!(product && product.shippable_countries && country)) {
    return false;
  }

  return product.shippable_countries.includes(country);
}

function getCountriesForDropdown() {
  return Object.keys(COUNTRIES)
    .map(key => {
      const country = COUNTRIES[key];
      return {
        name: key,
        code: country.code,
        featured: country.featured ? true : false,
        flag: country.flag_path,
      }
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) {
        return -1;
      }

      if (a.name > b.name) {
        return 1;
      }
      else if (a.name < b.name) {
        return -1;
      }

      return 0;
    });
}

module.exports = {
  create_order,
  extract_product_data,
  extract_variant_data,
  get_orders,
  pull_metafields,
  get_product_variant,
  pull_products,
  pullMediaImages,
  hasProductTag,
  isProductShippable,
  getCountriesForDropdown,
};
