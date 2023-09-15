const db = require('../sequelize');
const { Op } = require('sequelize');
const ConstData = require('../../util/const_data');

module.exports = {
    get_token: async function (id) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.findOne({
            where: {
                id,
            },
        });
    },
    get_unauthenticated_token: async function (authenticationProviderId, token) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.findOne({
            where: {
                authenticationProviderId,
                token,
            },
        });
    },
    filter_tokens_by_provider: async function (authenticationProviderId, filter) {
        const { token, offset, limit } = filter;
        const { AuthenticationToken, Contact } = db.models;
        return await AuthenticationToken.findAndCountAll({
            where: {
                authenticationProviderId,
                token: {
                    [Op.like]: `%${token}%`
                },
            },
            include: [
                {
                    model: Contact,
                    required: false,
                }
            ],
            offset,
            limit,
        });
    },
    set_token_authenticated: async function (authenticationProviderId, token, contactId) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.update(
            {
                contactId,
                authenticatedAt: new Date()
            },
            {
                where: {
                    authenticationProviderId,
                    token,
                }
            }
        );
    },
    create_token: async function (authenticationProviderId, token) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.create(
            { authenticationProviderId, token }
        );
    },
    update_token: async function (id, token, authenticatedAt, contactId) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.update(
            { token, authenticatedAt, contactId },
            { where: { id } }
        );
    },
    delete_token: async function (id) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.destroy(
            { where: { id } }
        );
    },

    bulk_create_tokens: async function(tokens) {
        const { AuthenticationToken } = db.models;
        return await AuthenticationToken.bulkCreate(tokens)
    },
}
