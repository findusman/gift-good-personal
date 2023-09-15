const contact = (sequelize, DataTypes) => {
  const Contact = sequelize.define('contact', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    step: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ready',
      validate: {
        isIn: [
          [
            'ready',
            'sending',
            'sent',
            'bounced',
            'confirmed',
            'redeemed',
            'canceled',
            'shipped',
            'delivered',
            'reactivated',
            'expired',
            'declined',
          ],
        ],
      },
    }, // Current campaign status
    from_first_name: DataTypes.STRING, // Sender first name
    from_last_name: DataTypes.STRING, // Sender last name
    from_company_name: DataTypes.STRING, // Sender company name
    from_email: DataTypes.STRING, // Sender email
    to_first_name: DataTypes.STRING, // Receiver first name
    to_last_name: DataTypes.STRING, // Receiver last name
    to_company_name: DataTypes.STRING, // Receiver company name
    to_email: DataTypes.STRING, // Receiver email

    shipping_first_name: DataTypes.STRING, // Receiver first name
    shipping_last_name: DataTypes.STRING, // Receiver last name
    shipping_email: DataTypes.STRING, // Receiver email
    shipping_phone: DataTypes.STRING, // Receiver phone
    shipping_address: DataTypes.STRING, // Receiver address
    shipping_apartment: DataTypes.STRING, // Receiver apartment
    shipping_city: DataTypes.STRING, // Receiver city
    shipping_state: DataTypes.STRING, // Receiver state
    shipping_zip_code: DataTypes.STRING, // Receiver zip code
    shipping_country: DataTypes.STRING, // Receiver country
    // Additional info for products
    hometown: DataTypes.STRING,
    coords: DataTypes.STRING,
    state: DataTypes.STRING,

    thank_note: DataTypes.TEXT,
    email_opened: {
      // Email has been opened by the recipient
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_clicked: {
      // Email has been clicked by the recipient
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order_id: DataTypes.STRING, // Order Id on the shopify
    tracking_number: DataTypes.STRING, // Tracking number if it is being tracking on the shopify
    tracking_url: DataTypes.STRING, // Tracking url if it is being tracking on the shopify
    sent_at: DataTypes.DATE, // Gift email sent date
    confirmed_at: DataTypes.DATE, // Recipient confirmed date
    thanks_at: DataTypes.DATE, // Recipient sent thanks note date
    redeemed_at: DataTypes.DATE, // Gift redeemed date
    email_opened_at: DataTypes.DATE, // Email opened date
    email_clicked_at: DataTypes.DATE, // Email clicked date
    failed_order: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }, // If order failed so backup, and make it redeemed manually
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reminder1_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminder2_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminder3_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminder4_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    delivery_date: {
      type: DataTypes.DATE
    },
    decline_reason: DataTypes.STRING,
  });

  Contact.associate = (models) => {
    Contact.belongsTo(models.Campaign); // A contact belongs to a campaign
    Contact.belongsTo(models.Product); // A contact belongs to a product
    Contact.hasOne(models.ShortUrl);
    Contact.hasOne(models.AuthenticationToken);
  };

  return Contact;
};

module.exports = contact;
