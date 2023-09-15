// Config env
const dotenv = require('dotenv');
const path = require('path');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');
global.appRoot = path.resolve(__dirname);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Airbrake = require('@airbrake/node');
const { setUpDotenv } = require('./util/helper');
const useLivereload = process.env.LIVE_RELOLAD === '1';

setUpDotenv();

const server = require('express')();
server.use(function (req, res, next) {
  if (req.header('x-forwarded-proto') === 'http') {
    res.redirect(301, 'https://' + req.hostname + req.url);
    return;
  }
  next();
});

if (useLivereload) {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, 'public'));

  liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
      liveReloadServer.refresh('/');
    }, 100);
  });

  server.use(connectLivereload());
}
new Airbrake.Notifier({
  projectId: 375518,
  projectKey: process.env.AIRBRAKE_KEY,
  environment: process.env.AIRBRAKE_ENV,
});

// Connect to database, and initialize it
const db = require('./models/sequelize');

db.sequelize
  .sync({ alter: true })
  .then(async () => {
    // Do extra setup for database
    await require('./models/sequelize/extra_setup')(db);
    // Setup server
    require('./util/server_setup')(server, db.sequelize);
    // Setup routes
    require('./routes')(server);

    // Start server listening
    server.listen(process.env.PORT || 3000, function () {
      console.log(
        process.env.NODE_ENV,
        ' server listening ==> ',
        process.env.BASE_URL,
        process.env.PORT || 3000
      );
    });
  })
  .catch((err) => {
    console.log('Error while syncing database ', err);
  });
