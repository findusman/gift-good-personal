const BaseController = require('../BaseController');
const DBBridge = require('../../models/bridge');

module.exports = BaseController.extend({
  name: 'LibraryController',

  saveMessageInLibrary: async function(req, res, next) {
    try {
      const { session: { user }, body: { content, title } } = req;
      await DBBridge.LibraryMessageBridge.createLibraryMessage({
        userId: user.id,
        content,
        title
      });
      return res.send({ status: 'Success' });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e
      });
    }
  },

  getSavedMessages: async function(req, res, next) {
    try {
      const { session: { user }, query: { getDefault } } = req;
      const messages = await DBBridge.LibraryMessageBridge.getLibraryMessages({ 
        userId: user.id, 
        getDefault: getDefault ? JSON.parse(getDefault) : false
      });
      return res.send({ status: 'Success', data: { messages } });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e
      });
    }
  },

  getSavedAssets: async function(req, res, next) {
    try {
      const { session: { user }, query: { getDefault, type } } = req;
      if (!type) {
        res.status(400);
        return res.send({
          status: 'Error',
          msg: 'Type parameter is required',
        });
      }
      const assets = await DBBridge.LibraryAssetBridge.getLibraryAssetsByType({ 
        userId: user.id, 
        type, 
        getDefault: getDefault ? JSON.parse(getDefault) : false
      });
      return res.send({ status: 'Success', data: { assets } });
    } catch(e) {
      console.error(e);
      res.status(500);
      return res.send({
        status: 'Error',
        msg: e
      });
    }
  }
});