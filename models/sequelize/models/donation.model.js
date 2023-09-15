const donation = (sequelize, DataTypes) => {
  const Donation = sequelize.define('donation', {
      id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER
      },
      // current balance - credits that need to be donated
      balance: {
          type: DataTypes.FLOAT,
          allowNull: false
      },
      initialBalance: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      // when credits were donated
      donatedAt: DataTypes.DATE,                               
  });

  Donation.associate = models => {
      Donation.belongsTo(models.Campaign);
  };

  return Donation;
};

module.exports = donation;
