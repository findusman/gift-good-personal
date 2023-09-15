let crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

module.exports = {
  json2Base64: function (json_obj) {
    let buffer = new Buffer(JSON.stringify(json_obj));
    return buffer.toString('base64');
  },
  base642Json: function (base64_encoded) {
    const base64_decoded = Buffer.from(base64_encoded, 'base64');
    return JSON.parse(base64_decoded.toString('utf-8'));
  },
  base64_decode: function (base64_encoded) {
    const base64_decoded = Buffer.from(base64_encoded, 'base64');
    return base64_decoded.toString('utf-8');
  },

  /**
   * generates random string of characters i.e salt
   * @function
   * @param {number} length - Length of the random string.
   */
  genRandomString: function (length) {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, length); /** return required number of characters */
  },

  /**
   * hash password with sha512.
   * @function
   * @param {string} password - List of required fields.
   * @param {string} salt - Data to be validated.
   */
  sha512: function (password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
      salt: salt,
      hash: value,
    };
  },

  sleep: function (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  generate_token_string: function (prefix, suffix) {
    const random_string = module.exports.genRandomString(16);
    return module.exports.sha512(prefix + Date.now() + suffix, random_string).hash;
  },

  change_empty_fields_to_null: function (param) {
    if (!param) {
      return param;
    }
    const keys = Object.keys(param);
    for (let i = 0; i < keys.length; i++) {
      if (!param[keys[i]]) {
        param[keys[i]] = null;
      }
    }
    return param;
  },

  setUpDotenv: function() {
    const envSuffix = process.env.NODE_ENV || 'development';
    const appRoot = path.resolve(`${__dirname}/..`);
    dotenv.config({ path: path.join(appRoot, '.env.' + envSuffix) });
  },

  convertToKebabCase: function(text) {
    return text
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  isTrue: function(value) {
    return value === 'true';
  },

  parseJSON: function(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (ex) {
      return fallback;
    }
  },
};
