const { Op } = require('sequelize');

const savingsAccount = (sequelize, DataTypes) => {
    const SavingsAccount = sequelize.define('savingsAccount', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        balance: DataTypes.FLOAT,                        
    });
    SavingsAccount.associate = models => {
        SavingsAccount.belongsTo(models.User);
        SavingsAccount.hasMany(models.CreditTransaction, { onDelete: 'CASCADE' });
    }   
    return SavingsAccount;
};

module.exports = savingsAccount;
