'use strict';

const oldContent = {
  1: { 
    subject: 'Just a reminder: :from_first_name at :from_company_name has sent you a gift!',
    content: ':to_first_name, <br/>A quick reminder that :from_first_name at :from_company_name sent you a collection of gift choices and you never redeemed your gift. Don\'\'t forget to claim your gift and read how it\'\'s changing someone\'\'s life around the world. Let\'\'s do some good!',
  },
  2: { 
    subject: 'Gentle reminder: redeem your gift that gives back from :from_first_name at :from_company_name', 
    content: ':to_first_name, <br/>Just a friendly reminder that :from_first_name at :from_company_name sent you a gift that you never redeemed. By choosing a gift, you will help to support a nonprofit or small business in need. So this is just a gentle reminder that there\'\'s still time to choose an awesome gift and do some good! ',
  },
  3: { 
    subject: 'Your gift for good is about to expire',
    content: ':to_first_name, <br/>Just a gentle reminder that your gift from :from_first_name at :from_company_name will expire soon. And along with it, the opportunity to do good. By redeeming any gift, you will help to support a charitable cause around the world. We hope you\'\'ll choose to gift it forward by enjoying a great gift that does good in the world!',
  },
  4: {
    subject: 'Last chance to redeem your gift from :from_first_name at :from_company_name',
    content: 'Your gift from :from_first_name at :from_company_name is about to expire. We hope you will choose to redeem a gift that helps people and the planet by clicking the link below!',
  }
}

// Clear all reminder content from the campaign data
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const clear = async (i, type) => {
      const contentsToUpdate = await queryInterface.sequelize.query(
        `SELECT id FROM public.campaigns
        where reminder${i}_${type} = '${oldContent[i][type]}';`
      );
      const campaignIds = contentsToUpdate ? contentsToUpdate[0].map(campaign => (campaign.id)) : [];
      console.log(`Clearing reminder ${i} ${type} of ${campaignIds.length} campaigns.`);
      return await queryInterface.bulkUpdate('campaigns', { [`reminder${i}_${type}`]: null }, { id: campaignIds } );
    }
    for (const i of [1,2,3,4]) {
      await clear(i, 'content');
      await clear(i, 'subject');
      console.log(`Cleared old default content and subject of reminder #${i}`);
    }
  },

  async down (queryInterface, Sequelize) {
    const fillWithOldContent = async (i, type) => {
      const contentsToUpdate = await queryInterface.sequelize.query(
        `SELECT id FROM public.campaigns
        where reminder${i}_${type} is null;`
      );
      const campaignIds = contentsToUpdate ? contentsToUpdate[0].map(campaign => (campaign.id)) : [];
      console.log(`Filling reminder ${i} ${type} of ${campaignIds.length} campaigns with old default values.`);
      return await queryInterface.bulkUpdate('campaigns', { [`reminder${i}_${type}`]: oldContent[i][type].replaceAll('\'\'', '\'') }, { id: campaignIds } );
    }
    for (const i of [1,2,3,4]) {
      await fillWithOldContent(i, 'content');
      await fillWithOldContent(i, 'subject');
      console.log(`Filled reminder ${i} with old default content`);
    }
  }
};
