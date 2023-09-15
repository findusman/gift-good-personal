import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { setIsCardPaymentValid, setInitializePayment, payWithStripe } from 'store/createCampaign/payment/paymentSlice';
import classnames from 'classnames';

import { createCampaign } from 'store/createCampaign/campaign/campaignSlice';
import { setError } from 'store/common/error/errorSlice';
import BaseDialog from 'components/common/BaseDialog';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content.json';
import addMarker from 'assets/images/add_marker.svg';
import checkMarkGreen from 'assets/images/check_mark_green.svg';
import visaIcon from 'assets/images/visa_icon.svg';
import americanExpressIcon from 'assets/images/american_express_icon.svg';
import masterCardIcon from 'assets/images/master_card_icon.svg';

const PaymentMethods = ({ clientSecret }) => {
  const [cardElement, setCardElement] = useState(null);
  const [dialog, showDialog] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [cardErrors, setCardErrors] = useState([]);
  const [isCardSet, setIsCardSet] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [brand, setBrand] = useState('');
  const [brandIcon, setBrandIcon] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  const { initializePayment, amountToPay, paymentError, paymentStatus, isCardPaymentValid } = useSelector((state) => ({
    initializePayment: state.payment.initializePayment,
    amountToPay: state.payment.amountToPay,
    paymentError: state.payment.payment.error,
    paymentStatus: state.payment.payment.status,
    isCardPaymentValid: state.payment.isCardPaymentValid,
  }));
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const { getValues, register, setValue } = useForm();
  const createCampaignWithCardPayment = () => {
    if (!stripe || !elements) {
      return;
    }

    const additionalData = getValues();
    const billingData = additionalData
      ? { address: { postal_code: additionalData.zip }, name: additionalData.name }
      : {};
    dispatch(
      payWithStripe({ stripe, card: elements.getElement(CardNumberElement), amountToPay, clientSecret, billingData }),
    );
  };
  const cardInputs = elements && [
    elements.getElement(CardNumberElement),
    elements.getElement(CardExpiryElement),
    elements.getElement(CardCvcElement),
  ];
  const cardInputsValid = () => {
    // eslint-disable-next-line no-underscore-dangle
    return cardInputs && !cardInputs.find((input) => !input || input._invalid || input._empty);
  };
  const closePaymentModal = ({ forceClosing }) => {
    if (forceClosing && formTouched) {
      showDialog(true);
      return;
    }

    setIsCardSet(isValid);
    setIsDialogVisible(!(isValid || forceClosing));
  };
  const methodIcon = isCardPaymentValid ? checkMarkGreen : addMarker;
  const paymentMethodContent = isCardPaymentValid
    ? content.paymentStep.paymentMethods.editButton
    : content.paymentStep.paymentMethods.addButton;
  const dialogTitle = isCardPaymentValid
    ? content.paymentStep.addPaymentMethodModal.editTitle
    : content.paymentStep.addPaymentMethodModal.title;
  const handleApprove = () => {
    cardInputs.forEach((input) => input.clear());
    setIsCardSet(false);
    setCardErrors([]);
    setIsDialogVisible(false);
    setBrand('');
    setBrandIcon('');
  };
  const handleChange = (element) => {
    const errors = [...cardErrors];
    const { elementType, error, complete } = element;
    const relatedError = errors?.find((err) => err.elementType === elementType);

    setFormTouched(true);
    if (!complete) {
      setIsValid(false);
    }

    if (elementType === 'cardNumber' && complete) {
      const { brand: cardBrand } = element;
      const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

      if (cardBrand === 'visa') setBrandIcon(visaIcon);
      else if (cardBrand === 'mastercard') setBrandIcon(masterCardIcon);
      else if (cardBrand === 'amex') setBrandIcon(americanExpressIcon);
      else setBrandIcon('');

      setBrand(capitalizeFirstLetter(cardBrand));
    }

    if (error) {
      if (relatedError) {
        errors[errors.findIndex((el) => el.elementType === elementType)] = {
          elementType,
          message: error.message,
        };
      } else {
        errors.push({
          elementType,
          message: error.message,
        });
      }
    } else if (relatedError) {
      errors.splice(
        errors.findIndex((el) => el.elementType === elementType),
        1,
      );
    }

    setCardErrors(errors);
  };

  useEffect(() => {
    if (initializePayment) {
      createCampaignWithCardPayment();
    }
  }, [initializePayment]);

  useEffect(() => {
    dispatch(setInitializePayment(false));
  }, []);

  useEffect(() => {
    dispatch(setIsCardPaymentValid(isCardSet));
  }, [isCardSet]);

  useEffect(() => {
    if (paymentStatus === 'rejected') {
      dispatch(
        setError({
          title: content.errors.paymentError,
          content: paymentError,
        }),
      );
    } else if (paymentStatus === 'succeeded') {
      dispatch(createCampaign());
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (isDialogVisible) {
      const valid = cardInputsValid();
      setIsValid(isValid);

      if (valid) {
        setFormTouched(false);
      }

      cardElement?.focus();
    } else {
      setFormTouched(false);
    }
  }, [isDialogVisible]);

  useEffect(() => {
    setIsValid(cardInputsValid());
  }, [cardErrors]);

  return (
    <section>
      <h2 className="text-1.5xl md:text-2.6xl">{content.paymentStep.paymentMethods.addPaymentMethod}</h2>
      <hr className="mt-2 mb-6 border border-beige-dark" />
      {isCardSet && brand ? (
        <div className="flex items-center">
          <img src={methodIcon} className="mr-2.5" alt="Payment method" />
          <p>Selected payment method: </p>
          {brandIcon.length > 0 && (
            <img src={brandIcon} className="w-[21px] h-[14px] md:w-auto md:h-auto ml-2" alt="Payment Method Icon" />
          )}
          <p className="ml-2">{brand}</p>
        </div>
      ) : null}
      <button type="button" className="flex items-center mt-4" onClick={() => setIsDialogVisible(true)}>
        {!isCardSet ? <img src={methodIcon} className="mr-2.5" alt="Payment method" /> : null}
        <p className="btn-underline">{paymentMethodContent}</p>
      </button>
      <BaseDialog
        visible={isDialogVisible}
        unmount={false}
        handleClose={() => closePaymentModal({ forceClosing: true })}
        panelContent={
          <>
            <h3 className="text-2.6xl md:text-4.2xl">{dialogTitle}</h3>
            <p className="mt-8">{content.paymentStep.addPaymentMethodModal.description}</p>
            <p className="text-xs font-bold uppercase mt-8 mb-2">
              {content.paymentStep.addPaymentMethodModal.cardInfo}
            </p>
            <form className="relative pb-18">
              <button
                type="button"
                className={classnames('btn-primary absolute bottom-0', isValid ? 'bg-dark' : 'bg-gray')}
                onClick={() => closePaymentModal({ forceClosing: false })}
                disabled={!isValid}
              >
                {content.common.done}
              </button>
              <div className="border border-black py-2.5 px-4 mb-4 flex items-center justify-between md:max-w-[490px]">
                <CardNumberElement className="w-40 text-sm" onReady={setCardElement} onChange={handleChange} />
                <div className="flex">
                  <img src={visaIcon} className="w-[21px] h-[14px] md:w-auto md:h-auto" alt="card Icon" />
                  <img
                    src={americanExpressIcon}
                    className="mx-2 w-[21px] h-[14px] md:w-auto md:h-auto"
                    alt="card Icon"
                  />
                  <img src={masterCardIcon} className="w-[21px] h-[14px] md:w-auto md:h-auto" alt="card Icon" />
                </div>
              </div>
              <div className="flex justify-between md:max-w-[490px]">
                <div className="border border-black py-2.5 px-4 mr-3 w-full md:min-w-[260px]">
                  <CardExpiryElement className="text-sm" onChange={handleChange} />
                </div>
                <div className="border border-black py-2.5 px-4 w-full">
                  <CardCvcElement className="text-sm" onChange={handleChange} />
                </div>
              </div>
              <label htmlFor="name" className="block mt-8 text-xs font-bold uppercase">
                {content.paymentStep.addPaymentMethodModal.nameOnCard}
                <input
                  {...register('name')}
                  type="text"
                  className="block border py-2 px-4 rounded-none focus:outline-none min-w-[260px] mt-1 text-sm font-normal"
                />
              </label>
              <label htmlFor="zip" className="block mt-8 text-xs font-bold uppercase">
                {content.paymentStep.addPaymentMethodModal.zip}
                <input
                  {...register('zip')}
                  maxLength="5"
                  onChange={(event) => {
                    const {
                      target: { value },
                    } = event;
                    setValue('zip', value.replace(/[^\d]/, ''));
                  }}
                  className="block border py-2 px-4 rounded-none focus:outline-none min-w-[260px] mt-1 text-sm font-normal"
                />
              </label>
              {!!cardErrors?.length &&
                cardErrors.map((error) => (
                  <p className="text-red-error mt-2" key={error.elementType}>
                    {error.message}
                  </p>
                ))}
            </form>
            {dialog && (
              <ConfirmationDialog
                isOpen={dialog}
                title={content.paymentStep.clearPaymentDetailsConfirmation.title}
                content={content.paymentStep.clearPaymentDetailsConfirmation.content}
                confirmText={content.paymentStep.clearPaymentDetailsConfirmation.confirmText}
                cancelText={content.paymentStep.clearPaymentDetailsConfirmation.cancelText}
                showDialog={showDialog}
                handleApprove={handleApprove}
              />
            )}
          </>
        }
      />
    </section>
  );
};

export default PaymentMethods;

PaymentMethods.propTypes = {
  clientSecret: PropTypes.string,
};

PaymentMethods.defaultProps = {
  clientSecret: '',
};
