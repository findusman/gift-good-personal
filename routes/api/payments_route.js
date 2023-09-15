const express = require('express');
const router = express.Router();
const MiddlewareController = require('../../controllers/MiddlewareController');
const ApiController = require('../../controllers/ApiController');
const CreditTransactionController = require('../../controllers/CreditTransactionController');

// Get user savings balance
router.get(
  '/balance',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    ApiController.getUserBalance(req, res, next);
  }
);

// Register payment intent with Stripe
router.post('/payment-intent', 
  MiddlewareController.doCheckLoginPost, 
  function (req, res, next) {
    CreditTransactionController.paymentIntent(req, res, next);
  }
);

router.post('/purchase-credits',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CreditTransactionController.purchase(req, res, next);
  }
);

// TODO Update with function to get payments methods
router.get('/list', 
  MiddlewareController.doCheckLogin, 
  function (req, res, next) {
    ApiController.placeholder(req, res, next);
  }
);

module.exports = router;