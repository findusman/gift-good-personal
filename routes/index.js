const { createProxyMiddleware } = require('http-proxy-middleware');
const admin_route = require('./admin_route');
const auth_route = require('./auth_route');
const client_route = require('./client_route');
const collection_route = require('./collection_route');
const contact_route = require('./contact_route');
const credit_route = require('./credit_route');
const cron_route = require('./cron_route');
const customer_route = require('./customer_route');
const demo_route = require('./demo_route');
const extra_route = require('./extra_route');
const mail_route = require('./mail_route');
const preview_route = require('./preview_route');
const shopify_route = require('./shopify_route');
const step_route = require('./step_route');
const upload_route = require('./upload_route');
const short_route = require('./short_route');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
const campaign_route = require('./campaign_route');
const api_v1_route = require('./api_v1_route');
const ConstData = require('../util/const_data');
const MiddlewareController = require('../controllers/MiddlewareController');
const Helper = require('../util/helper');

module.exports = function (app) {
  /*** Uploads Redirects */
  app.get('/uploads/*', function (req, res) {
    res.redirect(
      `https://gifts-for-good.s3.amazonaws.com${req.originalUrl}`
    );
  });
  app.use(MiddlewareController.provideAbility);
  app.use('/', admin_route);
  app.use('/', auth_route);
  app.use('/', client_route);
  app.use('/', upload_route);
  app.use('/', extra_route);

  if (process.env.PLATFORM_VERSION >= ConstData.VERSION_ALPHA) {
    app.use('/api/v1', api_v1_route);
    app.use('/campaign', campaign_route);
  }

  app.use('/customer', customer_route);
  app.use('/collection', collection_route);
  app.use('/credit', credit_route);
  app.use('/', contact_route);
  app.use('/cron', cron_route);
  app.use('/demo', demo_route);
  app.use('/mail', mail_route);
  app.use('/preview', preview_route);
  app.use('/shopify', shopify_route);
  app.use('/step', step_route);
  app.use('/s', short_route);
  app.use('/s/files/', createProxyMiddleware({
    target: 'https://cdn.shopify.com/s/files/',
    changeOrigin: true,
    pathRewrite: { "^/s/files/": "" }
  }));
  
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  app.use((err, req, res, next) => {
    console.error(err);
    if (err.name === 'ForbiddenError') {
      res.status(403);
    } else {
      res.status(500)
    }

    if (Helper.isTrue(process.env.DEBUG_ENABLED)) {
      res.render('partials/error-debug', {
        error: err,
      });
    } else {
      res.render('partials/error', {
        session: req.session,
        page_type: 'error-page',
        page_title: 'error-page',
        isHotjarEnabled: false,
      });
    }
  });

  /*** Error Routes ***/
  app.get('*', function (req, res, next) {
    res.render('partials/error', {
      session: req.session,
      page_type: 'error-page',
      page_title: 'error-page',
    });
  });
  app.get('/404', function (req, res, next) {
    res.render('partials/error', {
      session: req.session,
      page_type: 'error-page',
      page_title: 'error-page',
    });
  });
};
