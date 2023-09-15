import React from 'react';
import { useSelector } from 'react-redux';
import { Logo } from 'components/layout';
import Stepper from 'pages/createCampaign/components/Stepper';
import CampaignTitle from 'pages/createCampaign/components/CampaignTitle';

const Header = () => {
  const isSuccess = useSelector((state) => {
    return state.success.isSuccess;
  });
  if (isSuccess) {
    return null;
  }
  return (
    <header className="header 2xl:flex flex-col 2xl:flex-row items-center justify-between 2xl:justify-center 2xl:min-h-[97px] bg-beige">
      <div className="flex justify-center lg:hidden w-full items-center">
        <CampaignTitle />
      </div>
      <div className="relative py-4 2xl:pt-2 2xl:pb-0.5 px-8 min-h-[102px] header flex items-center 2xl:justify-center bg-beige max-w-[1440px] 2xl:w-full">
        <div className="w-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg:top-4.5 lg:left-auto lg:2xl:left-0 lg:transform-none">
          <Logo />
        </div>
        <div className="mb-1 hidden lg:inline pl-[130px]">
          <CampaignTitle />
        </div>
        <div className="w-full">
          <Stepper />
        </div>
      </div>
    </header>
  );
};

export default Header;
