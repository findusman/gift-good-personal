const { Op } = require('sequelize');

const campaign = (sequelize, DataTypes) => {
    const Campaign = sequelize.define('campaign', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },                                          // Campaign title
        message: DataTypes.TEXT,                    // message content in email
        email_message: DataTypes.TEXT,              // email message (if null, fallbacks to message)
        email_subject: DataTypes.STRING,            // email subject
        signature: DataTypes.STRING,                // signature
        video_url: DataTypes.STRING,                // email video url
        logo_url: DataTypes.STRING,                 // email logo url
        banner_url: DataTypes.STRING,               // email banner url
        landing_include_logo: DataTypes.BOOLEAN,    // show custom logo on landing page
        landing_include_banner: DataTypes.BOOLEAN,  // show banner on landing page
        email_include_logo: DataTypes.BOOLEAN,      // show custom logo in email
        email_include_banner: DataTypes.BOOLEAN,    // show banner in email
        email_include_gfg_logo: DataTypes.BOOLEAN,  // show GFG logo in email
        reminder1_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },             // Reminder #1 date
        reminder1_subject: DataTypes.STRING,        // Reminder #1 subject
        reminder1_content: DataTypes.TEXT,          // Reminder #1 email body
        reminder2_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },             // Reminder #2 date
        reminder2_subject: DataTypes.STRING,        // Reminder #2 subject
        reminder2_content: DataTypes.TEXT,          // Reminder #2 email body
        reminder3_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },             // Reminder #3 date
        reminder3_subject: DataTypes.STRING,        // Reminder #3 subject
        reminder3_content: DataTypes.TEXT,          // Reminder #3 email body
        reminder4_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },             // Reminder #4 date
        reminder4_subject: DataTypes.STRING,        // Reminder #4 subject
        reminder4_content: DataTypes.TEXT,          // Reminder #4 email body
        expire_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },                // Expiriation date
        product_orders: DataTypes.TEXT,             // Product orders in the campaign, just add product ids in sequence
        archived: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },                                          // Campaign is archived or not
        is_sent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },                                          // Campaign is sent to the customers or not
        sent_at: DataTypes.DATE,                    // Campaign send date
        is_scheduled : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        scheduled_date: DataTypes.DATE,
        scheduled_tz: DataTypes.STRING,
        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },                                                // Enabled or disabled
        // Dont send email invite (unique URL campaign)
        no_email_invite: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // Send reminder emails even if campaign is URL only
        send_only_reminder_emails: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // marked as important, action needs to be taken
        is_starred: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // if set to true, campaign's association with collecion determines product list, there is no direct association with products
        is_collection_products_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: false
        },
        // list of excluded product ids
        excluded_products: DataTypes.TEXT,
        // list of manually added product ids
        added_products: DataTypes.TEXT,
        donate_unredeemed: DataTypes.BOOLEAN,
        lock_emails: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        single_product: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // if set to true, products added to associated collection after campaign is created won't be automatically added
        block_new_products: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // if set to true, gift email will be sent to customer with sender CC
        cc_email: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        allow_multiple_redemptions: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    Campaign.associate = models => {
        Campaign.belongsToMany(models.Product, { through: 'productCampaign', foreignKey: 'campaign_id', onDelete: 'CASCADE' });                 // A SignatureCollection has n:m relationship with Product
        Campaign.hasMany(models.Contact, { onDelete: 'CASCADE' });     // A campaign has many contacts
        Campaign.hasMany(models.CreditTransaction, { onDelete: 'CASCADE' });
        Campaign.belongsTo(models.User);
        Campaign.belongsTo(models.SignatureCollection, { foreignKey: 'collection_id' });
        Campaign.hasOne(models.Donation);
        Campaign.hasOne(models.CampaignAccount);
        Campaign.hasOne(models.ShortUrl);
        Campaign.belongsTo(models.AuthenticationProvider, {
            through: 'campaignAuthentication',
            onDelete: 'CASCADE',
        });
    };

    return Campaign;
};

module.exports = campaign;
