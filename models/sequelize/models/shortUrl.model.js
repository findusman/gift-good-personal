const shortUrl = (sequelize, DataTypes) => {
  const ShortUrl = sequelize.define('shortUrl', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      redirectPath: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      suffix: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['suffix'],
      }
    ]
  });

  ShortUrl.associate = (models) => {
    ShortUrl.belongsTo(models.Contact);
    ShortUrl.belongsTo(models.Campaign);
  };

  return ShortUrl;
};

module.exports = shortUrl;
