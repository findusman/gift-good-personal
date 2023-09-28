let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const CampaignController = require('../controllers/CampaignController');


router.get(
    ['/create', '/create/*'],
    MiddlewareController.doCheckLogin,
    function (req, res, next) {
        CampaignController.create(req, res, next);
    }
);

module.exports = router;
