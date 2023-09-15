const express = require('express');
const router = express.Router();
const MiddlewareController = require('../../controllers/MiddlewareController');
const ApiController = require('../../controllers/ApiController');
const CampaignController = require('../../controllers/CampaignController');
const CollectionController = require('../../controllers/CollectionController');

// Create new campaign
router.post(
  '/create',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    ApiController.createCampaign(req, res, next);
  }
);

router.get(
  '/get-data',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    CampaignController.getData(req, res, next);
  }
);

router.post(
  '/update-content',
  MiddlewareController.doCheckLogin,
  function(req, res, next) {
    CampaignController.updateContent(req, res, next);
  }
);

router.post(
  '/update-campaign',
  MiddlewareController.doCheckLogin,
  function(req, res, next) {
    CollectionController.update_campaign(req, res, next);
  }
);

// Get campaign draft
router.get(
  '/draft',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    ApiController.placeholder(req, res, next);
  }
);

// Save campaign draft
router.post(
  '/draft/save',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    ApiController.placeholder(req, res, next);
  }
);

// Get list of campaign drafts
router.get(
  '/drafts',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    ApiController.placeholder(req, res, next);
  }
);

module.exports = router;