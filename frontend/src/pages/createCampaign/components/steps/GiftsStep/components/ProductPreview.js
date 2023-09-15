import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { fetchProductDetails } from 'store/createCampaign/productDetails/productDetailsSlice';
import content from 'data/content.json';
import ProductTab from './ProductTab';
import ProductGallery from './ProductGallery';
import ProductDetails from './ProductDetails';
import UNGoalsList from './UNGoalsList';

const ProductPreview = ({ productId, collectionTitle }) => {
  const dispatch = useDispatch();
  const { product } = useSelector((state) => {
    return { product: state.productDetails.data };
  });
  useEffect(() => {
    dispatch(fetchProductDetails({ productId }));
  }, [productId]);

  if (!product) {
    return null;
  }

  const {
    images: { edges: images },
    title,
    impactIcon,
    impactShortDescription,
    impactImage,
    impactStoryDescription,
    impactCard,
    tags,
    descriptionHtml,
    ungoals: { edges: ungoals },
  } = product;
  const { productPreview: data } = content;
  const isDonation = tags && tags.find((tag) => tag.trim() === 'donation');

  return (
    <div>
      <ProductGallery images={images} />
      <div className="flex flex-col items-center">
        <h1 className="text-2.6xl md:text-4.2xl mb-4">{title}</h1>
        <p className="text-1.5lg text-dark-gray font-crimsontext mb-4">{collectionTitle}</p>
        <p className="flex items-center mb-5 leading-5 md:mb-6">
          {product.impactIcon && (
            <img src={impactIcon.value} alt="" className="w-5 md:w-8 -ml-2 h-auto mr-1.5 self-center" />
          )}
          {impactShortDescription && impactShortDescription.value}
        </p>
      </div>

      {!isDonation && (
        <ProductTab title={data.details.title} defaultOpen>
          <ProductDetails tags={tags} descriptionHtml={descriptionHtml} />
        </ProductTab>
      )}
      <ProductTab title={data.impact.title} defaultOpen={isDonation}>
        <div className="product-details">
          {impactImage && (
            <img src={impactImage.value} alt="" className="block rounded-full w-[189px] h-[189px] mb-6.5" />
          )}
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: impactStoryDescription && impactStoryDescription.value }} />
        </div>
      </ProductTab>
      {!isDonation && (
        <>
          <ProductTab title={data.story.title}>
            <>
              <p className="mb-6.5">{data.story.text}</p>
              {impactCard && (
                <img src={product.impactCard.value} alt="Product Story Card" className="w-full max-w-[442px]" />
              )}
            </>
          </ProductTab>
          <ProductTab title={data.goals.title}>
            <UNGoalsList goals={ungoals} />
          </ProductTab>
        </>
      )}
      <div className="bg-beige-dark pt-11 pb-8 md:pb-12.5 px-5 md:px-11 mt-12">
        <h2 className="text-2xl md:text-2.6xl mb-7 leading-7">{data.support.title}</h2>
        <p className="mb-7 leading-6">{data.support.text}</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
          {data.support.images.map((image) => (
            <img
              src={image.src}
              alt=""
              className={classnames('object-cover object-center w-full h-full', {
                'col-span-11': image.isBigger,
                'col-span-9': image.isSmaller,
                'col-span-10': !image.isSmaller && !image.isBigger,
              })}
              key={image.src}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;

ProductPreview.propTypes = {
  productId: PropTypes.string.isRequired,
  collectionTitle: PropTypes.string.isRequired,
};
