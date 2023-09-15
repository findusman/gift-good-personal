const authenticationToken = (sequelize, DataTypes) => {
    const AuthenticationToken = sequelize.define('authenticationToken', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        authenticatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['token', 'authenticationProviderId']
            }
        ]
    });

    AuthenticationToken.associate = models => {
        AuthenticationToken.belongsTo(models.Contact);
        AuthenticationToken.belongsTo(models.AuthenticationProvider);
    };

    return AuthenticationToken;
  };

  module.exports = authenticationToken;
