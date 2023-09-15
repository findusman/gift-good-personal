import React from 'react';
import { useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { Container } from 'components/layout';
import content from 'data/content.json';
import worldImage from 'assets/images/world.svg';
import checkIcon from 'assets/images/check.svg';

const SuccessStep = () => {
  const { title } = useSelector((state) => {
    return { title: state.success.title };
  });
  return (
    <section
      className="w-screen bg-no-repeat bg-left-overlap-bottom bg-size-190 md:bg-center md:bg-contain md:flex md:justify-center md:items-center"
      style={{ backgroundImage: `url(${worldImage})`, height: 'calc(100vh - 20px)' }}
    >
      <Container className="text-center pt-32 px-10 md:pt-0">
        <Transition appear show enter="transition-opacity duration-1000" enterFrom="opacity-0" enterTo="opacity-100">
          <div className="md:flex justify-center items-center mb-5 md:mb-8.75">
            <div className="flex justify-center items-center w-6 h-6 rounded-full bg-black-soft mx-auto mb-3 md:mb-0 md:mr-3 md:ml-0">
              <img src={checkIcon} alt="" />
            </div>
            <p className="text-lg">
              {title} {content.common.created}
            </p>
          </div>
          <h1 className="text-3.3xl md:text-5xl md:font-light leading-9 mb-5 md:mb-8.75">
            {content.confirmation.thankYou}
          </h1>
        </Transition>
        <Transition
          appear
          show
          enter="transition-opacity duration-1000 delay-1000"
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <p className="text-lg leading-7 mb-5 md:mb-8.75">{content.confirmation.willReviewCampaign}</p>
          <a href="/" className="btn btn-primary inline-block px-8.75">
            {content.confirmation.goToDashboard}
          </a>
        </Transition>
      </Container>
    </section>
  );
};

export default SuccessStep;
