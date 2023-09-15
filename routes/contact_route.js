let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
let ContactController = require('../controllers/ContactController');

router.put(
  '/contacts/reactivate/:contactId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.reactivate(req, res, next);
  }
);
router.post(
  '/contacts/reactivate-all',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.reactivateAll(req, res, next);
  }
);
router.put(
  '/contacts/expire/:contactId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.expire(req, res, next);
  }
);
router.put(
  '/contacts/unexpire/:contactId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.unexpire(req, res, next);
  }
);
router.delete(
  '/contacts/:contactId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.delete(req, res, next);
  }
);
router.put(
  '/contacts/:contactId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    ContactController.update(req, res, next);
  }
);

module.exports = router;
