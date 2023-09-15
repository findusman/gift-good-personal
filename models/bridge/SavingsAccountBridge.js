let cheerio = require('cheerio');
const db = require('../sequelize');
const {Op} = require('sequelize');

module.exports = {
    create: async function (credit_amount, campaignId, user_id) {
        const {SavingsAccount} = db.models;
        await SavingsAccount.create({
            credit_amount: credit_amount,
            campaignId: campaignId,
            user_id: user_id
        })
    }
}
