let express = require('express');
let router = express.Router();

let MiddlewareController = require('../controllers/MiddlewareController');
let CollectionController = require('../controllers/CollectionController');

router.post(
  '/delete-collection',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    CollectionController.delete_collection(req, res, next);
  }
);
router.post(
  '/update-campaign',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.update_campaign(req, res, next);
  }
);
router.post(
  '/duplicate-campaign',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.duplicate_campaign(req, res, next);
  }
);
router.post(
  '/expire-campaign',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.expireCampaign(req, res, next);
  }
);
router.post(
  '/rename',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.rename_campaign(req, res, next);
  }
);
router.post(
  '/update-settings',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.update_settings(req, res, next);
  }
);
router.post(
  '/set-multiple-redemptions-campaign',
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    CollectionController.setMultipleRedemptions(req, res, next);
  }
);
router.post(
  '/add-contacts',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.add_contacts(req, res, next);
  }
);
router.post(
  '/add-product',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.add_product(req, res, next);
  }
);
router.post(
  '/change-sequence',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.change_sequence(req, res, next);
  }
);
router.post(
  '/remove-product',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.remove_product(req, res, next);
  }
);
router.get(
  '/reminder-preview',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.preview_reminder_email(req, res, next);
  }
);
router.post(
  '/list-contacts',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.list_contacts(req, res, next);
  }
);

router.post(
  '/update-internal',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.update_internal(req, res, next);
  }
);
router.post(
  '/update',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    CollectionController.update_collection(req, res, next);
  }
);
router.get('/marketing', function (req, res, next) {
  CollectionController.public_collections(req, res, next);
});
router.get('/marketing/:collectionId', function (req, res, next) {
  CollectionController.public_collection(req, res, next);
});
router.get('/product_detail/:productId', function (req, res, next) {
  CollectionController.public_product_detail(req, res, next);
});
router.get('/export-contacts',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
  CollectionController.export_contacts(req, res, next);
})
;
module.exports = router;
