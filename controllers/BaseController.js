let _ = require('underscore');
let fs = require('fs');
let crypto = require('crypto');

module.exports = {
  name: 'BaseController',
  extend: function (child) {
    return _.extend({}, this, child);
  },
};
