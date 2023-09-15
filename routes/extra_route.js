let express = require('express');
let router = express.Router();

let ExtraController = require('../controllers/ExtraController');

router.get('/terms-and-conditions', function (req, res, next) {
    ExtraController.terms_and_conditions(req, res, next);
});

module.exports = router;

