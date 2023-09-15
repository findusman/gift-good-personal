import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import content from 'data/content-auth.json';

const Input = ({ name, label, placeholder, type, error, register }) => {
  return (
    <label htmlFor={name} className="w-full">
      <span className="mt-8 table font-lato text-xs uppercase font-bold tracking-widest">{label}</span>
      <input
        id={name}
        className={classnames('border border-black mt-3 h-12 w-full p-3', {
          'outline-red-error outline-1.5': error,
        })}
        type={type}
        placeholder={placeholder}
        {...register(name, { required: content.common.required })}
      />
    </label>
  );
};

Input.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  error: PropTypes.any.isRequired,
  register: PropTypes.func.isRequired,
};

Input.defaultProps = {
  placeholder: '',
  type: 'text',
};

export default Input;
