let BaseController = require('./BaseController');
const db = require('../models/sequelize');
const DBBridge = require('../models/bridge');

module.exports = BaseController.extend({
  name: 'ShortUrlController',

  getUrl: async function(req, res, next) {
    try {
      const id = req.params.id;
      const url = await DBBridge.ShortUrl.getBySuffix(id);
      if (!url) {
        return res.redirect('/404');
      } 
      res.redirect(url.redirectPath);
    } catch (e) {
      console.error(e);
      return res.redirect('/404');
    }
  }
});