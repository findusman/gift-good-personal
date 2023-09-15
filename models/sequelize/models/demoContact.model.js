const demoContact = (sequelize, DataTypes) => {
    return sequelize.define('demoContact', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        from_first_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'admin'
        },                                          // Sender first name
        from_last_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'admin'
        },                                          // Sender last name
        from_company_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'The Gifts for Good Team'
        },                                          // Sender company name
        from_email: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'admin@giftsforward.com'
        },                                          // Sender email
        to_first_name: DataTypes.STRING,            // Receiver first name
        to_last_name: DataTypes.STRING,             // Receiver last name
        to_company_name: DataTypes.STRING,          // Receiver company name
        to_email: DataTypes.STRING,                 // Receiver email,
        message: DataTypes.TEXT,                    // message content in email
        video_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '/resources/videos/default.mp4'
        },                                          // email video url
        logo_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '/resources/images/logo.png'
        },                                          // email logo url
        banner_url: DataTypes.STRING,               // email banner url
    });
};

module.exports = demoContact;


