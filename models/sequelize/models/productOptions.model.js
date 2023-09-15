const productOptions = (sequelize, DataTypes) => {
  const ProductOptions = sequelize.define('productOptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      optionId: {
        allowNull: false,
        type: DataTypes.STRING
      },
      name: {
        type: DataTypes.STRING
      },
      position: {
        type: DataTypes.INTEGER
      },
      values: {
        type: DataTypes.TEXT
      }
  });

  ProductOptions.associate = models => {
      ProductOptions.belongsTo(models.Product);
  };

  return ProductOptions;
};

module.exports = productOptions;