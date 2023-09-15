import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { updateCampaignExpiration } from 'store/createCampaign/recipient/recipientSlice';
import content from 'data/content.json';
import arrowSelect from 'assets/images/arrow_select.svg';

const CampaignExpiration = () => {
  const dispatch = useDispatch();
  const campaignExpiration = useSelector((state) => state.recipient.campaignExpiration);
  const handleOnChange = (event) => {
    dispatch(updateCampaignExpiration(event.target.value));
  };

  return (
    <div className="flex flex-col justify-start items-start">
      <h3 className="mt-10 md:mt-12 text-lg md:text-1.5xl font-bold font-lato">
        {content.recipientsStep.manageRecipients.campaignExpirationTitle}
      </h3>
      <p className="mt-2 md:text-lg">{content.recipientsStep.manageRecipients.campaignExpirationDescription}</p>
      <p className="mt-7 text-xs font-bold uppercase">
        {content.recipientsStep.manageRecipients.campaignExpirationMonths}
      </p>
      <select
        className="border border-black mt-4 mb-13 p-2.5 w-64"
        defaultValue={campaignExpiration.selected}
        onChange={handleOnChange}
        style={{
          minWidth: '109px',
          appearance: 'none',
          backgroundImage: `url(${arrowSelect})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {campaignExpiration.options.map((option) => (
          <option value={option.key} key={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CampaignExpiration;
