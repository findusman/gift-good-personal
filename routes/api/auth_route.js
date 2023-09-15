const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/api/AuthController');

router.post(
  '/register',
  function (req, res, next) {
    return AuthController.postRegister(req, res, next);
  }
);

router.post(
  '/login',
  function (req, res, next) {
    return AuthController.postLogin(req, res, next);
  }
);

router.post(
  '/forgot-password',
  function (req, res, next) {
    return AuthController.postForgotPassword(req, res, next);
  }
);

router.post(
  '/reset-password',
  function (req, res, next) {
    return AuthController.postResetPassword(req, res, next);
  }
);

router.post(
  '/resent-verification',
  async function (req, res, next) {
    await AuthController.resendInvitation(req, res, next);
});

module.exports = router;