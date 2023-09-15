let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const CreditTransactionController = require('../controllers/CreditTransactionController');

router.get('/list', MiddlewareController.doCheckLogin, function (req, res, next) {
    CreditTransactionController.list_credits(req, res, next);
});

router.post('/purchase', MiddlewareController.doCheckLoginPost, function (req, res, next) {
    CreditTransactionController.purchase(req, res, next);
});

router.post('/payment-intent', MiddlewareController.doCheckLoginPost, function (req, res, next) {
    CreditTransactionController.paymentIntent(req, res, next);
});

router.post('/update', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function (req, res, next) {
    CreditTransactionController.updateCreditTransaction(req, res, next);
});

router.post('/donate', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function(req, res, next) {
    CreditTransactionController.donateCredits(req, res, next);
});

router.post('/move-to-savings', MiddlewareController.doCheckLoginPost, MiddlewareController.doCheckAdminPost, function(req, res, next) {
    CreditTransactionController.moveDonationsToSavings(req, res, next);
});

module.exports = router;

