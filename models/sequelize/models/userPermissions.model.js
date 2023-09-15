// Field is a resource and value is access level saved as integer
// Access level is defined similarily to unix file permission
// 1 - read, 2 - create, 4 - update, 8 - delete
// 3 - read and create, 5 - read and update, 15 - all, etc.
const userPermission = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('userPermissions', {
      Campaign: {
        type: DataTypes.INTEGER
      },
      CompanyCampaign: {
        type: DataTypes.INTEGER
      },
      Report: {
        type: DataTypes.INTEGER
      },
      User: {
        type: DataTypes.INTEGER
      },
  });

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.User);
  };

  return UserPermission;
};

module.exports = userPermission;