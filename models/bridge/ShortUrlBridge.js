const db = require('../sequelize');
const { createUrlSuffix, getCustomerLandingPath } = require('../../api/url');
const { createRecordsInBatches } = require('../../api/db');

module.exports = {
  createForCampaign: async function({ redirectPath, campaignId, transaction }) {
    const { ShortUrl } = db.models;
    const suffix = createUrlSuffix();
    await ShortUrl.findOrCreate({
      where: { campaignId },
      defaults: {
        redirectPath,
        suffix
      },
      transaction
    });
  },

  createForAll: async function(contacts) {
    const { ShortUrl } = db.models;
    const shortUrls = contacts.map((contact) => {
      const suffix = createUrlSuffix();
      return {
        contactId: contact.dataValues.id,
        redirectPath: getCustomerLandingPath({ isDemo: false, id: contact.id }),
        suffix
      }
    });
    return createRecordsInBatches({ data: shortUrls, batchSize: 1000, model: ShortUrl });
  },

  getBySuffix: async function(suffix) {
    const { ShortUrl } = db.models;
    const result = await ShortUrl.findOne({
      where: { suffix },
    });
    return result;
  }
}