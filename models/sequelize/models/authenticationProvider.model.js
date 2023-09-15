const authenticationProvider = (sequelize, DataTypes) => {
    const AuthenticationProvider = sequelize.define('authenticationProvider', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        adapter: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        config: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
    });

    AuthenticationProvider.associate = models => {
        AuthenticationProvider.belongsToMany(models.Campaign, {
            through: 'campaignAuthentication',
        });
        AuthenticationProvider.hasOne(models.AuthenticationToken);
    };

    return AuthenticationProvider;
  };

  module.exports = authenticationProvider;
