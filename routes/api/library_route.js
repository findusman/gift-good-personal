const express = require('express');
const router = express.Router();
const MiddlewareController = require('../../controllers/MiddlewareController');
const LibraryController = require('../../controllers/api/LibraryController');

// Get list of library assets
router.get(
  '/assets',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    LibraryController.getSavedAssets(req, res, next);
  }
);

// Get list of library messages
router.get(
  '/messages',
  MiddlewareController.doCheckLogin,
  function (req, res, next) {
    LibraryController.getSavedMessages(req, res, next);
  }
);

// Save message
router.post(
  '/message/save',
  MiddlewareController.doCheckLoginPost,
  function (req, res, next) {
    LibraryController.saveMessageInLibrary(req, res, next);
  }
);

module.exports = router;