'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Remove duplicated unique constraints (unique index was added instead)
  // https://github.com/sequelize/sequelize/issues/12889
  async up (queryInterface, Sequelize) {
     const constraints = await queryInterface.sequelize.query(
        `SELECT constraint_name FROM information_schema.constraint_table_usage
        WHERE table_name = 'users' and (constraint_name like 'users_email_key%' or constraint_name like 'users_username_key%');`
      );
      const constraintNames = constraints[0].map(el => el.constraint_name);
      console.log(`Removing ${constraintNames.length} constraints`);
      for (const i of constraintNames) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "users" DROP CONSTRAINT "${i}"`
        );
      }
      console.log(`Removed ${constraintNames.length} constraints`);
  },
};
