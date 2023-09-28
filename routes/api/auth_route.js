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

router.post(
  "/register",
  validationMiddleware(registrationDto),
  function (req, res, next) {
    return AuthController.postRegister(req, res, next);
  }
);

router.post(
  "/login",
  validationMiddleware(loginDto),
  function (req, res, next) {
    return AuthController.postLogin(req, res, next);
  }
);

router.post(
  "/forgot-password",
  validationMiddleware(forgotPasswordDto),
  function (req, res, next) {
    return AuthController.postForgotPassword(req, res, next);
  }
);

router.post(
  "/reset-password",
  validationMiddleware(ResetPasswordDto),
  function (req, res, next) {
    return AuthController.postResetPassword(req, res, next);
  }
);

router.post(
  "/resent-verification",
  validationMiddleware(resendInvitationDto),
  async function (req, res, next) {
    await AuthController.resendInvitation(req, res, next);
  }
);

module.exports = router;
