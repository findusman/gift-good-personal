let cheerio = require('cheerio');
const db = require('../sequelize');
const { Op } = require('sequelize');
const ConstData = require('../../util/const_data');
const { hasProductTag } = require('../../util/shopify_helper')
const { mapProductImageUrlsToProxy } = require('../../api/product');

const useShopifyProxy = process.env.USE_SHOPIFY_PROXY && process.env.USE_SHOPIFY_PROXY !== 'false';

module.exports = {
    get_products: async function (products_ids) {
        const {Product} = db.models;
        let products = await Product.findAll({
            where: {variant_id: products_ids}
        });

        products.sort((product1, product2) =>
            products_ids.indexOf(product1['variant_id']) - products_ids.indexOf(product2['variant_id']));

        for (let i = 0; i < products.length; i++) {
            if (products[i]['tags'].filter(item => item.trim() === 'donation').length) {
                products[i]['is_donation'] = true;
            }
        }

        return products;
    },

    get_variants: async function ({ product_id, getOutOfStock }) {
        const { Product, ProductOptions } = db.models;
        let products = await Product.findAll({
            where: {
                product_id: product_id, 
                enabled: true, 
                ...(!getOutOfStock && {[Op.or]: [
                    { inventory_management: null }, 
                    { qty: { [Op.gte]: ConstData.MIN_VARIANT_QTY } }
                ]})
            },
            include: ProductOptions
        });

        for (let i = 0; i < products.length; i++) {
            if (useShopifyProxy) {
                products[i]['dataValues'] = mapProductImageUrlsToProxy(products[i]['dataValues']);
            }
            const { sub: productImages = [] } = products[i]['image_data'] || {};
            products[i]['image_idx'] = productImages ? productImages.indexOf(products[i]['variant_image']) : -1;
            if (products[i]['tags'].filter(item => item.trim() === 'donation').length) {
                products[i]['is_donation'] = true;
            }

            const product_content = products[i]['html_body'];
            const $ = cheerio.load(product_content);
            products[i]['short-desc'] = $('p.short-desc').html();
            products[i]['long-desc'] = $('div.long-desc').html();
            products[i].productOptions = products[i].productOptions.map(options => {
                const parsedValues = JSON.parse(options.values);
                return { 
                    ...options.dataValues, 
                    values: parsedValues.filter(val => 
                        products.find(product => product.variant_options && JSON.parse(product.variant_options).includes(val.title))
                    ),
                    shouldShow: parsedValues.length > 1
                }
            });
        }

        return products;
    },

    get_variant: async function (variant_id) {
        const {Product} = db.models;
        let variant = await Product.findOne({
            where: {variant_id: variant_id, enabled: true},
            raw: true
        });

        if (variant) {
            if (useShopifyProxy) {
                variant = mapProductImageUrlsToProxy(variant);
            }
            if (variant['tags'].filter(item => item.trim() === 'donation').length) {
                variant['is_donation'] = true;
            }

            const product_content = variant['html_body'];
            const $ = cheerio.load(product_content);
            variant['short-desc'] = $('p.short-desc').html();
            variant['long-desc'] = $('div.long-desc').html();
        }

        return variant;
    },

    is_donation_product: async function (variant_id) {
        const {Product} = db.models;
        let variant = await Product.findOne({
            where: {variant_id: variant_id, enabled: true}
        });

        if (variant) {
            return hasProductTag(variant, 'donation');
        }

        return false;
    }, 
}
