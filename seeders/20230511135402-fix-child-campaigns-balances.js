'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const incorrectCampaigns = await queryInterface.sequelize.query(`
      SELECT c.id, MIN(ca.id) as campaign_account_id, c.title, c.price, c."userId" as user_id, COUNT(co.id) as redeemed_contact_count, MIN(ca.credit_amount) as balance, COUNT(co.id) * c.price as used_balance, MIN(ca.credit_amount) - (COUNT(co.id) * c.price) as correct_balance 
      FROM campaigns c
      LEFT JOIN contacts co ON co."campaignId" = c.id AND co.step = ANY('{"confirmed", "redeemed", "shipped", "delivered", "canceled"}')
      LEFT JOIN "campaignAccounts" ca ON c.id = ca."campaignId"
      LEFT JOIN users u ON u.id = c."userId"
      WHERE u.parent_id != 0 AND c."createdAt" >= '2023-02-16 00:00:00' AND ca.closed = false
      GROUP BY c.id
      HAVING MIN(ca.credit_amount) - (COUNT(co.id) * c.price) > 0;
    `);
    console.log(`Updating balances of ${incorrectCampaigns[0].length} campaigns`);
    for (const campaign of incorrectCampaigns[0]) {
      console.log(campaign);
      const { campaign_account_id, correct_balance, id, title, user_id } = campaign;
      await queryInterface.sequelize.query(`
          UPDATE "campaignAccounts"
          SET
            credit_amount = :correct_balance
          WHERE id = :campaign_account_id;
        `, { replacements: { campaign_account_id: campaign_account_id, correct_balance: correct_balance } });
      await queryInterface.sequelize.query(`
        INSERT INTO "creditTransactions"
          ("creditAmount", "comment", "type", "userId", "campaignBalance", "campaignId", "createdAt", "updatedAt")
        VALUES
          (:creditAmount, :comment, :type, :userId, :campaignBalance, :campaignId, :createdAt, :updatedAt);
        `, {
          replacements: {
            creditAmount: correct_balance,
            comment: `Fix incorrect balances for children's campaigns`,
            type: 'admin-adjustment',
            userId: user_id,
            campaignBalance: correct_balance,
            campaignId: id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
      });
      console.log(`Updated balance of account of campaign ${title}, id: ${id}`);
    }
  }
};
