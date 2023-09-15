const { Op } = require('sequelize');

const getSearchCondition = (search) => (
  [
    { to_email: { [Op.iLike]: search } },
    { to_first_name: { [Op.iLike]: search } },
    { to_last_name: { [Op.iLike]: search } },
    { to_company_name: { [Op.iLike]: search } }
  ]
);

const mailContactAttributes = [
  'id', 
  'from_first_name', 
  'from_last_name', 
  'from_company_name', 
  'from_email', 
  'to_first_name', 
  'to_last_name', 
  'to_company_name', 
  'to_email'
];

const mailCampaignAttributes = [
  'id', 
  'message', 
  'email_message', 
  'email_subject', 
  'single_product', 
  'email_include_logo', 
  'email_include_banner', 
  'email_include_gfg_logo', 
  'logo_url', 
  'banner_url',
  'cc_email',
];

module.exports = {
  getSearchCondition,
  mailContactAttributes,
  mailCampaignAttributes,
}