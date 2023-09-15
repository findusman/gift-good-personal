const ConstData = require('../util/const_data');

const allActions = ['read', 'create', 'update'];

let clientDefaultAccessRules = [
  { action: ['read', 'update'], subject: 'Credit' },
];

const clientFullAccessRules = [
  ...clientDefaultAccessRules,
  { action: allActions, subject: 'Report' },
  { action: allActions, subject: 'Campaign' },
  { action: allActions, subject: 'User' },
  { action: allActions, subject: 'CompanyCampaign' }
];

const checkAccess = (permissions, type) => {
  const neededAccessLevel = {
    'read': 1,
    'create': 2,
    'update': 4,
    'delete': 8
  }
  return (permissions & neededAccessLevel[type]) > 0
};

const getAvailableCompanyUsers = ({ session, ability, action }) => {
  const { user, companyUsers } = session;
  const canManageCompanyCampaigns = !!(ability.can(action, 'CompanyCampaign') && companyUsers.length);
  return canManageCompanyCampaigns ? companyUsers : user.id;
};

const defineRulesFor = ((user) => {
  let rules = [];
  if (user) {
    switch (user.type) {
      case ConstData.ADMIN_USER:
        rules = [{ action: ['manage'], subject: 'all' }];
        break;
      case ConstData.STANDARD_ADMIN_USER:
        rules = [
          { action: ['manage'], subject: 'all' },
          { action: ['update'], subject: 'Credit', inverted: true },
          { action: ['delete'], subject: 'Campaign', inverted: true },
          { action: ['delete'], subject: 'User', inverted: true },
          { action: ['create'], subject: 'Admin', inverted: true },
        ];
        break;
      case ConstData.CLIENT_USER:
        rules = [
          { action: 'manage', subject: 'Company' },
          ...clientFullAccessRules
        ];
        break;
      case ConstData.READ_ONLY_USER:
        rules = [
          { action: ['read'], subject: 'Report' },
          { action: ['read'], subject: 'Campaign' },
          { action: ['read'], subject: 'CompanyCampaign' }
        ];
        break;
      case ConstData.STANDARD_CLIENT_USER:
        if (user.userPermission) {
          rules = clientDefaultAccessRules;
          Object.entries(user.userPermission).forEach(([resource, permissions]) => {
            const actions = ['read', 'create', 'update', 'delete'].filter(action => checkAccess(permissions, action));
            if (actions.length) {
              rules.push({ action: actions, subject: resource })
            }
          });
        } else {
          rules = clientFullAccessRules;
        }
        break;
      default:
        rules = [];
    }
  }
  return rules;
});

module.exports = { 
  defineRulesFor, 
  checkAccess,
  getAvailableCompanyUsers
};