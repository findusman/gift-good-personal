const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/api/AuthController");
const { validationMiddleware } = require("../../middleware");
const {
  registrationDto,
  loginDto,
  forgotPasswordDto,
  resendInvitationDto,
  ResetPasswordDto,
} = require("../../dtos");
const { requestLimiter } = require("../../util/request_limiter");

router.post(
  "/register",
  requestLimiter,
  validationMiddleware(registrationDto),
  function (req, res, next) {
    return AuthController.postRegister(req, res, next);
  }
);

router.post(
  "/login",
  requestLimiter,
  validationMiddleware(loginDto),
  function (req, res, next) {
    return AuthController.postLogin(req, res, next);
  }
);

router.post(
  "/forgot-password",
  requestLimiter,
  validationMiddleware(forgotPasswordDto),
  function (req, res, next) {
    return AuthController.postForgotPassword(req, res, next);
  }
);

router.post(
  "/reset-password",
  requestLimiter,
  validationMiddleware(ResetPasswordDto),
  function (req, res, next) {
    return AuthController.postResetPassword(req, res, next);
  }
);

router.post(
  "/resent-verification",
  requestLimiter,
  validationMiddleware(resendInvitationDto),
  async function (req, res, next) {
    await AuthController.resendInvitation(req, res, next);
  }
);

module.exports = router;
