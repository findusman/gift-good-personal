const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

const getPathnameWithParams = (url) => {
  try {
    if (!url) {
      return '';
    } else if(!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    } else {
      const newUrl = new URL(url);
      return `${newUrl.pathname}?${newUrl.searchParams.toString()}`;
    }
  } catch(e) {
    console.error(e);
    return url;
  }
}

const getShopifyUrl = (url) => (
  process.env.USE_SHOPIFY_PROXY ? getPathnameWithParams(url) : url
)

const getCustomerLandingPath = ({ isDemo, id }) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET);
  return `/${isDemo ? 'demo' : 'customer'}/landing?cid=${id}&token=${token}`
}

const getCustomerLandingShortUrl = ({ shortUrl, id }) => {
  const path = (shortUrl && shortUrl.suffix) ? `/s/${shortUrl.suffix}` : module.exports.getCustomerLandingPath({ isDemo: false, id });
  return `${process.env.BASE_URL}${path}`;
}

const getCampaignLandingPath = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET);
  return `/customer/landing?campaign=${id}&token=${token}`;
}

const createUrlSuffix = () => {
  return nanoid(16);
}

const isValidHttpUrl = (str) => {
  let url;
  try {
    url = new URL(str);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

module.exports = {
  getPathnameWithParams,
  getShopifyUrl,
  getCampaignLandingPath,
  getCustomerLandingPath,
  getCustomerLandingShortUrl,
  createUrlSuffix,
  isValidHttpUrl,
}