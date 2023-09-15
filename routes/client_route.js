let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const ClientController = require('../controllers/ClientController');

router.get('/', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.dashboard(req, res, next);
});

router.get('/dashboard', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.dashboard(req, res, next);
});

router.get('/gifts', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.list_gifts(req, res, next);
});

router.get('/report', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.reports(req, res, next);
});
router.get('/campaign-report', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.campaign_reports(req, res, next);
});
router.get('/export-campaign-reports', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.export_campaign_reports(req, res, next);
});
router.get('/recipient-report', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.recipient_reports(req, res, next);
});
router.get('/thanks-report', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.thanks_reports(req, res, next);
});
router.get('/top-gifts-report', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.top_gifts_reports(req, res, next);
});
router.get('/users', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.users(req, res, next);
});
router.post('/users/add', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.add_user(req, res, next);
});

router.post('/users/reset-password', MiddlewareController.doCheckLogin, function(req, res, next) {
    ClientController.reset_password(req, res, next);
});

router.post('/users/update-email', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function(req, res, next) {
    ClientController.updateUserEmail(req, res, next);
});

router.post('/users/update-permissions', MiddlewareController.doCheckLoginPost, function(req, res, next) {
    ClientController.updateUserPermissions(req, res, next);
});

router.post('/question', function (req, res, next) {
    ClientController.customer_question(req, res, next);
});

router.post('/test-email', MiddlewareController.doCheckLoginPost, function (req, res, next) {
    ClientController.do_test_email(req, res, next);
});
router.get('/review-email', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.review_email(req, res, next);
});

router.get('/campaigns', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.list_campaigns(req, res, next);
});
router.get('/edit-campaign', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.edit_campaign(req, res, next);
});
router.get('/change-campaign-products', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.change_campaign_products(req, res, next);
});
router.post('/set-campaign-products', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.set_campaign_products(req, res, next);
});
router.post('/pull-campaigns-products', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.pull_campaigns_products(req, res, next);
});
router.get('/full-recipients-reports', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.getFullRecipientsReportsData(req, res, next);
});
router.get('/full-thanks-reports', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.getFullThanksReportsData(req, res, next);
});
router.get('/full-gifts-reports', MiddlewareController.doCheckLogin, function (req, res, next) {
    ClientController.getFullGiftsReportsData(req, res, next);
});

module.exports = router;
