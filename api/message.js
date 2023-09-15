const moment = require('moment');

const hydrateReminderMessage = (message, contact, expireDate) => {
  const {
    from_first_name, 
    from_last_name, 
    from_company_name, 
    to_first_name, 
    to_last_name, 
    to_company_name,
    campaign: {
      expire_date: campaignExpireDate,
      signature
    }
  } = contact;
  const expireDays = moment(expireDate || campaignExpireDate).diff(moment(), 'days');

  return message
    .split(':from_first_name')
    .join(from_first_name)
    .split(':from_last_name')
    .join(from_last_name)
    .split(':from_name')
    .join(`${from_first_name} ${from_last_name}`)
    .split(':from_company_name')
    .join(from_company_name)
    .split(':to_first_name')
    .join(to_first_name)
    .split(':to_name')
    .join(`${to_first_name} ${to_last_name}`)
    .split(':to_company_name')
    .join(to_company_name)
    .split(':expire_days')
    .join(expireDays)
    .split(':signature')
    .join(signature);
}

module.exports = {
  hydrateReminderMessage
}