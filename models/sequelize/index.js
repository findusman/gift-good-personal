const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

const certPath = path.join(appRoot, 'dbcert.crt');
const dialectOptions =
  process.env.NODE_ENV === 'production'
    ? {
        ssl: {
          ca: fs.readFileSync(certPath).toString(),
        },
      }
    : {};

const sequelize =
  process.env.NODE_ENV === 'production'
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        use_env_variable: 'DATABASE_URL',
        ssl: true,
        logging: true,
        pool: {
          max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX) : 10
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false, // <<== YOU NEED THIS
          },
        },
      })
    : new Sequelize(
        process.env.DATABASE_NAME,
        process.env.DATABASE_USER,
        process.env.DATABASE_PASSWORD,
        {
          dialect: 'postgres',
          logging: false,
          host: process.env.DATABASE_HOST,
          port: process.env.DATABASE_PORT,
          pool: {
            max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX) : 5,
            min: 0,
            idle: 10000,
          },
          dialectOptions: dialectOptions,
        }
      );

// Define models
const models = {
    Campaign: require('./models/campaign.model')(sequelize, Sequelize),
    SignatureCollection: require('./models/signatureCollection.model')(sequelize, Sequelize),
    Contact: require('./models/contact.model')(sequelize, Sequelize),
    CreditTransaction: require('./models/creditTransaction.model')(sequelize, Sequelize),
    DemoContact: require('./models/demoContact.model')(sequelize, Sequelize),
    FailedContact: require('./models/failedContact.model')(sequelize, Sequelize),
    Product: require('./models/product.model')(sequelize, Sequelize),
    User: require('./models/user.model')(sequelize, Sequelize),
    Setting: require('./models/setting.model')(sequelize, Sequelize),
    ProductCollectionBK: require('./models/productCollectionBK.model')(sequelize, Sequelize),
    CampaignAccount: require('./models/campaignAccount.model')(sequelize, Sequelize),
    SavingsAccount: require('./models/savingsAccount.model')(sequelize, Sequelize),
    ShortUrl: require('./models/shortUrl.model')(sequelize, Sequelize),
    ProductOptions: require('./models/productOptions.model')(sequelize, Sequelize),
    LibraryAsset: require('./models/libraryAsset.model')(sequelize, Sequelize),
    LibraryMessage: require('./models/libraryMessage.model')(sequelize, Sequelize),
    Donation: require('./models/donation.model')(sequelize, Sequelize),
    UserPermission: require('./models/userPermissions.model')(sequelize, Sequelize),
    AuthenticationProvider: require('./models/authenticationProvider.model')(sequelize, Sequelize),
    AuthenticationToken: require('./models/authenticationToken.model')(sequelize, Sequelize),
};

// Make association
Object.keys(models).forEach((key) => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

const db = {};
db.sequelize = sequelize;
db.models = models;
db.Sequelize = Sequelize;

module.exports = db;
