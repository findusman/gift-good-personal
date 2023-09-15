'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const result = await queryInterface.sequelize.query(
      `SELECT u.id, u.email, u.parent_id, s.id as "accountId", s.balance as "savingsBalance", ps.id as "parentAccountId", ps.balance as "parentBalance"
      FROM public.users u
      LEFT JOIN "savingsAccounts" s ON u.id = s."userId"
      LEFT JOIN "savingsAccounts" ps ON u.parent_id = ps."userId"
      WHERE u.parent_id != 0 AND s.balance != 0;`
    );

    const accounts = result[0];
    console.log(`Transferring ${accounts.length} savings from child to parent savings account`);

    try {
      for (let i = 0; i < accounts.length; i++) {
        const newBalance = accounts[i].savingsBalance + accounts[i].parentBalance;
        // Update parent savings
        await queryInterface.sequelize.query(
          `UPDATE "savingsAccounts" SET balance=:newBalance WHERE id=:parentAccountId`, 
          { replacements: { newBalance, parentAccountId: accounts[i].parentAccountId } }
        );
        // Update child savings
        await queryInterface.sequelize.query(
          `UPDATE "savingsAccounts" SET balance=0 WHERE id=:id`, 
          { replacements: { id: accounts[i].accountId } }
        );
        // Log transaction info
        await queryInterface.sequelize.query(`
          INSERT INTO "creditTransactions"
              ("creditAmount", "comment", "type", "userId", "savingsBalance", "savingsAccountId", "createdAt", "updatedAt")
          VALUES
              (:creditAmount, :comment, :type, :userId, :savingsBalance, :savingsAccountId, :createdAt, :updatedAt);
        `, {
          replacements: {
            creditAmount: accounts[i].savingsBalance,
            comment: `Transferred credits from child (user id: ${accounts[i].id}) savings (GFG-844)`,
            type: 'admin-adjustment',
            userId: accounts[i].parent_id,
            savingsBalance: newBalance,
            savingsAccountId: accounts[i].parentAccountId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`Transferring user ${accounts[i].email} (id: ${accounts[i].id}) savings (${accounts[i].savingsBalance}) to parent (id: ${accounts[i].parent_id}) savings (new parent balance: ${newBalance})`);
      }
    } catch(e) {
      console.error(e);
    }
  },
};
