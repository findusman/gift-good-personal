let express = require('express');
let router = express.Router();

let CronController = require('../controllers/CronController');

router.get('/shopify', function (req, res, next) {
  CronController.shopify_job(req, res, next);
});

router.get('/reminder', function (req, res, next) {
  console.log('reminder job');
  CronController.reminder_job(req, res, next);
});

router.get('/scheduled', function (req, res, next) {
  CronController.scheduled_campaign_job(req, res, next);
});

router.get('/close-campaign-accounts', function (req, res, next) {
  CronController.close_campaign_accounts(req, res, next);
});

router.get('/shopify-create-orders', function (req, res, next) {
  CronController.createOrders(req, res, next);
});

module.exports = router;
