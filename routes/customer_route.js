let express = require('express');
let router = express.Router();

const CustomerController = require('../controllers/CustomerController');
const PreviewController = require('../controllers/PreviewController');

router.get('/landing', function (req, res, next) {
    CustomerController.landing_page(req, res, next);
});

router.get('/gift-detail', function (req, res, next) {
    CustomerController.gift_detail(req, res, next);
});

router.get('/gift-shipping', function (req, res, next) {
    CustomerController.gift_shipping(req, res, next);
});

router.post('/confirm-gift', function (req, res, next) {
    CustomerController.confirm_gift(req, res, next);
});

router.get('/gift-confirmation', function (req, res, next) {
    CustomerController.gift_confirmation(req, res, next);
});

router.get('/gift-note-thank', function (req, res, next) {
    CustomerController.gift_note_thank(req, res, next);
});
router.post('/add-thank-note', function (req, res, next) {
    CustomerController.add_thank_note(req, res, next);
});

router.post('/set-location', function (req, res, next) {
    CustomerController.set_location(req, res, next);
});

router.post('/authenticate_campaign', function (req, res, next) {
    CustomerController.authenticate_campaign(req, res, next);
});

router.get('/decline-gift', function (req, res, next) {
    CustomerController.decline_gift(req, res, next);
});

router.post('/decline-contact', function (req, res, next) {
    CustomerController.decline_contact(req, res, next);
});


module.exports = router;
