import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useWindowWidth } from '@react-hook/window-size';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, FreeMode, Pagination, Controller } from 'swiper';
import content from 'data/content.json';

// eslint-disable-next-line import/no-unresolved
import 'swiper/css';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/thumbs';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/free-mode';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/navigation';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/pagination';
import 'assets/styles/swiper.css';

const ProductGallery = ({ images }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [gallerySwiper, setGallerySwiper] = useState(null);
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 768;
  const wrapperStyles = isDesktop ? { height: '550px' } : { width: `${windowWidth - 64}px` };

  const onNextClick = () => {
    if (!gallerySwiper.isEnd) {
      gallerySwiper.slideTo(gallerySwiper.activeIndex + 1);
    }
  };

  const onPrevClick = () => {
    if (!thumbsSwiper.isBeggining) {
      gallerySwiper.slideTo(gallerySwiper.activeIndex - 1);
    }
  };

  return (
    <div className="flex" style={wrapperStyles}>
      {isDesktop && (
        <div className="relative py-8 h-[512px] md:mr-25">
          <Swiper
            direction="vertical"
            onSwiper={setThumbsSwiper}
            slidesPerView={4}
            modules={[Thumbs, FreeMode, Controller]}
            freeMode
            spaceBetween={16}
            className="w-[100px] h-[448px]"
            onSlideChange={() => {
              gallerySwiper.slideTo(thumbsSwiper.activeIndex);
            }}
          >
            {images.map((image) => (
              <SwiperSlide key={image.node.src} className="h-[100px] w-[100px] border border-grey">
                <img src={image.node.src} alt="" className="w-full h-full absolute object-center object-cover" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
      <div className="relative w-full">
        <Swiper
          onSwiper={setGallerySwiper}
          modules={[Thumbs, FreeMode, Pagination, Controller]}
          direction="horizontal"
          preloadImages={false}
          pagination={{
            clickable: true,
            bulletActiveClass: 'bg-beige',
            bulletClass: 'w-2.5 h-2.5 inline-block rounded-full mx-1 border border-black',
            horizontalClass: 'left-0 w-full b-0',
          }}
          className="w-full md:ml-25 md:h-[550px] md:w-[550px]"
          breakpoints={{ 768: { pagination: false, direction: 'vertical' } }}
          thumbs={{ swiper: thumbsSwiper }}
        >
          {images.map((image) => (
            <SwiperSlide key={image.node.src}>
              <div className="relative h-0 w-full pb-[100%]">
                <img src={image.node.src} alt="" className="w-full h-full absolute object-center object-contain" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {isDesktop && (
          <>
            <button type="button" className="swiper-button-prev custom-swiper-prev" onClick={onPrevClick}>
              <span className="sr-only">{content.common.prev}</span>
            </button>
            <button type="button" className="swiper-button-next custom-swiper-next" onClick={onNextClick}>
              <span className="sr-only">{content.common.next}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductGallery;

ProductGallery.propTypes = {
  images: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
};
