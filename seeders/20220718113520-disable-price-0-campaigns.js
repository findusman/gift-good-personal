// Close all campaigns with price 0
module.exports = {
  async up (queryInterface, Sequelize) {
    const campaigns = await queryInterface.sequelize.query(
      `SELECT id FROM public.campaigns
      where price = 0 and enabled = true;`
    );

    const campaignIds = campaigns ? campaigns[0].map(campaign => (campaign.id)) : [];
    console.log(`Disabling ${campaigns[0].length} campaigns with price 0`);
    return campaignIds.length 
      ? queryInterface.bulkUpdate('campaigns', { enabled: false }, { id: campaignIds } ) 
      : null;
  }
};
