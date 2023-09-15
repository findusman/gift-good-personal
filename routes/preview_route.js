let express = require('express');
let router = express.Router();

const PreviewController = require('../controllers/PreviewController');

router.use('/landing-page', function (req, res, next) {
    PreviewController.preview_landing_page(req, res, next);
});

router.use('/campaign-email', function (req, res, next) {
    PreviewController.preview_campaign_email(req, res, next);
});

module.exports = router;
