const { createMongoAbility } = require('@casl/ability');
const ConstData = require('../util/const_data');
const DBBridge = require('../models/bridge');
const { defineRulesFor } = require('../api/acl');

module.exports = {
    name: 'MiddlewareController',

    doCheckLogin: function (req, res, next) {
        if (req.session && req.session.login === 1 && req.session.user) next();
        else {
            if (req.session) {
                req.session.login = 0;
                req.session.user = null;
            }
            // res.redirect('/login?redirect=' + req.originalUrl);
            res.redirect('/login');
        }
    },
    doCheckAdmin: function (req, res, next) {
        if (req.session && req.session.user && (req.session.user.type === ConstData.ADMIN_USER || req.session.user.type === ConstData.STANDARD_ADMIN_USER)) {
            next();
        } else {
            res.redirect('/404');
        }
    },
    doCheckLoginPost: function (req, res, next) {
        if (req.session && req.session.login === 1 && req.session.user) next();
        else {
            if (req.session) {
                req.session.login = 0;
                req.session.user = null;
            }
            res.status(400);
            res.send({status: 'failed', message: res.cookie().__('You are not logged in')});
        }
    },
    doCheckAdminPost: function (req, res, next) {
        if (req.session && req.session.user && (req.session.user.type === ConstData.ADMIN_USER || req.session.user.type === ConstData.STANDARD_ADMIN_USER)) {
            next();
        } else {
            res.status(400);
            res.send({status: 'failed', message: res.cookie().__('You do not have permission')});
        }
    },
    doCheckSendGiftFlow: async function(req, res, next) {
        try {
            const settings = await DBBridge.Setting.getSettings();
            const isNewFlowEnabled = process.env.PLATFORM_VERSION >= ConstData.VERSION_ALPHA && settings.enable_new_send_gift;
            if (isNewFlowEnabled) {
                const params = new URLSearchParams(req.query);
                res.redirect(`/campaign/create?${params}`)
            } else {
                next();
            }
        } catch(e) {
            res.status(500);
            res.send({status: 'failed', message: 'An error ocurred'});
        }
    },
    provideAbility: async function(req, res, next) {
        let rules = req.session.abilityRules;

        const setRules = () => {
            rules = defineRulesFor(req.session.user);
            req.session.abilityRules = rules;
        };

        if (req.session.user) {
            const user = await DBBridge.User.findById(req.session.user.id);
            if (user.needs_reload) {
                req.session.user = user;
                setRules();
                await DBBridge.User.setAsReloaded(req.session.user.id);
            }
            if (!rules || !rules.length) {
                setRules();
            }
        }

        req.ability = new createMongoAbility(rules);
        next();
    }
};

