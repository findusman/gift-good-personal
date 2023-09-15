'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const contacts = await queryInterface.sequelize.query(
      `select id, "to_email", "shipping_email" from contacts where "campaignId" = 2109 and "shipping_email" != "to_email" and "shipping_email" not like '%kpmg.com%'`
    );
    const rows = contacts[0];
    console.log(rows);
    console.log(`Updating ${rows.length} contact records`);

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].to_email !== rows[i].shipping_email) {
        await queryInterface.sequelize.query(
         `UPDATE "contacts" SET "shipping_email"='${rows[i].to_email}' WHERE id=${rows[i].id}`);
        console.log(`Updated contact with id ${rows[i].id}, old email: ${rows[i].shipping_email}, new email: ${rows[i].to_email}`);
      }
    }  
  },
};
