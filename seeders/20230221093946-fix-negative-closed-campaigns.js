'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const incorrectCampaigns = await queryInterface.sequelize.query(`
      SELECT
        c.id AS campaign_id,
        ca.id AS campaign_account_id,
        credit_amount,
        user_id,
        closed,
        ca."createdAt",
        ca."updatedAt",
        "campaignId",
        c.title,
        sa.balance,
        sa.id as savings_account_id
      FROM public."campaignAccounts" ca
          LEFT JOIN campaigns c on c.id = ca."campaignId"
          LEFT JOIN "savingsAccounts" sa ON ca.user_id = sa."userId"
      WHERE
          closed = true
        AND
          credit_amount < 0;
    `);
    console.log(`Set balances of ${incorrectCampaigns[0].length} campaign accounts to 0`);
    for (const campaign of incorrectCampaigns[0]) {
      try {
        console.log(campaign);
        const { campaign_account_id, campaign_id, user_id, title, credit_amount, savings_account_id, balance } = campaign;
        const newSavingAccountBalance = balance + credit_amount;

        if (newSavingAccountBalance < 0) {
          throw Error(`User ${user_id} has insufficient funds in savings account to correct balance`);
        }
        console.log(newSavingAccountBalance);
        await queryInterface.sequelize.query(`
          UPDATE "savingsAccounts"
          SET balance = :newSavingAccountBalance
          WHERE "userId" = :user_id;
        `, { replacements: { newSavingAccountBalance, user_id } });
        
        await queryInterface.sequelize.query(`
          UPDATE "campaignAccounts"
          SET
            credit_amount = :correct_balance
          WHERE id = :campaign_account_id;
        `, { replacements: { campaign_account_id, correct_balance: 0 } });
        console.log(`Updated balance of account of campaign ${title}, id: ${campaign_id}`);
        
        await queryInterface.sequelize.query(`
          INSERT INTO "creditTransactions"
            ("creditAmount", "comment", "type", "userId", "campaignBalance", "campaignId", "createdAt", "updatedAt", "savingsBalance", "savingsAccountId")
          VALUES
            (:creditAmount, :comment, :type, :userId, :campaignBalance, :campaignId, :createdAt, :updatedAt, :savingsBalance, :savingsAccountId);
          `, {
            replacements: {
              creditAmount: credit_amount,
              comment: `Fix negative balances in closed campaign accounts`,
              type: 'admin-adjustment',
              userId: user_id,
              campaignBalance: 0,
              campaignId: campaign_id,
              savingsBalance: newSavingAccountBalance,
              savingsAccountId: savings_account_id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
        });
      } catch(e) {
        console.error(e);
      }
    }
  },
};
