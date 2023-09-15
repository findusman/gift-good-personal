var aws = require('aws-sdk');
let express = require('express');
let fs = require('fs');
let multer = require('multer');
var multerS3 = require('multer-s3');
let path = require('path');
let router = express.Router();

var s3 = new aws.S3({
  secretAccessId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
  params: {
    Bucket: 'gifts-for-good/uploads',
  },
});

let helper = require('../util/helper');

let storage = multerS3({
  s3: s3,
  bucket: 'gifts-for-good/uploads',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + file.originalname);
  },
});

let upload = multer({ storage: storage });

let MiddlewareController = require('../controllers/MiddlewareController');
let UploadController = require('../controllers/UploadController');

router.post(
  '/upload-file',
  MiddlewareController.doCheckLoginPost,
  upload.single('file'),
  function (req, res, next) {
    UploadController.upload_file(req, res, next);
  }
);

router.post(
  '/upload-demo-file',
  MiddlewareController.doCheckLoginPost,
  MiddlewareController.doCheckAdminPost,
  upload.single('file'),
  function (req, res, next) {
    UploadController.upload_demo_file(req, res, next);
  }
);

module.exports = router;
