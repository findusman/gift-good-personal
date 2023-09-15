'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('Rename tracked status to shipped started');
    await queryInterface.sequelize.query(`
      UPDATE "contacts" SET step='shipped' WHERE step = 'tracked'
    `);
    console.log('Rename shipped status to redeemed completed');
  },
};
