let View = require('../views/base');
let moment = require('moment');

let BaseController = require('./BaseController');
const { sendMail } = require('../api/mail');
const DBBridge = require('../models/bridge');
const { getCustomerLandingPath } = require('../api/url');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
    name: 'DemoController',

    show_demo_campaign: async function (req, res, next) {
        try {
            const {campaign, products} = await DBBridge.DemoCampaign.get_demo();

            let v = new View(res, 'client/dashboard/admin/admin-demo-campaign');
            v.render({
                ...getGlobalTemplateData(req, res),
                page_title: 'admin-demo-campaign',
                page_type: 'client-dashboard-page',
                campaign, products,
                moment: moment
            });
        } catch (err) {
            console.log(err);
            return res.redirect('/404');
        }
    },

    add_product_to_demo_campaign: async function (req, res, next) {
        try {
            const product_id = req.body.pid;

            const {status, msg, product} = await DBBridge.DemoCampaign.add_product(product_id);
            if (status) {
                return res.send({
                    status: 'success',
                    msg: msg,
                    product
                })
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: msg
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    remove_product_from_demo_campaign: async function (req, res, next) {
        try {
            const product_id = req.body.pid;
            if (await DBBridge.DemoCampaign.remove_product(product_id)) {
                return res.send({
                    status: 'success',
                    msg: 'Product has been removed successfully.'
                })
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Invalid data.'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    update_demo_message: async function (req, res, next) {
        try {
            const campaign_message = req.body.message;
            if (await DBBridge.DemoCampaign.update_message(campaign_message)) {
                return res.send({
                    status: 'success',
                    msg: 'Update gift message successfully.'
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Invalid campaign.'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    use_default_logo: async function (req, res, next) {
        try {
            const logo_link = await DBBridge.DemoCampaign.use_default_logo()
            if (logo_link) {
                return res.send({
                    status: 'success',
                    file_link: logo_link
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Something went wrong.'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    use_default_banner: async function (req, res, next) {
        try {
            const banner_link = await DBBridge.DemoCampaign.use_default_banner()
            if (banner_link) {
                return res.send({
                    status: 'success',
                    file_link: banner_link
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Something went wrong.'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    change_sequence: async function (req, res, next) {
        try {
            const changed_product_id = req.body.cpid;
            const previous_product_id = req.body.ppid;

            const {status, msg} = await DBBridge.DemoCampaign.change_sequence(changed_product_id, previous_product_id);
            if (status) {
                return res.send({
                    status: 'success',
                    msg: msg
                })
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: msg
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    send_demo_email: async function (req, res, next) {
        try {
            const {fname, lname, cname, email, fcname, banner, logo, video, message} = req.body;
            if (email && message && banner) {
                const demoContact = await DBBridge.DemoCampaign.create_demo_contact(
                    fname, lname, cname, email, fcname, banner, logo, video, message);
                if (await sendMail({type: 'send-demo-gift', contact: demoContact})) {
                    console.log('Demo campaign email has been sent to ', email);
                    return res.send({
                        status: 'success',
                        msg: 'The email was sent.'
                    });
                } else {
                    console.log('Failed to send demo campaign to ', email);
                }
            }

            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Something went wrong.'
            });
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation.'
            });
        }
    },

    landing_page: async function (req, res, next) {
        const contact_id = req.query.cid;
        let contact = await DBBridge.DemoCampaign.get_contact(contact_id);
        const singleProduct = contact?.campaign?.products?.length === 1 ?? false;
        let v = new View(res, 'customer/landing-page');
        v.render({
            ...getGlobalTemplateData(req, res),
            page_title: 'landing',
            page_type: 'customer-page',
            contact,
            demo: true,
            singleProduct,
        });
    },

    gift_detail: async function (req, res, next) {
        const contact_id = req.query.cid;
        const product_id = req.query.pid;
        const variants = await DBBridge.Product.get_variants({ product_id });
        const landingUrl = getCustomerLandingPath({ isDemo: true, id: contact_id });

        if (variants.length) {
            let v = new View(res, 'customer/gift-detail');
            v.render({
                ...getGlobalTemplateData(req, res),
                page_title: 'gift-detail',
                page_type: 'customer-page',
                products: variants,
                cid: contact_id,
                demo: true,
                landingUrl,
                singleProduct: false,
            });
        }
    },

    gift_shipping: async function (req, res, next) {
        const contact_id = req.query.cid;
        const variant_id = req.query.vid;
        const contact = await DBBridge.DemoCampaign.get_contact(contact_id);
        const variant = await DBBridge.Product.get_variant(variant_id);
        const landingUrl = getCustomerLandingPath({ isDemo: true, id: contact_id });
        if (contact && variant) {
            let v = new View(res, 'customer/gift-shipping');
            v.render({
                ...getGlobalTemplateData(req, res),
                page_title: 'gift-shipping',
                page_type: 'customer-page',
                contact, variant,
                demo: true,
                landingUrl
            });
        }
    },

    gift_note_thank: async function (req, res, next) {
        const contact_id = req.query.cid;
        const variant_id = req.query.vid;
        const is_donation = await DBBridge.Product.is_donation_product(variant_id);
        const landingUrl = getCustomerLandingPath({ isDemo: true, id: contact_id });
        let v = new View(res, 'customer/gift-note-thank');
        v.render({
            ...getGlobalTemplateData(req, res),
            page_title: 'gift-note-thank',
            page_type: 'customer-page',
            cid: contact_id,
            donation: is_donation,
            demo: true,
            landingUrl
        });
    },
});


