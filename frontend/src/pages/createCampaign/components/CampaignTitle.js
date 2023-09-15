import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setCampaignDialogVisibility } from 'store/createCampaign/campaign/campaignSlice';
import content from 'data/content.json';

const CampaignTitle = () => {
  const dispatch = useDispatch();
  const { title, initialized, isSuccess } = useSelector((state) => ({
    title: state.campaign.title,
    initialized: state.campaign.initialized,
    isSuccess: state.success.isSuccess,
  }));
  const handleClick = () => {
    if (!initialized) {
      return;
    }

    dispatch(setCampaignDialogVisibility(true));
  };

  if (isSuccess) {
    return null;
  }

  return (
    <button
      className="lg:mr-11 text-center lg:text-left shrink-0 bg-dark lg:bg-inherit h-20 lg:h-auto w-full"
      type="button"
      style={{ minWidth: '164px' }}
      onClick={handleClick}
    >
      <p className="text-xs tracking-wider uppercase hidden lg:inline">{content.header.campaignTitleLabel}</p>
      <strong className="min-h-[26px] block mt-12 mb-1.5 lg:mt-0 lg:mb-0 font-lato font-normal lg:font-bold text-white lg:text-black">
        {title}
      </strong>
    </button>
  );
};

export default CampaignTitle;
