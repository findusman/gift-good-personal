let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const StepController = require('../controllers/StepController');

router.get(
  '/first',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.gift_it_forward(req, res, next);
  }
);
router.post('/first/show-more', function (req, res, next) {
  StepController.show_more_products(req, res, next);
});

router.get(
  '/second',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.recipient_information(req, res, next);
  }
);

router.get(
  '/third',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.brand_message(req, res, next);
  }
);

router.get(
  '/fourth',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.confirm_details(req, res, next);
  }
);
router.post(
  '/fourth/save-campaign',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.save_campaign(req, res, next);
  }
);

router.get(
  '/confirmed',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckSendGiftFlow,
  function (req, res, next) {
    StepController.confirmed_order(req, res, next);
  }
);

module.exports = router;
