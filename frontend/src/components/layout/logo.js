import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import logoSvg from 'assets/images/logo.svg';

const Logo = ({ center }) => (
  <div
    className={classnames('lg:mr-14 lg:top-4.5 shrink-0', {
      'lg:mr-0': center,
    })}
  >
    <picture>
      <img className="mb-1 lg:w-[107px] lg:h-[107px]" src={logoSvg} alt="Gifts for Good" />
    </picture>
  </div>
);

Logo.propTypes = {
  center: PropTypes.bool,
};

Logo.defaultProps = {
  center: false,
};

export default Logo;
