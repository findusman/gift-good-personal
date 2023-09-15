const express = require('express');
const router = express.Router();
const CatalogController = require('../../controllers/api/CatalogController');

router.get(
  '/collections',
  function (req, res, next) {
      CatalogController.getCollections(req, res, next);
  }
);

router.get(
  '/collection-products',
  function (req, res, next) {
      CatalogController.getCollectionProducts(req, res, next);
  }
);

router.get(
  '/product',
  function (req, res, next) {
    CatalogController.getProductDetails(req, res, next);
  }
);

module.exports = router;