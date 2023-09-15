const db = require('../sequelize');
const { Op } = require('sequelize');
const ConstData = require('../../util/const_data');

module.exports = {
    get_providers: async function () {
        const { AuthenticationProvider } = db.models;
        const providers = await AuthenticationProvider.findAll({});
        return providers;
    },
    get_provider: async function (id) {
        const { AuthenticationProvider } = db.models;
        return await AuthenticationProvider.findOne({ where: { id } });
    },
    create_provider: async function (name, adapter, config) {
        const { AuthenticationProvider } = db.models;
        return await AuthenticationProvider.create(
            { name, adapter, config }
        );
    },
    update_provider: async function (id, name, adapter, config) {
        const { AuthenticationProvider } = db.models;
        return await AuthenticationProvider.update(
            { name, adapter, config },
            { where: { id } }
        );
    },
    delete_provider: async function (id) {
        const { AuthenticationProvider } = db.models;
        return await AuthenticationProvider.destroy(
            { where: { id } }
        );
    },
}