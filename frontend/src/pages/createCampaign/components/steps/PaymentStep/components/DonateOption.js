import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { setShouldDonate } from 'store/createCampaign/payment/paymentSlice';
import BaseDialog from 'components/common/BaseDialog';
import checkboxMarker from 'assets/images/check_mark_lg.svg';
import content from 'data/content.json';

const DialogContent = ({ handleClose }) => {
  return (
    <>
      <h2 className="text-2.6xl 2xl:text-4.2xl font-crimsonpro mb-4">{content.paymentStep.donation.title}</h2>
      {content.paymentStep.donation.modalContent.map((el) => (
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

const DonateOption = () => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const dispatch = useDispatch();
  const shouldDonate = useSelector((state) => state.payment.shouldDonate);

  const handleChange = (e) => dispatch(setShouldDonate(e.target.checked));

  return (
    <div className="bg-beige-light p-4 pt-9 mb-4 md:mb-8.75 md:p-8">
      <h2 className="text-1.5xl md:text-2.6xl">{content.paymentStep.donation.title}</h2>
      <hr className="mt-2 mb-6 border border-beige-dark" />
      <p className="text-base md:text-lg mb-9 md:mb-10.5">
        {content.paymentStep.donation.info}
        <button type="button" onClick={() => setIsDialogVisible(true)} className="btn-underline ml-1">
          {content.common.learnMore}
        </button>
      </p>
      <label className="mt-7 mb-5 flex items-start cursor-pointer" htmlFor="donate">
        <input type="checkbox" className="hidden" id="donate" checked={shouldDonate} onChange={handleChange} />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {shouldDonate ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.paymentStep.donation.label}
      </label>
      <BaseDialog
        visible={isDialogVisible}
        handleClose={() => setIsDialogVisible(false)}
        panelContent={<DialogContent handleClose={() => setIsDialogVisible(false)} />}
      />
    </div>
  );
};

export default DonateOption;

DialogContent.propTypes = {
  handleClose: PropTypes.func.isRequired,
};
