const { createUrlSuffix, getCustomerLandingPath } = require('../api/url');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const contacts = await queryInterface.sequelize.query(
      `SELECT c.id FROM contacts c 
      LEFT JOIN public."shortUrls" s ON c.id = s."contactId"
      LEFT JOIN campaigns on c."campaignId" = campaigns.id
      WHERE s."contactId" IS NULL AND c.enabled = true and campaigns.enabled = true;`
    );

    const dataToInsert = contacts[0].map(contact => {
      const suffix = createUrlSuffix();
      const contactId = contact.id;
      const redirectPath = getCustomerLandingPath({ isDemo: false, id: contactId });
      return {
        suffix,
        redirectPath,
        contactId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`Adding ${contacts[0].length} short urls for contacts`);
    return dataToInsert.length ? queryInterface.bulkInsert('shortUrls', dataToInsert) : null;
  },
};
