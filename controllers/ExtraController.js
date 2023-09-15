let View = require('../views/base');

let BaseController = require('./BaseController');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
    name: 'ExtraController',

    terms_and_conditions: async function (req, res, next) {
        try {
            let v = new View(res, 'extra/terms-and-conditions');
            v.render({
                ...getGlobalTemplateData(req, res),
                page_title: 'terms-and-conditions',
                page_type: 'extra-page',
            });
        } catch (err) {
            console.log(err);
            return res.redirect('/404');
        }
    },

});

