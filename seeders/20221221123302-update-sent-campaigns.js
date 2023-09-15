'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const result = await queryInterface.sequelize.query(
      `SELECT ca.id, COUNT(DISTINCT co.id) AS sent_count, MIN(co.sent_at) as min_date
      FROM campaigns ca 
      LEFT JOIN contacts co ON co."campaignId" = ca.id 
      WHERE ca.is_sent = false AND is_collection_products_type = 'true' AND co.step != 'ready' AND co.step != 'expired' AND co.sent_at is not null
      GROUP BY ca.id;`
    );

    const campaigns = result[0];
    console.log(`Updating send date of ${campaigns.length} campaigns`);

    for (let i = 0; i < campaigns.length; i++) {
      const date = new Date(campaigns[i].min_date).toISOString();
      await queryInterface.sequelize.query(
        `UPDATE "campaigns" SET sent_at=:date, is_sent=true WHERE id=:id`, 
        { replacements: { date, id: campaigns[i].id } }
      );
      console.log(`Updated sent data for campaign ${campaigns[i].id}, new sent at date: ${date}`);
    }  
  },
};
