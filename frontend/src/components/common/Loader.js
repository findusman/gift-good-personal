import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Transition } from '@headlessui/react';

import { setIsLoading } from 'store/common/app/appSlice';
import logoSvgMobile from 'assets/images/logo_mobile.svg';
import loader from 'assets/images/loader.png';

const Loader = () => {
  const dispatch = useDispatch();
  const { isLoading, duration } = useSelector((state) => ({
    isLoading: state.app.isLoading,
    duration: state.app.duration,
  }));

  useEffect(() => {
    if (duration) {
      setTimeout(() => dispatch(setIsLoading(false)), duration);
    }
  }, [duration]);

  if (!isLoading) {
    return null;
  }

  return (
    <Transition
      show={isLoading}
      enter="transition-opacity duration-100"
      enterFrom="opacity-100"
      enterTo="opacity-100"
      leave="transition-opacity duration-400"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="loader bg-white bg-opacity-90 fixed z-[150] w-full h-full top-0 left-0 flex items-center justify-center">
        <img src={loader} alt="" className="animate-spin w-[120px] h-[120px]" />
        <img src={logoSvgMobile} alt="" className="absolute w-6" />
      </div>
    </Transition>
  );
};

export default Loader;
