import React from 'react';
import PropTypes from 'prop-types';

import { Container } from 'components/layout';

const TopSection = ({ title, content }) => {
  return (
    <section className="py-10 md:py-[8vh] bg-beige-light w-full">
      <Container>
        <div className="flex flex-col justify-center items-center 2xl:items-start">
          <h1 className="font-crimsonpro text-3.3xl mb-4 md:text-5xl" style={{ maxWidth: '1100px' }}>
            {title}
          </h1>
          {!!content && (
            <div className="text-lg" style={{ maxWidth: '1100px' }}>
              {content}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

TopSection.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  content: PropTypes.node,
};

TopSection.defaultProps = {
  content: null,
};

export default TopSection;
