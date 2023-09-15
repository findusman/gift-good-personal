
const failed_contact = (sequelize, DataTypes) => {
    const FailedContact = sequelize.define('failedContact', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        reason: DataTypes.TEXT                      // Failed reason
    });

    FailedContact.associate = models => {
        FailedContact.belongsTo(models.Contact);          // A failed contact has a real contact
    };

    return FailedContact;
};

module.exports = failed_contact;
