const { Op } = require('sequelize');

const campaignAccount = (sequelize, DataTypes) => {
  const CampaignAccount = sequelize.define('campaignAccount', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    credit_amount: DataTypes.FLOAT,
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    closed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
  });

  CampaignAccount.associate = (models) => {
    CampaignAccount.belongsTo(models.Campaign);
    CampaignAccount.belongsTo(models.User, {
      foreignKey: 'user_id',
    });
  };

  return CampaignAccount;
};

module.exports = campaignAccount;
