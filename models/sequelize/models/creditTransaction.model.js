const { Op } = require('sequelize');
const ConstData = require('../../../util/const_data');

const credit = (sequelize, DataTypes) => {
    const CreditTransaction = sequelize.define('creditTransaction', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        creditAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        usd_amount: DataTypes.FLOAT,
        comment: DataTypes.TEXT,  
        stripeId: DataTypes.STRING,
        type: {
            allowNull: false,
            type: DataTypes.STRING,
            validate: {
                isIn: [[ConstData.DEPOSIT_TRANSACTION, ConstData.WITHDRAWL_TRANSACTION, ConstData.STRIPE_TRANSACTION, ConstData.ADMIN_TRANSACTION]]
            }
        },
        savingsBalance: {
            type: DataTypes.FLOAT,
        },
        campaignBalance: {
            type: DataTypes.FLOAT,
        },
    });

    CreditTransaction.associate = models => {
        CreditTransaction.belongsTo(models.User);
        CreditTransaction.belongsTo(models.Campaign);
        CreditTransaction.belongsTo(models.SavingsAccount);
    };

    return CreditTransaction;
};

module.exports = credit;
