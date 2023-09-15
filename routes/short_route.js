let express = require('express');
let router = express.Router();

const ShortUrlController = require('../controllers/ShortUrlController');

router.get('/:id', function (req, res, next) {
  ShortUrlController.getUrl(req, res, next);
});

module.exports = router;