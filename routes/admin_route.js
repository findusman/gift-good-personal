let express = require('express');
let router = express.Router();

const MiddlewareController = require('../controllers/MiddlewareController');
const AdminController = require('../controllers/AdminController');

router.get(
  '/admin-campaigns',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.list_all_campaigns(req, res, next);
  }
);

router.get(
  '/admin-collections',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.list_all_collections(req, res, next);
  }
);

router.get(
  '/admin-credits-history/:userId',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.list_user_credits_history(req, res, next);
  }
)

router.get(
  '/admin-credits',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.list_users_credits(req, res, next);
  }
);

router.get(
  '/export-admin-credits',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.export_users_credits(req, res, next);
  }
);

router.get(
  '/admin-queues',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.list_queues(req, res, next);
  }
);

router.get(
  '/admin-contacts',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.listContacts(req, res, next);
  }
);

router.get(
  '/admin-settings',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.showSettings(req, res, next);
  }
);

router.post(
  '/admin-settings',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    AdminController.updateSettings(req, res, next);
  }
);

router.get(
  '/admin-authentication-providers',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.manageAuthenticationProviders(req, res, next);
  }
);

router.get(
  '/admin-authentication-providers/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.getAuthenticationProvider(req, res, next);
  }
)

router.post(
  '/admin-authentication-providers',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.createAuthenticationProvider(req, res, next);
  }
)

router.put(
  '/admin-authentication-providers/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.updateAuthenticationProvider(req, res, next);
  }
)

router.delete(
  '/admin-authentication-providers/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.deleteAuthenticationProvider(req, res, next);
  }
)

router.get(
  '/admin-authentication-tokens',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.manageAuthenticationTokens(req, res, next);
  }
);

router.get(
  '/admin-authentication-tokens/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.getAuthenticationToken(req, res, next);
  }
)

router.post(
  '/admin-authentication-tokens',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.createAuthenticationToken(req, res, next);
  }
)

router.put(
  '/admin-authentication-tokens/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.updateAuthenticationToken(req, res, next);
  }
)

router.delete(
  '/admin-authentication-tokens/:id',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.deleteAuthenticationToken(req, res, next);
  }
)

router.post(
  '/admin-import-tokens',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.createAuthenticationTokens(req, res, next);
  }
)

router.get(
  '/admin-export-tokens',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.getAllProviderTokens(req, res, next);
  }
)

router.post(
  '/admin-verify',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.adminVerifyUser(req, res, next);
  }
);
router.post(
  '/admin-archive-user',
  MiddlewareController.doCheckLogin,
  MiddlewareController.doCheckAdmin,
  function (req, res, next) {
    AdminController.adminArchiveUser(req, res, next);
  }
);
router.post(
  '/send-queue',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    AdminController.send_queue(req, res, next);
  }
);
router.post(
  '/send-individual-invite',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    console.log('req', req.body);
    AdminController.send_individual_invite(req, res, next);
  }
);
router.post(
  '/remove-campaign-queue',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function (req, res, next) {
    AdminController.do_remove_campaign_queue(req, res, next);
  }
);

router.post(
  '/toggle-campaign-star',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  function(req, res, next) {
    AdminController.toggleCampaignStar(req, res, next);
  }
);

module.exports = router;
