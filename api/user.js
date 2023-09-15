const { Op } = require('sequelize');

const userTypeNames = {
  'admin': 'GFG admin',
  'client': 'Company admin',
  'client-standard': 'Standard',
  'read-only': 'Read only'
}

const mapUserTypes = (type) => {
  const userTypeNames = {
    'admin': 'GFG superadmin',
    'admin-standard': 'GFG admin',
    'client': 'Company admin',
    'client-standard': 'Standard',
    'read-only': 'Read only'
  }
  return userTypeNames[type];
};

const groupUsersByParent = (users) => {
  return users
    .filter(user => !user.parent_id)
    .map(parent => (
      {
        ...parent.dataValues,
        children: users.filter(user => user.parent_id === parent.id)
      }
    ));
};

const searchByCondition = (search) => {
  const userType = Object.keys(userTypeNames).find(
    key => userTypeNames[key] && userTypeNames[key].toUpperCase() === search.toUpperCase()
  );
  const searchValue = userType || search;
  const searchByFields = ['firstname', 'lastname', 'company', 'email', 'job', 'type'];
  return searchByFields.map(el => ({ [el]: { [Op.iLike]: `%${searchValue}%` } }))
}

module.exports = {
  mapUserTypes,
  groupUsersByParent,
  searchByCondition
}