let BaseController = require('./BaseController');
const DBBridge = require('../models/bridge');

module.exports = BaseController.extend({
  name: 'UploadController',

  // Upload file
  upload_file: async function (req, res, next) {
    try {
      const fileUrl = new URL(req.file.location);
      const file_link = fileUrl.pathname;
      // TODO Save asset in library (if requested)

      return res.send({
        status: 'success',
        file_link,
      });
    } catch (err) {
      console.log('ERROR', err);
    }
  },

  // Upload demo file
  upload_demo_file: async function (req, res, next) {
    const file_link = process.env.UPLOAD_PREFIX + req.file.filename;
    const file_type = req.body.type;
    if (
      await DBBridge.DemoCampaign.update_demo_experience(file_type, file_link)
    ) {
      return res.send({
        status: 'success',
        file_link,
      });
    } else {
      res.status(400);
      return res.send({
        status: 'failed',
        msg: 'File upload failed',
      });
    }
  },
});
