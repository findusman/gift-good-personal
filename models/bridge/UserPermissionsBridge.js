const db = require('../sequelize');

module.exports = {
  saveUserPermissions: async function (userId, permissions) {
    const { UserPermission } = db.models;
    return await UserPermission.create({
      userId,
      ...permissions
    });
  },
  getUserPermissions: async function(userId) {
    const { UserPermission } = db.models;
    const permissions = await UserPermission.findAll({
      where: {
        userId
      }
    });
    return permissions;
  },
  updateUserPermissions: async function(userId, permissions) {
    const { UserPermission, User } = db.models;
    const currentPermissions = await UserPermission.findOne({ where: { userId } });
    await User.update({
      needs_reload: true,
    },
      { where: { id: userId } }
    );
    if (currentPermissions) {
      return await currentPermissions.update({ ...permissions });
    } else {
      return await UserPermission.create({
        ...permissions,
        userId
      });
    }
  }
}