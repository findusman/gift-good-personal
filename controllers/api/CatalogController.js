const BaseController = require('../BaseController');
const DBBridge = require('../../models/bridge');
const ConstData = require('../../util/const_data');
const { getProductOptions } = require('../../api/product');

module.exports = BaseController.extend({
  name: 'CatalogController',

  // TODO Remove if we are going to use Shopify API directly
  getCollections: async function(req, res, next) {
    try {
      const current_user = req.session.user;
      const collections = await DBBridge.SignatureCollection.getCollectionListWithBasicInfo(current_user.type === ConstData.ADMIN_USER || current_user.type === ConstData.STANDARD_ADMIN_USER);
      return res.send({ status: 'Success', collections });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },

  // TODO Remove if we are going to use Shopify API directly
  getCollectionProducts: async function(req, res, next) {
    try {
      const { query: { collectionId, count = 20, offset = 0 } } = req;
      if (!collectionId) {
        res.status(400);
        return res.send({
          status: 'Error',
          msg: 'Collection id parameter is required',
        });
      }
      const products = await DBBridge.SignatureCollection.listCollectionProducts(
        collectionId,
        offset,
        count
      );
      return res.send({ status: 'Success', products });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },

  // TODO Remove if we are going to use Shopify API directly
  getProductDetails: async function(req, res, next) {
    try {
      const { query: { productId } } = req;
      let colorOptions = {};
      let otherOptions = {};
      if (!productId) {
        res.status(400);
        return res.send({
          status: 'Error',
          msg: 'Product id parameter is required',
        });
      }
      const variants = await DBBridge.Product.get_variants({ product_id: productId, getOutOfStock: true });
      if (variants.length) {
        const { colorOptions: colors, otherOptions: other } = getProductOptions(variants);
        colorOptions = colors;
        otherOptions = other;

        return res.send({ 
          status: 'Success', 
          product: variants[0], 
          colorOptions, 
          otherOptions 
        });
      } else {
        res.status(404);
        return res.send({
          status: 'Error',
          msg: 'Not found any variants for given product id',
        });
      }
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e,
      });
    }
  },
});