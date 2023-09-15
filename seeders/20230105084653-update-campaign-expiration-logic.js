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
      ORDER BY "updatedAt" DESC;
    `);

    const incorrectUserIds = incorrectCampaigns[0].map(campaign => campaign.user_id);

    for (const userId of incorrectUserIds) {
      const campaignsCorrectedData = await queryInterface.sequelize.query(`
        SELECT
          c.id AS campaign_id,
          ca.id AS campaign_account_id,
          c."createdAt",
          expire_date,
          price,
          (
          SELECT
            COUNT(*)
          FROM contacts
          WHERE contacts."campaignId" = c.id
        ) AS contact_count,
          (SELECT
            COUNT(*)
          FROM contacts
          WHERE 
            contacts."campaignId" = c.id 
          AND
            step = ANY('{"ready", "sent", "reactivated", "bounced", "sending"}')
          ) AS active_contact_count,
          credit_amount as current_balance,
          (SELECT
            COUNT(*) * c.price
          FROM contacts
          WHERE
            contacts."campaignId" = c.id
          AND
            step = ANY('{"ready", "sent", "reactivated", "bounced", "sending"}')
          ) AS correct_balance
        FROM campaigns c
          LEFT JOIN "campaignAccounts" ca ON ca."campaignId" = c.id
        WHERE
          "userId" = :userId
        AND
          ca.closed = true
        AND
          c.enabled = true
        AND 
          ca."updatedAt" < c.expire_date
        AND
          credit_amount < 0
      `,
        { replacements: { userId } });

      try {
        const savingsAccount = await queryInterface.sequelize.query(`
        SELECT s.id, s.balance FROM "savingsAccounts" AS s WHERE s."userId" = :userId;
      `, { replacements: { userId } });
        const savingsAccountBalance = savingsAccount[0][0].balance;
        const savingsAccountId = savingsAccount[0][0].id;

        const missingBalance = campaignsCorrectedData[0].reduce((acc, campaign) => acc + (campaign.correct_balance - campaign.current_balance), 0);
        const newSavingAccountBalance = savingsAccountBalance - missingBalance;

        if (newSavingAccountBalance < 0) {
          throw Error(`User ${userId} has insufficient funds in savings account to correct balance`);
        }

        await queryInterface.sequelize.query(`
          UPDATE "savingsAccounts"
          SET balance = :newSavingAccountBalance
          WHERE "userId" = :userId;
        `, { replacements: { newSavingAccountBalance, userId } });
        await queryInterface.sequelize.query(`
          INSERT INTO "creditTransactions"
              ("creditAmount", "comment", "type", "userId", "savingsBalance", "savingsAccountId", "createdAt", "updatedAt")
          VALUES
              (:creditAmount, :comment, :type, :userId, :savingsBalance, :savingsAccountId, :createdAt, :updatedAt);
        `, {
          replacements: {
            creditAmount: missingBalance,
            comment: 'Balance correction for saving account',
            type: 'admin-adjustment',
            userId,
            savingsBalance: newSavingAccountBalance,
            savingsAccountId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        for (const data of campaignsCorrectedData[0]) {
          const { campaign_id, campaign_account_id, correct_balance, current_balance } = data;
          await queryInterface.sequelize.query(`
            UPDATE "campaignAccounts"
            SET
              credit_amount = :correct_balance,
              closed = false
            WHERE id = :campaign_account_id;
          `,
          {
            replacements: { campaign_account_id, correct_balance }
          });
          await queryInterface.sequelize.query(`
            INSERT INTO "creditTransactions"
              ("creditAmount", "comment", "type", "userId", "campaignBalance", "campaignId", "createdAt", "updatedAt")
            VALUES
              (:creditAmount, :comment, :type, :userId, :campaignBalance, :campaignId, :createdAt, :updatedAt);
        `, {
            replacements: {
              creditAmount: correct_balance - current_balance,
              comment: 'Balance correction for campaign',
              type: 'admin-adjustment',
              userId,
              campaignBalance: correct_balance,
              campaignId: campaign_id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

      } catch (error) {
        console.log(error);
      }
    }
  },
};
