'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transactions = await queryInterface.sequelize.query(
      `select ct.id, ca."campaignId" from "creditTransactions" ct 
      left join "campaignAccounts" ca on ca.id = ct."campaignId" 
      where comment = 'Setting Up Campaign Account' and ct."campaignId" is not null and ca."campaignId" is not null;`
    );
    const rows = transactions[0];
    console.log(rows);
    console.log(`Updating ${rows.length} transactions records`);

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].campaignId) {
        await queryInterface.sequelize.query(
          `UPDATE "creditTransactions" SET "campaignId"=${rows[i].campaignId} WHERE id=${rows[i].id}`);
        console.log(`Updated credit transaction with id ${rows[i].id}, new campaignId: ${rows[i].campaignId}`);
      }
    }  
  },
};
