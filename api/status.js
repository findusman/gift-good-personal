const { isPastDate } = require('./time');

const getCampaignStatus = (isSent, expireDate, isUniqueUrl) => {
  const expireAtDate = new Date(expireDate).setHours(0, 0, 0, 0);
  const todayDate = new Date().setHours(0, 0, 0, 0);
  const isActive = expireAtDate >= todayDate;

  if (!isSent && !isUniqueUrl && isActive) {
    return 'Pending';
  } else if (expireDate === null) {
    return 'No Expiration Set';
  } else if ((isSent || isUniqueUrl) && isActive) {
    return 'Live';
  } else {
    return 'Expired';
  }
};

// Map db statuses to statuses visible for user
const statusHelper = (status) => {
  statusMap = {
    ready: 'ready',
    sending: 'sending',
    sent: 'sent',
    bounced: 'bounced',
    confirmed: 'redeemed',
    redeemed: 'redeemed',
    canceled: 'canceled',
    shipped: 'redeemed',
    delivered: 'redeemed',
    reactivated: 'reactivated',
    expired: 'expired',
    declined: 'declined'
  };
  return statusMap[status];
};

const redeemedStatuses = ['redeemed', 'shipped', 'delivered', 'confirmed'];
const inactiveStatuses = ['redeemed', 'confirmed', 'canceled', 'shipped', 'delivered', 'expired'];

const checkIfInactive = (status) => {
  return inactiveStatuses.includes(status);
};

const checkIfRedeemed = (status) => (
  redeemedStatuses.includes(status)
);

const checkGiftPagesStatus = ({ step, campaign, shouldRequestNewLink }) => {
  let isRedeemed = checkIfInactive(step);
  let isReactivated = false;
  let isExpired = false;
  const expireDate = campaign['expire_date'];
  if (campaign['allow_multiple_redemptions']) {
    isExpired = isPastDate(expireDate) || campaign.price > campaign.campaignAccount['credit_amount'];
  } else {
    isReactivated = step === 'reactivated';
    isExpired = (isPastDate(expireDate) && !isReactivated) || step === 'expired';
  }
  const isActive = !isRedeemed && !isExpired && !shouldRequestNewLink;
  return {
    isRedeemed,
    isExpired,
    isActive
  }
}

module.exports = {
  getCampaignStatus,
  statusHelper,
  checkIfInactive,
  checkGiftPagesStatus,
  checkIfRedeemed,
  redeemedStatuses,
  inactiveStatuses
};
