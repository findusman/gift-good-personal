const db = require('../sequelize');

module.exports = {
    
    // Check if cron job module is running
    check_cron_status: async function (name) {
        const { Setting } = db.models;
        let setting = await Setting.findOne({});
        if (!setting) {
            setting = await Setting.create({
                [name]: false
            });
        }
        return setting[name];
    },

    // Set cron job status
    set_cron_status: async function (status, name) {
        const { Setting } = db.models;
        let setting = await Setting.findOne({});
        if (!setting) {
            setting = await Setting.create({
                [name]: status
            });
        } else {
            await setting.update({
                [name]: status
            });
        }
    },

    getSettings: async function () {
        const { Setting } = db.models;
        return Setting.findOne({where: {}, attributes: ['enable_new_send_gift'] });
    },

    updateSettings: async function (data) {
        const { Setting } = db.models;
        const settings = await Setting.findOne({});
        return settings.update(data);
    }
}
