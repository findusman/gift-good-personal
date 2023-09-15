let express = require('express');
let fs = require('fs');
let router = express.Router();

let ShopifyController = require('../controllers/ShopifyController');

router.post('/pull-box-products', function (req, res, next) {
    ShopifyController.pull_box_products(req, res, next);
});

module.exports = router;


