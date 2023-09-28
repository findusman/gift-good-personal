const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const moment = require('moment');
const path = require('path');
const redis = require('redis');
const session = require('express-session');

module.exports = function (server, sequelize) {

    let i18n = require('i18n');
    i18n.configure({
        //define how many languages we would support in our application
        locales: ['EN', 'PL'],

        //define the path to language json files, default is /locales
        directory: path.join(appRoot, 'locales'),

        //define the default language
        defaultLocale: 'EN',

        // define a custom cookie name to parse locale settings from
        cookie: 'i18n'
    });

    server.set('views', path.join(appRoot, 'views'));
    server.set('view engine', 'ejs');

    server.use(express.static(path.join(appRoot, 'public')));

    server.use(cookieParser());
    server.use(cors());

    // initalize sequelize with session store
    let SequelizeStore = require("connect-session-sequelize")(session.Store);
    let myStore = new SequelizeStore({ db: sequelize });
    server.use(session({
        secret: "1234567890",
        cookie: { maxAge: 1 * 30 * 1000 },
        resave: true,
        saveUninitialized: false,
        store: myStore
    }));
    myStore.sync();

    server.use(i18n.init);
    server.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
    server.use(bodyParser.json({ limit: '500mb', extended: true }));
    server.use(bodyParser.json({ type: 'application/vnd.api+json' }));
    server.use(methodOverride('X-HTTP-Method-Override'));
    server.use(flash());
    server.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept');
        res.setHeader('Access-Control-Allow-Credentials', true);
        // res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        // res.setHeader('X-Content-Type-Options', 'max-age=63072000; includeSubDomains; preload');
        // res.setHeader('X-Frame-Options', 'DENY');
        // res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
}
