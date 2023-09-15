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
        c.title
      FROM public."campaignAccounts" ca
          LEFT JOIN campaigns c on c.id = ca."campaignId"
      WHERE
          closed = true
        AND
          credit_amount < 0
        AND
          ca."updatedAt" < c.expire_date
        AND c.expire_date < :today
      ORDER BY "updatedAt" DESC;
    `, { replacements: { today: new Date() } });
    console.log(`Set balances of ${incorrectCampaigns[0].length} campaign accounts to 0`);

    for (const campaign of incorrectCampaigns[0]) {
      console.log(campaign);
      try {
        const { campaign_account_id, campaign_id, user_id, title, credit_amount } = campaign;
        await queryInterface.sequelize.query(`
          UPDATE "campaignAccounts"
          SET
            credit_amount = :correct_balance
          WHERE id = :campaign_account_id;
        `,
        {
          replacements: { campaign_account_id, correct_balance: 0 }
        });
        console.log(`Updated balance of account of campaign ${title}, id: ${campaign_id}`);
        await queryInterface.sequelize.query(`
          INSERT INTO "creditTransactions"
            ("creditAmount", "comment", "type", "userId", "campaignBalance", "campaignId", "createdAt", "updatedAt")
          VALUES
            (:creditAmount, :comment, :type, :userId, :campaignBalance, :campaignId, :createdAt, :updatedAt);
      `, {
          replacements: {
            creditAmount: 0,
            comment: `Fix negative balances in closed campaign accounts: set campaign balance from ${credit_amount} to 0`,
            type: 'admin-adjustment',
            userId: user_id,
            campaignBalance: 0,
            campaignId: campaign_id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.log(error);
      }
    }
  },
};
