import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import validationCheckmark from 'assets/images/validation-check.svg';
import validationError from 'assets/images/validation-error.svg';

const ValidationError = ({ isValid, message }) => {
  return (
    <div className="flex items-center">
      {isValid ? (
        <img src={validationCheckmark} alt="validation checkmark" />
      ) : (
        <img src={validationError} alt="validation error" width={15} height={15} />
      )}
      <span className={classnames('ml-2 text-xs', { 'text-red-error text-bold': !isValid })}>{message}</span>
    </div>
  );
};

ValidationError.propTypes = {
  isValid: PropTypes.bool,
  message: PropTypes.string,
};

ValidationError.defaultProps = {
  isValid: false,
  message: '',
};

export default ValidationError;
