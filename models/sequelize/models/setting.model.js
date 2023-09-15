
const setting = (sequelize, DataTypes) => {
    const Setting = sequelize.define('setting', {
        cron_running: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },                   // Cron job is running now
        orders_cron_running: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        demo_products: DataTypes.TEXT,                        // Demo campaign products
        demo_logo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '/resources/images/logo.png'
        },                                                      // Demo campaign logo
        demo_banner: DataTypes.STRING,                          // Demo campaign banner
        demo_video: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '/resources/videos/default.mp4'
        },                                                      // Demo campaign video
        demo_message: DataTypes.TEXT,                           // Demo campaign message
        enable_new_send_gift: DataTypes.BOOLEAN,
    });

    return Setting;
};

module.exports = setting;
