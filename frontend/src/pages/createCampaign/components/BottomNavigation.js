import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import { createCampaign } from 'store/createCampaign/campaign/campaignSlice';
import { setInitializePayment } from 'store/createCampaign/payment/paymentSlice';
import classnames from 'classnames';

import arrowNextStep from 'assets/images/arrow_button_next.svg';
import content from 'data/content.json';

const BottomNavigation = ({ handleStepChange }) => {
  const { stepData, isPaymentStepValid, payWithCard } = useSelector((state) => {
    return {
      stepData: state.step,
      isPaymentStepValid: state.step.options['4'].isValid,
      payWithCard: state.payment.payWithCard,
    };
  });
  const { active, options: steps } = stepData;
  const dispatch = useDispatch();
  const stepsLength = Object.keys(steps).length;
  const handleCreateCampaign = async () => {
    if (payWithCard) {
      dispatch(setInitializePayment(true));
    } else {
      dispatch(createCampaign());
    }
  };

  return (
    <div className="w-full h-20 z-40 fixed bottom-0 bg-beige-dark flex justify-center items-center">
      <div className="px-5 fixed w-full flex justify-between max-w-[1440px]">
        {active > 1 && (
          <button type="button" className="border border-black px-9 py-3" onClick={() => handleStepChange(active - 1)}>
            {content.common.back}
          </button>
        )}
        {active + 1 <= stepsLength && (
          <button
            type="button"
            className={classnames(
              'px-6 py-3 text-beige-light ml-auto mr-0 flex items-center',
              stepData.options[active].isValid ? 'bg-dark' : 'bg-gray',
            )}
            disabled={!stepData.options[active].isValid}
            onClick={() => handleStepChange(active + 1)}
          >
            {content.bottomNavigation.next}
            <img src={arrowNextStep} className="ml-3" alt="arrow next step" />
          </button>
        )}
        {active === stepsLength && (
          <button
            type="button"
            className={classnames(
              'px-6 py-3 text-beige-light ml-auto mr-0 flex items-center',
              isPaymentStepValid ? 'bg-dark' : 'bg-gray',
            )}
            disabled={!isPaymentStepValid}
            onClick={() => handleCreateCampaign()}
          >
            {content.bottomNavigation.finish}
            <img src={arrowNextStep} className="ml-3" alt="arrow next step" />
          </button>
        )}
      </div>
    </div>
  );
};

BottomNavigation.propTypes = {
  handleStepChange: PropTypes.func.isRequired,
};

export default BottomNavigation;
