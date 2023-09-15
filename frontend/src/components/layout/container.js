import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const Container = ({ className, children }) => (
  <div className={classnames('px-8 mx-auto md:max-w-[1174px]', className)}>{children}</div>
);

Container.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Container.defaultProps = {
  className: '',
};

export default Container;
