let express = require('express');
let router = express.Router();
const campaignRoute = require('./api/campaign_route');
const paymentsRoute = require('./api/payments_route');
const catalogRoute = require('./api/catalog_route');
const libraryRoute = require('./api/library_route');
const recipientsRoute = require('./api/recipients_route');
const authRoute = require('./api/auth_route');

// TODO Possibly remove collections routes as we are going to use Shopify API directly
router.use('/catalog', catalogRoute);
router.use('/payments', paymentsRoute);
router.use('/campaign', campaignRoute);
router.use('/library', libraryRoute);
router.use('/recipients', recipientsRoute);
router.use('/auth', authRoute);

module.exports = router; 
