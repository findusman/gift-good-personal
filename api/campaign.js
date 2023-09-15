const { isTrue } = require('../util/helper');
const CampaignBridge = require('../models/bridge/CampaignBridge');
const ContactBridge = require('../models/bridge/ContactBridge');

const checkIfMediaShouldBeDisplayed = (source, isEmail) => {
  if (!source) {
    return {}
  }
  const isCollectionType = !!(isTrue(source.is_collection_products_type) || source.collection);
  // Old flow campaigns (not isCollectionType): display media if url exists
  // New flow campaigns: display media if url exists and landing_include_logo etc. is true
  if (isEmail) {
    const logoUrl = source.logo_url || source.logo;
    const bannerUrl = source.banner_url || source.banner;
    return {
      shouldDisplayLogo: !!(isCollectionType && source.email_include_logo !== null 
        ? source.email_include_logo && logoUrl 
        : logoUrl
      ),
      shouldDisplayBanner: !!(isCollectionType && source.email_include_banner !== null 
        ? source.email_include_banner && bannerUrl 
        : bannerUrl
      ),
    }
  } else {
    return {
      shouldDisplayLogo: !!(isCollectionType && source.landing_include_logo !== null 
        ? source.landing_include_logo && source.logo_url 
        : source.logo_url
      ),
      shouldDisplayBanner: !!(isCollectionType && source.landing_include_banner !== null 
        ? source.landing_include_banner && source.banner_url 
        : source.banner_url
      ),
      shouldDisplayVideo: !!source.video_url,
    }
  }
};

const getCampaignDataForRedemptionFlow = async ({ contactId, campaignId, isMultipleRedemptionsFlow }) => {
  let campaign;
  let contact = {};
  if (isMultipleRedemptionsFlow) {
    campaign = await CampaignBridge.get_one(null, campaignId, true, true);
  } else {
    contact = await ContactBridge.getContactDetails({ id: contactId, isEmail: false, withProducts: true });
    campaign = contact.campaign;
  }
  return { campaign, contact };
};

module.exports = {
  checkIfMediaShouldBeDisplayed,
  getCampaignDataForRedemptionFlow,
};