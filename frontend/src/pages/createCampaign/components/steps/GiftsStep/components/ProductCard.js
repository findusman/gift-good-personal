// TODO Add props
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import classnames from 'classnames';
import BaseDialog from 'components/common/BaseDialog';
import content from 'data/content.json';
import ProductPreview from './ProductPreview';

const resizeThumbnail = (url) => {
  if (!url) {
    return url;
  }

  return url.replace(/\.(jpg|png|gif|webp|svg])/, '_medium.$1');
};

const ProductCard = ({ product, collectionTitle }) => {
  const [showDetails, setShowDetails] = useState(false);
  const tagList = product.tags ? product.tags.map((tag) => tag.trim()) : [];
  const isDonation = tagList.indexOf('donation') >= 0 && tagList.indexOf('donation-cards') < 0;

  return (
    <li className="productcard">
      <div className="relative mb-4 h-0 w-full pb-[100%]">
        <img
          className={classnames('w-full h-full absolute object-center', {
            'object-cover': isDonation,
            'object-contain': !isDonation,
          })}
          src={resizeThumbnail(product.image_data.main)}
          alt={product.product_title}
        />
      </div>
      <h3 className="font-lato text-lg md:text-base leading-6 mb-2 md:mb-1 overflow-hidden">{product.product_title}</h3>
      <p className="text-1.5lg text-dark-gray font-crimsontext mb-2">{collectionTitle}</p>
      <div className="flex items-center mb-2.5 md:mb-1.5">
        <img src={product.impact_icon} alt={product.impact_icon} className="w-8 -ml-2" />
        <span className="text-xs">{product.impact_story_collection}</span>
      </div>
      <button type="button" className="btn-underline text-sm" onClick={() => setShowDetails(true)}>
        {content.common.viewDetails}
      </button>
      <BaseDialog
        visible={showDetails}
        handleClose={() => setShowDetails(false)}
        panelContent={<ProductPreview productId={product.product_id} collectionTitle={collectionTitle} />}
        paddingT="md:pt-16"
      />
    </li>
  );
};

export default ProductCard;
