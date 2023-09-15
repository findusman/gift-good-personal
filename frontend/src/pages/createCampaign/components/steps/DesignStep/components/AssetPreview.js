/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

import xImg from 'assets/images/ex.svg';
import Video from 'components/layout/video';

const AssetPreview = ({ asset, handleAssetRemove, type }) => {
  const { src, alt, video } = asset;

  if (!src && !video) {
    return null;
  }

  const maxWidthCls = type === 'logo' ? 'max-w-[160px]' : 'max-w-[635px]';
  const classNames = type === 'banner' ? 'max-w-[635px] w-full pt-[22.5%]' : 'w-40 h-40';

  return (
    <div className={`pt-2 pr-2 z-10 relative table clear-both ${maxWidthCls} w-full`}>
      {!video && (
        <div className={`relative ${classNames}`}>
          <img src={src} alt={alt} className="z-10 absolute top-0 left-0 w-full h-full object-contain" />
        </div>
      )}
      {!!video && <Video id="video-content" video={video} />}
      <span
        className="right-0 top-0 p-1 z-20 bg-white absolute rounded-full cursor-pointer"
        onClick={handleAssetRemove}
        aria-hidden="true"
      >
        <img src={xImg} alt="Remove" className="z-20" />
      </span>
    </div>
  );
};

AssetPreview.propTypes = {
  asset: PropTypes.shape({
    src: PropTypes.string,
    alt: PropTypes.string,
    video: PropTypes.string,
  }).isRequired,
  handleAssetRemove: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
};
export default AssetPreview;
