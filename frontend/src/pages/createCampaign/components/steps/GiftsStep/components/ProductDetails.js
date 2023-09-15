import React from 'react';
import PropTypes from 'prop-types';
import impactIcons from 'data/impactIcons.json';

const ProductDetails = ({ descriptionHtml, tags }) => {
  return (
    <div className="product-details">
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12 md:mb-5">
        {tags.map((tag) => {
          const tagData = impactIcons[tag.trim()];
          if (tagData) {
            return (
              <li className="flex items-center" key={tag}>
                <img src={`/resources/images/${tagData.image}.svg`} alt="" className="text-lg w-8 md:w-12 mr-4" />
                {tagData.title}
              </li>
            );
          }
          return null;
        })}
      </ul>
    </div>
  );
};

ProductDetails.propTypes = {
  tags: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  descriptionHtml: PropTypes.string,
};

ProductDetails.defaultProps = {
  tags: [],
  descriptionHtml: '',
};

export default ProductDetails;
