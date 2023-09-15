const db = require('../sequelize');
const { Op } = require('sequelize');
const { sendNotificationMail } = require('../../api/mail');

module.exports = {
    create: async function (credit_amount, campaignId, user_id) {
        const { CampaignAccount } = db.models;
        await CampaignAccount.create({
            credit_amount: credit_amount,
            campaignId: campaignId,
            user_id: user_id
        })
    },

    check_negative_balance_closed_accounts: async function () {
        const { CampaignAccount } = db.models;

        const negativeBalanceCampaigns =  await CampaignAccount.findAll({
            where: {
                credit_amount: {
                    [Op.lt]: 0
                },
                closed: true
            }
        })

        if (negativeBalanceCampaigns && negativeBalanceCampaigns.length > 0) {
            await sendNotificationMail({
                content: `
                    <p>There are ${negativeBalanceCampaigns.length} campaigns with negative balance and closed status.</p>
                    <p>Here is the list of campaigns:</p>
                    <ul>
                        ${negativeBalanceCampaigns.map((campaign) => `
                            <li>Campaign id: ${campaign.campaignId}, balance: ${campaign.credit_amount}</li>
                        `).join('')}
                    </ul> 
                `,
                subject: `Found ${negativeBalanceCampaigns.length} campaigns with negative balance and closed status`,
                ccAdmin: true
            });
        }
    },
}
