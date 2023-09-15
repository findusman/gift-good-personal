import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import {
  setPaymentLearnMoreVisibility,
  getUserBalance,
  setUseCredits,
  setAmountToPay,
  setPayWithCard,
} from 'store/createCampaign/payment/paymentSlice';
import { setStepValidity } from 'store/createCampaign/step/stepSlice';
import createPaymentIntent from 'helpers/createPaymentIntent';
import steps from 'helpers/steps';
import TopSection from 'components/common/TopSection';
import content from 'data/content.json';
import checkboxMarker from 'assets/images/check_mark_lg.svg';
import BaseDialog from 'components/common/BaseDialog';
import Totals from './components/Totals';
import PaymentMethods from './components/PaymentMethods';
import DonateOption from './components/DonateOption';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);
const TopSectionContent = () => {
  const dispatch = useDispatch();
  const handleLearnMoreClick = () => {
    dispatch(setPaymentLearnMoreVisibility(true));
  };

  return (
    <div className="flex flex-col 2xl:flex-row justify-center items-center">
      <p className="text-center 2xl:text-1.5xl">{content.learnMore.payment.messages.paymentDescription}</p>
      <button type="button" className="btn-underline mt-3 2xl:ml-4 2xl:mb-2.5" onClick={handleLearnMoreClick}>
        {content.common.learnMore}
      </button>
    </div>
  );
};
const DialogContent = ({ handleClose }) => {
  return (
    <>
      <h2 className="text-2.6xl 2xl:text-4.2xl font-crimsonpro mb-4">{content.paymentStep.paymentMethods.credits}</h2>
      {content.paymentStep.paymentMethods.creditsModalContent.map((el) => (
        <p key={el.id} className="mt-4 text-base">
          {el.text}
        </p>
      ))}
      <button type="button" className="btn-primary mt-13" onClick={() => handleClose()} tabIndex="-1">
        {content.common.done}
      </button>
    </>
  );
};
const PaymentStep = () => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const { userBalance, collectionPrice, numberOfRecipients, amountToPay, useCredits, payWithCard, isCardPaymentValid } =
    useSelector((state) => {
      const { payment, collection, recipient } = state;

      return {
        userBalance: payment.balance.value,
        amountToPay: payment.amountToPay,
        useCredits: payment.useCredits,
        collectionPrice: collection.currentCollection.price,
        numberOfRecipients: recipient?.recipients?.length,
        payWithCard: payment.payWithCard,
        isCardPaymentValid: payment.isCardPaymentValid,
      };
    });
  const dispatch = useDispatch();
  const totalAmount = collectionPrice * numberOfRecipients;
  const formattedUserBalance = Math.floor(userBalance).toLocaleString('en-US');
  const useCreditsLabel =
    totalAmount > userBalance
      ? `Use ${formattedUserBalance} available credits`
      : `Use ${totalAmount} of ${formattedUserBalance} available credits`;

  useEffect(() => {
    dispatch(setAmountToPay(totalAmount));
    dispatch(getUserBalance());
  }, []);
  useEffect(() => {
    if (useCredits) {
      const totals = userBalance < amountToPay ? amountToPay - userBalance : 0;
      dispatch(setAmountToPay(totals));
    } else {
      dispatch(setAmountToPay(collectionPrice * numberOfRecipients));
    }
  }, [useCredits]);
  useEffect(() => {
    const needToPayWithCard = amountToPay > 0;

    dispatch(setPayWithCard(needToPayWithCard));

    if (needToPayWithCard) {
      createPaymentIntent(amountToPay).then(setClientSecret);
    }
  }, [amountToPay]);
  useEffect(() => {
    dispatch(
      setStepValidity({ key: steps.PAYMENT, isValid: amountToPay === 0 || (payWithCard && isCardPaymentValid) }),
    );
  }, [clientSecret, amountToPay, isCardPaymentValid]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUseCreditsChange = (e) => dispatch(setUseCredits(e.target.checked));

  return (
    <>
      <TopSection title="Payment" content={<TopSectionContent />} />
      <section
        className="mb-12 mx-auto mt-4 md:mt-14 flex flex-col md:flex-row md:justify-between md:items-start"
        style={{ maxWidth: '1100px' }}
      >
        <div className="col-span-2 mb-4 md:mr-9 md:w-full">
          <div className="bg-beige-light p-4 pt-9 mb-4 md:mb-8.75 md:p-8">
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentMethods clientSecret={clientSecret} />
              </Elements>
            )}
            {userBalance > 0 && (
              <div className="mt-16">
                <h2 className="text-1.5xl md:text-2.6xl">{content.paymentStep.paymentMethods.credits}</h2>
                <hr className="mt-2 mb-6 border border-beige-dark" />
                <p className="text-base md:text-lg">{content.paymentStep.paymentMethods.useCredits}</p>
                <div className="mt-7 flex flex-col items-start md:flex-row md:items-center md:justify-start">
                  <label className="flex items-start cursor-pointer" htmlFor="useCredits">
                    <input
                      type="checkbox"
                      className="hidden"
                      id="useCredits"
                      checked={useCredits}
                      onChange={handleUseCreditsChange}
                    />
                    <div className="w-6 h-6 border border-black mr-2 inline-block">
                      {useCredits ? <img src={checkboxMarker} alt="checkbox" /> : null}
                    </div>
                    {useCreditsLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDialogVisible(true)}
                    className="btn-underline ml-8 md:ml-3 mt-2 md:mt-0.5"
                  >
                    {content.common.learnMore}
                  </button>
                </div>
                <BaseDialog
                  visible={isDialogVisible}
                  handleClose={() => setIsDialogVisible(false)}
                  panelContent={<DialogContent handleClose={() => setIsDialogVisible(false)} />}
                />
              </div>
            )}
          </div>
          <DonateOption />
        </div>
        <Totals
          collectionPrice={collectionPrice}
          numberOfRecipients={numberOfRecipients}
          amountToPay={amountToPay}
          userBalance={userBalance}
          useCredits={useCredits}
        />
      </section>
    </>
  );
};

export default PaymentStep;

DialogContent.propTypes = {
  handleClose: PropTypes.func.isRequired,
};
