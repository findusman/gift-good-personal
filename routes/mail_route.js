let express = require('express');
let router = express.Router();

let MailController = require('../controllers/MailController');

router.post('/webhook-event', function (req, res, next) {
    MailController.webhookEvent(req, res, next);
});

module.exports = router;
