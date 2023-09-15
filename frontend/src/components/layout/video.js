/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import playButton from 'assets/images/play_button.svg';

const Video = ({ id, video, containerClassName }) => {
  const vid = document.getElementById(id);
  const [paused, setPaused] = useState(true);

  const onPlayButtonClick = () => {
    if (paused) {
      vid.play();
      setPaused(false);
    }
  };

  return (
    <div className={classnames(`relative ${containerClassName}`)}>
      <video id={id} controls={!paused} preload="metadata" poster={`${video}#t=0.001`} src={`${video}#t=0.001`} />
      <button
        type="button"
        className={classnames(`${vid?.paused ? 'block' : 'hidden'}`)}
        onClick={() => onPlayButtonClick()}
      >
        <img
          className={classnames(`absolute top-0 bottom-0 right-0 left-0 m-auto ${paused ? 'block' : 'hidden'}`)}
          src={playButton}
          alt="play button"
        />
      </button>
    </div>
  );
};

Video.propTypes = {
  id: PropTypes.string.isRequired,
  video: PropTypes.string.isRequired,
  containerClassName: PropTypes.string,
};

Video.defaultProps = {
  containerClassName: '',
};

export default Video;
