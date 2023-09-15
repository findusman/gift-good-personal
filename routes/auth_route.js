let express = require('express');
const MiddlewareController = require('../controllers/MiddlewareController');
let router = express.Router();

let AuthController = require('../controllers/AuthController');

router.get('/login', function (req, res, next) {
  AuthController.login(req, res, next);
});
// MiddlewareController.doCheckAdmin,
router.get('/impersonate', function (req, res, next) {
  AuthController.impersonate(req, res, next);
});
router.get('/register', function (req, res, next) {
  AuthController.register(req, res, next);
});
router.get('/verify', function (req, res, next) {
  AuthController.verifyUser(req, res, next);
});
router.get('/forgot-password', function (req, res, next) {
  AuthController.forgotPassword(req, res, next);
});
router.get('/reset-password', function (req, res, next) {
  AuthController.resetPassword(req, res, next);
});

router.get('/logout', function (req, res, next) {
  AuthController.logout(req, res, next);
});
router.post('/logout', function (req, res, next) {
  AuthController.postLogout(req, res, next);
});

router.get('/welcome', function (req, res, next) {
  AuthController.welcome(req, res, next);
});

module.exports = router;
