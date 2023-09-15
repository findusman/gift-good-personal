const express = require('express');
const router = express.Router();
const MiddlewareController = require('../../controllers/MiddlewareController');
const ApiController = require('../../controllers/ApiController');
const CollectionController = require('../../controllers/CollectionController');

router.get(
  '/template',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    ApiController.createOneSchemaTemplate(req, res, next);
  }
);

router.delete(
  '/template',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    ApiController.deleteOneSchemaTemplate(req, res, next);
  }
);

router.post(
  '/add',
  MiddlewareController.doCheckLogin,
  function(req, res, next) {
    CollectionController.add_contacts(req, res, next);
  }
);

module.exports = router;