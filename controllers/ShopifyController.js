const DBBridge = require('../models/bridge');
let BaseController = require('./BaseController');

module.exports = BaseController.extend({
  name: 'ShopifyController',

  pull_box_products: async function (req, res, next) {
    try {
      const collection_id = req.body.cid;
      const offset = req.body.offset;
      const count = req.body.count;
      const sort_by = req.body.sortby;
      const brand_only = req.body.brandonly;

      const products =
        await DBBridge.SignatureCollection.listCollectionProducts(
          collection_id,
          offset,
          count,
          sort_by,
          brand_only
        );

      return res.send({
        status: 'success',
        products: products,
      });
    } catch (err) {
      console.log('Exception in pull_box_products function ==> ', err);
    }
  },
});
