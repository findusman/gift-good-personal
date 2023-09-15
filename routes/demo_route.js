let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const DemoController = require('../controllers/DemoController');

router.get('/edit-campaign', MiddlewareController.doCheckLogin, MiddlewareController.doCheckAdmin, function (req, res, next) {
    DemoController.show_demo_campaign(req, res, next);
});

router.get('/landing', MiddlewareController.doCheckLogin, MiddlewareController.doCheckAdmin, function (req, res, next) {
    DemoController.landing_page(req, res, next);
});

router.get('/gift-detail', function (req, res, next) {
    DemoController.gift_detail(req, res, next);
});

router.get('/gift-shipping', function (req, res, next) {
    DemoController.gift_shipping(req, res, next);
});

router.get('/gift-note-thank', function (req, res, next) {
    DemoController.gift_note_thank(req, res, next);
});


router.post('/add-product', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.add_product_to_demo_campaign(req, res, next);
});
router.post('/remove-product', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.remove_product_from_demo_campaign(req, res, next);
});
router.post('/update-message', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.update_demo_message(req, res, next);
});
router.post('/change-product-sequence', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.change_sequence(req, res, next);
});
router.post('/send-email', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.send_demo_email(req, res, next);
});
router.post('/use-default-logo', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.use_default_logo(req, res, next);
});
router.post('/use-default-banner', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    DemoController.use_default_banner(req, res, next);
});

module.exports = router;
