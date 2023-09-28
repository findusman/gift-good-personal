let View = require('../views/base');
let jwt = require('jsonwebtoken');
const DBBridge = require('../models/bridge');
let Helper = require('../util/helper');
const { sendMail, sendNotificationMail } = require('../api/mail');
let BaseController = require('./BaseController');
const { getGlobalTemplateData } = require('../api/template');

module.exports = BaseController.extend({
  name: 'AuthController',
  login: async function (req, res, next) {

    const redirect_url = req.query.redirect || '/';

    if (req.session.login === 1) return res.redirect(redirect_url);

    let v = new View(res, 'client/auth/client-login');

    v.render({
      page_title: 'client-login',
      page_type: 'client-auth-page',
      isSessionAutoOut: true,
      ...getGlobalTemplateData(req, res),
      redirect: redirect_url,
    });
  },

  impersonate: async function (req, res, next) {
    const redirect_url = req.query.redirect || '/';
    req.session.impersonate == 1
      ? (req.session.mainAccount = req.session.mainAccount)
      : (req.session.mainAccount = req.session.user.email);
    req.session.impersonate == 1
      ? (req.session.impersonate = 0)
      : (req.session.impersonate = 1);
    console.log('Imp', req.session.impersonate);
    console.log('Main', req.session.mainAccount);
    console.log('IUser', req.query.userID);
    const email = req.query.userID ? req.query.userID : req.session.mainAccount;
    console.log('EMAIL', email);
    const user = await DBBridge.User.findByName(email);
    console.log('Found user', user.email);
    await DBBridge.User.loginSuccess(user, {});
    console.log('Set User', user.email);
    const companyUsers = await DBBridge.User.listCompanyUsersIds(user);
    req.session.user = user;
    req.session.companyUsers = companyUsers;
    req.session.abilityRules = [];

    let token = jwt.sign({ login_email: email }, process.env.JWT_SECRET, {
      expiresIn: '240h',
    });
    if (req.session.login === 1) return res.redirect(redirect_url);
    let v = new View(res, 'client/auth/client-login');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'client-login',
      page_type: 'client-auth-page',
      redirect: redirect_url,
    });
  },

  register: async function (req, res, next) {
    if (req.session.login === 1) return res.redirect('/');
    let v = new View(res, 'client/auth/client-register');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'client-register',
      page_type: 'client-auth-page',
    });
  },

  verifyUser: async function (req, res, next) {
    if (req.session.login === 1) return res.redirect('/');
    let token = req.query.token;
    if (!token) return res.redirect('/404');

    let user = await DBBridge.User.findByVerifyToken(token);
    if (!user) return res.redirect('/404');
    await DBBridge.User.setVerified(user['id']);
    req.session.user = user;
    req.session.login = 1;
    return res.redirect('/');
  },

  forgotPassword: async function (req, res, next) {
    if (req.session.login === 1) return res.redirect('/');
    let v = new View(res, 'client/auth/client-forgot-password');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'client-forgot-password',
      page_type: 'client-auth-page',
    });
  },

  resetPassword: async function (req, res, next) {
    if (req.session.login === 1) return res.redirect('/');
    let token = req.query.token;
    if (!token) return res.redirect('/404');

    let user = await DBBridge.User.findByResetToken(token);
    if (!user) return res.redirect('/404');
    req.session.user = user;
    let v = new View(res, 'client/auth/client-reset-password');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'client-reset-password',
      page_type: 'client-auth-page',
    });
  },

  logout: async function (req, res, next) {
    req.session.login = 0;
    req.session.impersonate = 0;
    req.session.mainAccount = null;
    req.session.user = null;
    req.session.abilityRules = [];
    req.session.companyUsers = [];
    req.session.save();
    return res.redirect('/login');
  },

  postLogout: async function (req, res, next) {
    req.session.login = 0;
    req.session.impersonate = 0;
    req.session.mainAccount = null;
    req.session.user = null;
    req.session.abilityRules = [];
    req.session.companyUsers = [];
    req.session.save();
    return res.send({
      status: 'success',
      msg: res.cookie().__('Logout Success'),
    });
  },

  welcome: async function (req, res, next) {
    let v = new View(res, 'client/auth/welcome');
    v.render({
      ...getGlobalTemplateData(req, res),
      page_title: 'client-welcome',
      page_type: 'client-welcome-page',
    });
  },
});
