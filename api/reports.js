const sortOptions = [
  { code: 'na', title: 'By Name Ascending' },
  { code: 'nd', title: 'By Name Descending' },
  { code: 'ea', title: 'By Email Ascending' },
  { code: 'ed', title: 'By Email Descending' },
  { code: 'ta', title: 'By Redeemed Date Ascending' },
  { code: 'td', title: 'By Redeemed Date Descending' }
];

const statusFilterOptions = [
  { code: 'all', title: 'All' },
  { code: 'sent', title: 'Sent' },
  { code: 'opened', title: 'Opened' },
  { code: 'redeemed', title: 'Redeemed' },
  { code: 'bounced', title: 'Bounced' },
  { code: 'unredeemed', title: 'Unredeemed' },
  { code: 'canceled', title: 'Canceled' },
  { code: 'declined', title: 'Declined' },
];

const emailFilterOptions = [
  { code: 'all', title: 'All' },
  { code:'email_opened', title: 'Email Opened' },
  { code: 'email_unopened', title: 'Email Unopened' },
  { code:'email_clicked', title: 'Email Clicked' },
  { code: 'email_not_clicked', title: 'Email Not Clicked' },
]

const thanksFilterOptions = [
  { code: 'responded', title: 'Responded' },
  { code: 'notresponded', title: 'Not responded' },
];

const getCampaignsByIds = (campaigns, ids) => {
  if (ids && ids.length) {
    return campaigns.filter(el => (ids.includes(el.id.toString()))) || {};
  } else {
    return [];
  }
};  

const getSenderIds = (onlyMine, currentUser) => (
  onlyMine === 'true' ? [currentUser.id] : [currentUser.id, currentUser.parent_id]
);

module.exports = {
  sortOptions,
  statusFilterOptions,
  emailFilterOptions,
  thanksFilterOptions,
  getCampaignsByIds,
  getSenderIds,
};