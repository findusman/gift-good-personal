const validateColor = require('validate-color').default;
const ConstData = require('../util/const_data');
const { getPathnameWithParams } = require('./url');

const getProductOptions = (variants) => {
  const options = variants[0].productOptions; 
  const colorOptions = options.find(el => el.name === 'Color') || {};
  const otherOptions = options.filter(el => el.name !== 'Color') || [];
  if (colorOptions.values) {
    colorOptions.values = colorOptions.values.map(el => (
      {
        ...el,
        isColor: !!el.image || validateColor(el.title)
      }
    ));
  }
  return { colorOptions, otherOptions }; 
}

const filterAndSortProductsByOrder = ({ products, order = '', addedProducts = [] }) => {
  let processedProducts = products;
  if (order) {
    processedProducts = processedProducts.sort((a, b) =>
      order.indexOf(a['product_id']) -
      order.indexOf(b['product_id'])
    );
  } 
  // if (addedProducts.length) {
  //   processedProducts = processedProducts.sort((a, _) =>
  //     addedProducts.includes(a['product_id']) ? 0 : -1
  //   );
  // }
  
  return processedProducts;
}

const mapProductImageUrlsToProxy = (product) => {
  const image_data = product.image_data ? {
    main: getPathnameWithParams(product.image_data.main),
    sub: product.image_data.sub && product.image_data.sub.map(el => getPathnameWithParams(el))
  } : {};
  return {
    ...product,
    image_data,
    impact_icon: getPathnameWithParams(product.impact_icon),
    impact_story_image: getPathnameWithParams(product.impact_story_image),
    variant_image: getPathnameWithParams(product.variant_image),
  }
}

const addOrRemoveProduct = ({ product, sourceList, targetList }) => {
  let newList = '';
  if (sourceList && sourceList.indexOf(product) >= 0) {
    newList = sourceList.split(',');
    newList.splice(newList.indexOf(product), 1);
    newList = newList.join(',');
    return { newList, shouldAddEntry: false };
  } else {
    newList = targetList ? `${targetList},${product}` : product;
    return { newList, shouldAddEntry: true };
  }
}

const groupCampaignProductsForLanding = ({ products, useShopifyProxy }) => {
  // Group products by variants and filter by qty
  let groupedProducts = products
    .reduce((a, b) => {
      const product = a.find(el => el.product_id === b.product_id);
      if (product && product.variants) {
        product.variants.push(b);
      } else {
        b.variants = [b];
        a.push(b);
      }
      return a;
    }, [])
    .filter(el =>
      el.inventory_management === null || el.variants.find(variant => variant.qty > ConstData.MIN_VARIANT_QTY)
    ).map(el =>
      ({ ...el, is_donation: !!el.tags.find(tag => tag.trim() === 'donation') })
    );

  if (useShopifyProxy) {
    groupedProducts = groupedProducts.map(product => mapProductImageUrlsToProxy(product))
  }
  return groupedProducts;
}

module.exports = {
  getProductOptions,
  filterAndSortProductsByOrder,
  mapProductImageUrlsToProxy,
  addOrRemoveProduct,
  groupCampaignProductsForLanding,
}
