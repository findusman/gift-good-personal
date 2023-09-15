import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  setDistributionMethod,
  setEntryMethod,
  storeRecipients,
  setDefaultDateAndTime,
} from 'store/createCampaign/recipient/recipientSlice';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content.json';
import checkMark from 'assets/images/check_mark.svg';
import MethodDivider from './MethodDivider';

const SelectMethod = () => {
  const methods = useSelector((state) => state.recipient.distributionMethod.options);
  const dispatch = useDispatch();
  const handleClick = (pickedMethod) => {
    dispatch(setDistributionMethod(pickedMethod.key));
  };

  return (
    <ul>
      {methods.map((method, idx) => (
        <li key={method.key}>
          <div className="flex flex-col justify-start items-start">
            <MethodDivider index={idx} len={methods.length} />
            <button type="button" className="py-2 px-4 mt-5 border border-black" onClick={() => handleClick(method)}>
              {method.text}
            </button>
            <p className="py-5 text-lg">{method.description}</p>
            {!!method.note && <p className="pb-5 my-[-20px] text-lg">{method.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
};

const DistributionMethod = () => {
  const dispatch = useDispatch();
  const [dialog, showDialog] = useState(false);
  const methodSelected = useSelector((state) => state.recipient.distributionMethod.selected);
  const isMethodSelected = !!methodSelected;
  const handleApprove = () => {
    dispatch(setDistributionMethod(''));
    dispatch(setEntryMethod(''));
    dispatch(storeRecipients([]));
    dispatch(setDefaultDateAndTime({ date: '', time: '' }));
  };
  const message =
    methodSelected === 'gfg'
      ? content.recipientsStep.distribution.gfg.title
      : content.recipientsStep.distribution.self.title;

  return (
    <section className="p-5 md:p-10 mx-auto mt-12 bg-beige-light" style={{ maxWidth: '1192px' }}>
      <h2 className="text-1.5xl md:text-2.6xl pb-2 border-b border-beige-dark">
        {content.recipientsStep.distribution.title}
      </h2>
      <p className="text-lg font-bold mb-3 mt-8">{content.recipientsStep.distribution.subtitle}</p>
      {!isMethodSelected && <SelectMethod />}
      {isMethodSelected && (
        <div className="flex py-5">
          <img src={checkMark} className="mr-4 bg-beige-dark rounded-full px-1" alt="check mark" />
          <p>{message}</p>
          <button type="button" className="btn-underline ml-4" onClick={() => showDialog(true)}>
            {content.common.change}
          </button>
        </div>
      )}
      {dialog && (
        <ConfirmationDialog
          isOpen={dialog}
          title={content.recipientsStep.distribution.confirmationDialog.title}
          content={content.recipientsStep.distribution.confirmationDialog.content}
          showDialog={showDialog}
          handleApprove={handleApprove}
        />
      )}
    </section>
  );
};

export default DistributionMethod;
