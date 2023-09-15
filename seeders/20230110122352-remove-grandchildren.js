'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const result = await queryInterface.sequelize.query(
      `SELECT u.id, u.parent_id, u.email, p.parent_id as grandparent_id
      FROM public.users u
      left join users p on u.parent_id = p.id 
      where p.parent_id != 0;`
    );

    const users = result[0];
    console.log(`Updating parent id of ${users.length} users`);

    for (let i = 0; i < users.length; i++) {
      await queryInterface.sequelize.query(
        `UPDATE "users" SET parent_id=:grandparent WHERE id=:id`, 
        { replacements: { grandparent: users[i].grandparent_id, id: users[i].id } }
      );
      console.log(`Updated user ${users[i].email} (id: ${users[i].id}) with new parent id: ${users[i].grandparent_id}`);
    }  
  },
};
