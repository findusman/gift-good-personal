const BaseController = require('./../BaseController');
const DBBridge = require('../../models/bridge');
const jwt = require('jsonwebtoken');
const Helper = require('../../util/helper');
const { sendMail, sendNotificationMail } = require('../../api/mail');

module.exports = BaseController.extend({
  name: 'AuthController',

  postLogin: async function (req, res, next) {
    try {
      if (req.session && req.session.login === 1 && req.session.user) {
        res.status(400);
        res.send({
          status: 'failed',
          message: res.cookie().__('You are not logged in')
        });
      }

      const email = req.body.email;
      const password = req.body.password;

      const user = await DBBridge.User.findByName(email);
      if (!user) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('User email/name is incorrect.'),
        });
      }

      if (!user.verified) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('Please verify your email'),
        });
      }

      const isUserLocked = !DBBridge.User.checkLockStatus(user)
      if (isUserLocked) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('Your account has been locked. Please wait.'),
        });
      }

      const isPasswordValid = DBBridge.User.checkPassword(user, password)
      if (!isPasswordValid) {
        await DBBridge.User.loginFailed(user);
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('User password is incorrect.'),
        });
      }

      const companyUsers = await DBBridge.User.listCompanyUsersIds(user);
      await DBBridge.User.loginSuccess(user, { last_login_at: new Date() });

      req.session.user = user;
      req.session.companyUsers = companyUsers;
      req.session.login = 1;
      let token = jwt.sign({ login_email: email }, process.env.JWT_SECRET, {
        expiresIn: '240h',
      });

      res.status(200);
      return res.send({
        status: 'success',
        msg: res.cookie().__('Login success'),
        token: token,
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: res.cookie().__('Invalid operation.'),
      });
    }
  },

  postRegister: async function (req, res, next) {
    try {
      if (req.session && req.session.login === 1 && req.session.user) {
        res.status(400);
        res.send({
          status: 'failed',
          message: res.cookie().__('You are not logged in')
        });
      }

      const { first_name, last_name, job, company, email, password } = req.body;

      if (
        !first_name ||
        !last_name ||
        !job ||
        !company ||
        !email ||
        !password
      ) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('Register fields are invalid.'),
        });
      }

      const userExist = await DBBridge.User.findByName(email)
      if (userExist) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Your email is being used by another user.',
        });
      }

      // Generate verify token string and send verify mail to user
      const verify_token = Helper.generate_token_string(
        process.env.VERIFY_TOKEN_PREFIX,
        process.env.VERIFY_TOEK_SUFFIX
      );

      const emailSent = await sendMail({
        type: 'user-activate',
        email: email,
        token: verify_token,
      })

      if (!emailSent) {
        res.status(400);
        res.send({
          status: 'failed',
          msg: 'Register failed. Verify email can not be sent to your email.',
        });
      }

      await DBBridge.User.createUserBySelf(
        email,
        first_name,
        last_name,
        job,
        company,
        password,
        verify_token
      );

      const content = `<p>New user: <b>${first_name} ${last_name} - ${email} from company: ${company}</b> was just registered!</p><p><a href="${process.env.BASE_URL}/users">View user details</a></p>`;
      const supportNotificationMailSent = await sendNotificationMail({
        subject: `GIFTforward - New User Registration - ${email}`,
        content,
      });

      if (!supportNotificationMailSent) {
        // TODO: logger different than console.log
        console.log('Notification failed. Notification email can not be sent to support team.')
      }

      res.status(201);
      res.send({
        status: 'success',
        msg: 'Registered successfully. Verify email sent to your email.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  postForgotPassword: async function (req, res, next) {
    try {
      const email = req.body.email;
      const user = await DBBridge.User.findByName(email);

      if (!user) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: res.cookie().__('Unknown user'),
        });
      }

      const forgot_token = Helper.generate_token_string(
        process.env.FORGOT_TOKEN_PREFIX,
        process.env.FORGOT_TOKEN_SUFFIX
      );

      const reset_link = `${process.env.BASE_URL}/reset-password?token=${forgot_token}`;
      const param = {
        type: 'forgot-password',
        email: email,
        reset_link: reset_link,
      };

      const isEmailSent = await sendMail(param);
      if (!isEmailSent) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'Failed sending message to your email',
        });
      }

      await DBBridge.User.setResetToken(user['id'], forgot_token);
      return res.send({ status: 'success' });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },

  postResetPassword: async function (req, res, next) {
    const user = await DBBridge.User.findById(req.session.user.id);
    if (!user) {
      res.status(400);
      return res.send({
        status: 'failed',
        msg: res.cookie().__('Cannot find user with given email'),
      });
    }

    await DBBridge.User.updatePassword(user['id'], req.body.password);
    res.status(200);
    return res.send({
      status: 'success',
      msg: res.cookie().__('Reset password successfully'),
    });
  },

  resendInvitation: async function (req, res, next) {
    try {
      const email = req.body.email;
      const user = await DBBridge.User.findByName(email);
      if (!user) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'User with given email doesn\'t exist',
        });
      }

      if (user.verified) {
        res.status(400);
        return res.send({
          status: 'failed',
          msg: 'User is already verified.',
        });
      }

      // Generate verify token string and send verify mail to user
      const verify_token = Helper.generate_token_string(
        process.env.VERIFY_TOKEN_PREFIX,
        process.env.VERIFY_TOEK_SUFFIX
      );

      const isEmailSent = await sendMail({
        type: 'user-activate',
        email: email,
        token: verify_token,
      })
      if (!isEmailSent) {
        res.status(400);
        res.send({
          status: 'failed',
          msg: 'Reset email not sent. An error occured.',
        });
      }

      // After send mail successfully, create new user
      await DBBridge.User.setVerifiedToken(user.id, verify_token);
      res.send({
        status: 'success',
        msg: 'Reset email sent.',
      });
    } catch (err) {
      console.log(err);
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'Invalid operation.',
      });
    }
  },
});
