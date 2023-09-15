const Helper = require('../../util/helper');
const ConstData = require('../../util/const_data');
const { groupUsersByParent, searchByCondition } = require('../../api/user');

const db = require('../sequelize');
const { Op } = require('sequelize');

module.exports = {
  list_sib_users: async function (user_id, search) {
    const { User, UserPermission } = db.models;
    let where = {};
    const belongsToCompany = [{ parent_id: { [Op.and]: [user_id, { [Op.ne]: 0 } ] } }, { id: user_id }];
    if (search) {
      where = { [Op.and]: [{ [Op.or]: belongsToCompany }, { [Op.or]: searchByCondition(search) }] }
    } else {
      where = {
        [Op.or]: belongsToCompany
      }
    }
    return await User.findAll({
      where,
      attributes: [
        'id',
        'avatar',
        'firstname',
        'lastname',
        'username',
        'email',
        'job',
        'company',
        'last_login_at',
        'type',
        'parent_id'
      ],
      include: [{
        model: UserPermission,
        attributes: ['Campaign', 'User', 'Report', 'CompanyCampaign']
      }],
      order: [['type', 'ASC'], ['email', 'ASC']],
    });
  },

  list_all_users: async function (search, type) {
    const { User, UserPermission } = db.models;
    const where = {
      archived: false,
      ...(type === 'admin' && { type: [ConstData.STANDARD_ADMIN_USER, ConstData.ADMIN_USER] })
    };
    if (search) {
      where[Op.or] = searchByCondition(search);
    }
    return await User.findAll({
      where,
      attributes: [
        'id',
        'avatar',
        'firstname',
        'lastname',
        'username',
        'email',
        'job',
        'company',
        'last_login_at',
        'type',
        'parent_id',
      ],
      include: [{
        model: UserPermission,
        attributes: ['Campaign', 'User', 'Report', 'CompanyCampaign']
      }],
      order: [
        ['company', 'ASC'],
        ['email', 'ASC'],
      ],
    });
  },

  listCompanyUsersIds: async function(user) {
    const { User } = db.models;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { parent_id: { [Op.and]: [[user.id, user.parent_id], { [Op.ne]: 0 } ] } }, 
          { id: [user.id, user.parent_id] },
        ],
      },
      attributes: ['id']
    });
    const ids = users.map(user => user.id);
    return ids;
  },

  list_users_credits: async function ({ query, type }) {
    const { User, SavingsAccount, CampaignAccount, Campaign, Donation } = db.models;
    const isFilterEnabled = type && type !== 'all' && query;

    const users = await User.findAll({
      where: {
        ...(isFilterEnabled && {[type]: { [Op.iLike]: `%${query}%` }}),
      },
      attributes: [
        'id',
        'firstname',
        'lastname',
        'username',
        'email',
        'updatedAt',
        'company',
        'parent_id',
        'type',
      ],
      include: [
        {
          model: SavingsAccount,
          attributes: ['balance'],
        },
        {
          model: CampaignAccount,
          attributes: ['credit_amount'],
          where: { closed: false },
          required: false,
        },
        {
          model: Campaign,
          include: {
            model: Donation,
            as: 'donation',
            where: { id: {[Op.ne]: null} }
          }
        }
      ],
      order: [
        ['email', 'ASC'],
      ],
    });

    const groupedUsers = groupUsersByParent(users) || [];
    return { groupedUsers, count: groupedUsers.length };
  },

  // Find user who has login name
  findByName: async function (login) {
    const { User, UserPermission } = db.models;
    const fresh_login = login.toLowerCase().trim();
    let user = await User.findOne({
      where: { username: fresh_login },
    });

    if (!user) {
      user = await User.findOne({
        where: { email: fresh_login },
        include: {
          model: UserPermission,
          attributes: ['Campaign', 'User', 'Report', 'CompanyCampaign']
        }
      });
    }

    return user;
  },

  findById: async function (user_id) {
    const { User } = db.models;
    return await User.findByPk(user_id);
  },

  // Check user's password
  checkPassword: (user, password) => {
    const hashed_password = Helper.sha512(password, user['salt']).hash;
    return user['password'] === hashed_password;
  },

  // Check if user is locked, but the lock time is not passed yet
  checkLockStatus: (user) => {
    const last_failed_at = user['last_failed_login_at'] || new Date();
    const now = new Date();
    const passed_minutes =
      (now.getTime() - last_failed_at.getTime()) / (1000 * 60);
    // If failed retry count exceeds limit and the time is not passed yet
    if (
      user['failed_login_count'] > process.env.MAX_LOGIN_RETRY_COUNT &&
      passed_minutes < process.env.LOGIN_LOCK_TIME
    ) {
      return false;
    }
    return true;
  },

  // Find user who has reset token
  findByResetToken: async (reset_token) => {
    const { User } = db.models;
    return await User.findOne({
      where: { reset_token: reset_token },
    });
  },

  // Find user who has verify token
  findByVerifyToken: async (verify_token) => {
    const { User } = db.models;
    return await User.findOne({
      where: { verify_token: verify_token },
    });
  },

  // Create user in register page
  createUserBySelf: async (
    email,
    firstname,
    lastname,
    job,
    company,
    password,
    verify_token
  ) => {
    const { User, UserPermission } = db.models;
    const user = await User.create({
      email: email.toLowerCase().trim(),
      firstname,
      lastname,
      name: firstname + ' ' + lastname,
      username: 'user-' + Helper.genRandomString(10),
      job,
      company,
      password,
      type: ConstData.CLIENT_USER,
      verify_token,
    });
    await UserPermission.create({
      userId: user.id,
    });
    return user;
  },
  // Create user in client dashboard
  createUserByParent: async (
    parent_id,
    email,
    firstname,
    lastname,
    avatar,
    job,
    company,
    password,
    type,
  ) => {
    const { User } = db.models;
    const parent = await User.findByPk(parent_id);
    const shouldSetParent = parent && parent.type !== ConstData.ADMIN_USER;
    const user = await User.create({
      parent_id: shouldSetParent ? parent_id : 0,
      email: email.toLowerCase().trim(),
      firstname,
      lastname,
      name: firstname + ' ' + lastname,
      username: 'user-' + Helper.genRandomString(10),
      avatar,
      job,
      company,
      password,
      type,
      verified: true,
    });
    return user;
  },

  setVerified: async function (user_id) {
    const { User } = db.models;
    await User.update(
      {
        // verify_token: '', verified: true
        verified: true,
      },
      { where: { id: user_id } }
    );
  },
  archive: async function (user_id) {
    const { User } = db.models;
    await User.update(
      {
        // verify_token: '', verified: true
        archived: true,
        email: (Math.random() + 1).toString(36).substring(7) + '@archive.com',
      },
      { where: { id: user_id } }
    );
  },

  setResetToken: async function (user_id, reset_token) {
    const { User } = db.models;
    await User.update(
      {
        reset_token: reset_token,
      },
      { where: { id: user_id } }
    );
  },
  setVerifiedToken: async function (user_id, verified_token) {
    const { User } = db.models;
    await User.update(
      {
        verify_token: verified_token,
      },
      { where: { id: user_id } }
    );
  },

  loginSuccess: async function (user, data) {
    await user.update({
      failed_login_count: 0,
      ...data,
    });
  },

  loginFailed: async function (user) {
    const last_failed_at = user['last_failed_login_at'] || new Date();
    const now = new Date();
    const passed_seconds = (now.getTime() - last_failed_at.getTime()) / 1000;
    if (passed_seconds > process.env.MIN_LOGIN_INTERVAL) {
      user['failed_login_count'] = 1;
    } else {
      user['failed_login_count'] = user['failed_login_count'] + 1;
    }
    user['last_failed_login_at'] = new Date();
    await user.save();
  },

  updatePassword: async function (user_id, new_password) {
    const { User } = db.models;
    await User.update(
      {
        password: new_password,
        reset_token: null
      },
      { where: { id: user_id } }
    );
  },

  updateEmail: async function(newEmail, userId) {
    const { User } = db.models;
    return await User.update(
      {
        email: newEmail
      },
      { where: { id: userId } }
    );
  },

  updateType: async function(userId, newType) {
    const { User } = db.models;
    return await User.update(
      {
        type: newType,
        needs_reload: true,
      },
      { where: { id: userId } }
    );
  },
  setAsReloaded: async function(userId) {
    const { User } = db.models;
    return await User.update(
      {
        needs_reload: false,
      },
      { where: { id: userId } }
    );
  }
};
