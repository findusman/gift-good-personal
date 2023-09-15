import React from 'react';
import PropTypes from 'prop-types';

import line from 'assets/images/line.svg';
import content from 'data/content.json';

const MethodDivider = ({ index, len }) => {
  if (index !== 0 && index + 1 <= len) {
    return (
      <span className="mb-3 mt-10 flex text-base 2xl:text-lg font-bold">
        <img src={line} className="mr-2.5" alt="line" />
        {content.common.or}
        <img src={line} className="ml-2.5" alt="line" />
      </span>
    );
  }

  return null;
};

MethodDivider.propTypes = {
  index: PropTypes.number.isRequired,
  len: PropTypes.number.isRequired,
};

export default MethodDivider;
