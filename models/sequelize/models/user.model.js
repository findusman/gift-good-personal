const Helper = require('../../../util/helper');
const ConstData = require('../../../util/const_data');

const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User email
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User first name
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User last name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User first name + last name
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User nickname
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '/resources/images/users/default.png',
    }, // User avatar
    job: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User job
    company: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // User company
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    }, // Password salt
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set: function (val) {
        this.setDataValue('password', val); // Remember to set the data value, otherwise it won't be validated
        const salt = Helper.genRandomString(16);
        this.setDataValue('salt', salt);
        this.setDataValue('password', Helper.sha512(val, salt).hash);
      },
      validate: {
        isLongEnough: function (val) {
          if (val.length < 7) {
            throw new Error('Please choose a longer password');
          }
        },
        notEmpty: true,
      },
    }, // User password that md5-hashed
    type: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        isIn: [
          [
            ConstData.ADMIN_USER,
            ConstData.STANDARD_ADMIN_USER,
            ConstData.CLIENT_USER,
            ConstData.STANDARD_CLIENT_USER,
            ConstData.READ_ONLY_USER,
          ],
        ],
      },
    }, // User type: admin/client/customer
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }, // If verified user
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }, // If verified user
    verify_token: {
      type: DataTypes.STRING,
    }, // Token for verifying user
    reset_token: {
      type: DataTypes.STRING,
    }, // Token for resetting password
    last_login_at: DataTypes.DATE, // Last login datetime
    last_failed_login_at: DataTypes.DATE, // Last failed login datetime
    failed_login_count: {
      type: DataTypes.INTEGER, // Failed login count
      allowNull: false,
      defaultValue: 0,
    },
    needs_reload: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['username']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Campaign, { onDelete: 'CASCADE' }); // A user has many campaigns
    User.hasMany(models.CreditTransaction, { onDelete: 'CASCADE' });
    User.hasMany(models.CampaignAccount, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
    User.hasOne(models.SavingsAccount, { onDelete: 'CASCADE' }); // A user has many credits
    User.hasOne(models.UserPermission, { onDelete: 'CASCADE' });
  };

  return User;
};

module.exports = user;
