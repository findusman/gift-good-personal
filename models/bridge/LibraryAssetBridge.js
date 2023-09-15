const db = require('../sequelize');

module.exports = {
  createLibraryAsset: async function(data) {
    const { LibraryAsset } = db.models;
    const newAsset = await LibraryAsset.create(data);
    return newAsset;
  },

  getLibraryAssetsByType: async function({ userId, type, getDefault }) {
    const { LibraryAsset } = db.models;
    const condition = getDefault ? { is_default: true } : { userId };
    const assets = await LibraryAsset.findAll({
      where: {
        ...condition,
        type
      }
    });
    return assets;
  }
}