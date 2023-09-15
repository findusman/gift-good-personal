'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const incorrectCampaigns = await queryInterface.sequelize.query(
      `SELECT c.id as campaign_id, c.title, credit_amount, ca.id as campaign_account_id, ca.user_id, c.price, (SELECT
        COUNT(*)
      FROM contacts
      WHERE 
        contacts."campaignId" = c.id 
      AND contacts.enabled = true
      AND
        step = ANY('{"ready", "sent", "reactivated", "bounced", "sending"}')
      ) AS active_contact_count,
      (SELECT
            COUNT(*) * c.price
          FROM contacts
          WHERE
            contacts."campaignId" = c.id
          AND contacts.enabled = true
          AND
            step = ANY('{"ready", "sent", "reactivated", "bounced", "sending"}')
          ) AS correct_balance
      FROM "campaignAccounts" ca
      LEFT JOIN campaigns c ON ca."campaignId" = c.id
      WHERE credit_amount != (SELECT
        COUNT(*) * c.price
        FROM contacts
        WHERE
          contacts."campaignId" = c.id
        AND contacts.enabled = true
        AND step = ANY('{"ready", "sent", "reactivated", "bounced", "sending"}')) 
      AND closed = false;`
    );
    console.log(`Fixing balances of ${incorrectCampaigns[0].length} campaigns`);

    for (const campaign of incorrectCampaigns[0]) {
      console.log(campaign);
      try {
        const { campaign_account_id, campaign_id, user_id, title, credit_amount, correct_balance } = campaign;
        await queryInterface.sequelize.query(`
          UPDATE "campaignAccounts"
          SET
            credit_amount = :correct_balance
          WHERE id = :campaign_account_id;
        `,
        {
          replacements: { campaign_account_id, correct_balance }
        });
        console.log(`Updated balance of account of campaign ${title}, id: ${campaign_id}, old balance: ${credit_amount}, new balance: ${correct_balance}`);
        
        await queryInterface.sequelize.query(`
          INSERT INTO "creditTransactions"
            ("creditAmount", "comment", "type", "userId", "campaignBalance", "campaignId", "createdAt", "updatedAt")
          VALUES
            (:creditAmount, :comment, :type, :userId, :campaignBalance, :campaignId, :createdAt, :updatedAt);
        `, {
          replacements: {
            creditAmount: correct_balance,
            comment: `Fix incorrect balances in open campaign accounts: set campaign balance from ${credit_amount} to ${correct_balance}`,
            type: 'admin-adjustment',
            userId: user_id,
            campaignBalance: correct_balance,
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
