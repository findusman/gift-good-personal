import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ValidationError from 'pages/auth/components/form/ValidationError';

const PasswordErrors = ({ errors }) => {
  const passwordErrors = useMemo(() => {
    if (!errors?.message) return [];
    // eslint-disable-next-line dot-notation
    const matches = errors?.types?.['matches'] ?? [];
    const matchesErrors = Array.isArray(matches) ? matches : [matches];

    return [...new Set([errors?.message, ...matchesErrors])];
  }, [errors]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mt-6 mb-6 md:md-4">
      <ValidationError
        isValid={!passwordErrors.includes('atLeast8Characters') && !passwordErrors.includes('required')}
        message="At least 8 characters long"
      />
      <ValidationError isValid={!passwordErrors.includes('atLeast1Number')} message="Contains a number" />
      <ValidationError isValid={!passwordErrors.includes('atLeast1LowerCase')} message="Contains a lowercase letter" />
      <ValidationError isValid={!passwordErrors.includes('atLeast1UpperCase')} message="Contains an uppercase letter" />
    </div>
  );
};

PasswordErrors.propTypes = {
  errors: PropTypes.shape({
    message: PropTypes.string,
    types: PropTypes.shape({
      matches: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    }),
  }).isRequired,
};

export default PasswordErrors;
