import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Input = ({ name, register, error, label, type, inputValue, ...rest }) => {
  return (
    <div className="mb-2 h-16 relative">
      <label htmlFor={name} className="text-xs font-bold uppercase mb-1 md:hidden">
        {label}
      </label>
      <input
        className={classnames('md:w-48 md:h-11 outline p-2.5 text-sm md:text-xs mb-1 flex w-full md:pt-6', {
          'outline-red-error outline-1.5': error.message,
          'outline-black outline-1.5': inputValue && !error.message,
          'outline-gray outline-1': !error.message && !inputValue,
          'text-gray': !inputValue && type !== 'text',
          'focus:outline-1.5 focus:outline-black hover:outline-1.5 hover:outline-black active:outline-1.5 active:outline-black':
            !error.message,
        })}
        type={type}
        {...register(name)}
        {...rest}
      />
      <span
        className={classnames('text-gray hidden md:flex', {
          'floating-label': type === 'text' && inputValue === '',
          'floating-label-small': (type === 'text' && inputValue) || type !== 'text',
        })}
      >
        {label}
      </span>
      <p className="text-xs text-red-error">{error?.message}</p>
    </div>
  );
};

Input.propTypes = {
  name: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  inputValue: PropTypes.string,
};

Input.defaultProps = {
  type: 'text',
  error: {},
  inputValue: '',
};

export default Input;
