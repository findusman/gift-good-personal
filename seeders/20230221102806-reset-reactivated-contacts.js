'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const contacts = await queryInterface.sequelize.query(`
    SELECT id, step FROM contacts WHERE id = ANY(:ids) and step = 'reactivated'
    `, { replacements: {
      ids: `{195059, 89818}`
    }});
    for (const contact of contacts[0]) {
      await queryInterface.sequelize.query(`
          UPDATE "contacts"
          SET step = :step
          WHERE id = :id;
        `, { replacements: { step: 'sent', id: contact.id } 
      });
      console.log(`Changed status of contact id ${contact.id} to 'sent'`)
    }
  },
};
