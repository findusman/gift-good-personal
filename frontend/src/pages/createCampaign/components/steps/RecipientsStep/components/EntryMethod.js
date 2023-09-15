import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';

import {
  setRecipientsDialogVisibility,
  setDateDialogVisibility,
  setEntryMethod,
  storeRecipients,
  setDefaultDateAndTime,
} from 'store/createCampaign/recipient/recipientSlice';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content.json';
import t from 'helpers/localization';
import checkMark from 'assets/images/check_mark.svg';
import MethodDivider from './MethodDivider';

const SelectMethod = ({ methods }) => {
  const dispatch = useDispatch();
  const handleClick = async (pickedMethod) => {
    await dispatch(setEntryMethod(pickedMethod.key));

    if (pickedMethod.useFileUpload) {
      dispatch(setDateDialogVisibility(true));
    } else {
      dispatch(setRecipientsDialogVisibility(true));
    }
  };

  return (
    <ul>
      {methods.map((method, idx) => (
        <li key={method.key}>
          <div className="flex flex-col justify-start items-start">
            <MethodDivider index={idx} len={methods.length} />
            {method.key === 'upload' ? (
              <>
                <p className="text-lg font-bold mb-3 mt-8">{content.recipientsStep.addRecipients.uploadOption.title}</p>
                <span className="text-lg">
                  {content.recipientsStep.addRecipients.uploadOption.descriptionPartOne}
                  <a
                    href="/resources/csv/GIFTforward_gift_recipient_template.csv"
                    download
                    className="btn-underline md:text-lg"
                  >
                    {content.common.downloadTemplate}
                  </a>
                  {content.recipientsStep.addRecipients.uploadOption.descriptionPartTwo}
                </span>
              </>
            ) : (
              <>
                <p className="text-lg font-bold mb-3 mt-8">{content.recipientsStep.addRecipients.manualOption.title}</p>
                <span>{content.recipientsStep.addRecipients.manualOption.description}</span>
              </>
            )}
            <button type="button" className="py-2 px-4 mt-5 border border-black" onClick={() => handleClick(method)}>
              {method.text}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

SelectMethod.propTypes = {
  methods: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      text: PropTypes.string,
    }),
  ).isRequired,
};

const EntryMethod = ({ entryMethodFulfilled, isEdition }) => {
  const dispatch = useDispatch();
  const [dialog, showDialog] = useState(false);
  const { isAdmin, distributionMethod, entryMethods, activeEntryMethod } = useSelector((state) => ({
    isAdmin: state.app.isAdmin,
    distributionMethod: !!state.recipient.distributionMethod.selected,
    entryMethods: state.recipient.entryMethod.options,
    activeEntryMethod: state.recipient.entryMethod.selected,
  }));
  const handleApprove = () => {
    dispatch(setEntryMethod(''));
    dispatch(storeRecipients([]));
    dispatch(setDefaultDateAndTime({ date: '', time: '' }));
  };
  const supportDistributionCheck = isAdmin ? distributionMethod : true;
  let message = content.recipientsStep.entryMethodMessage.fileMethod;

  if (activeEntryMethod === 'manual') {
    message = content.recipientsStep.entryMethodMessage.fileMethod;
  }

  const containerClasses = classnames('mx-auto', {
    'p-5 md:p-10 mx-auto mt-12 bg-beige-light': !isEdition,
    'mb-5': isEdition,
  });

  return (
    <section className={containerClasses} style={{ maxWidth: '1192px' }}>
      {!isEdition && (
        <h2 className="text-1.5xl md:text-2.6xl pb-2 border-b border-beige-dark">
          {t('recipientsStep.addRecipients.addRecipientsSectionHeading', {
            key: 'counter',
            replacement: isAdmin ? 2 : 1,
          })}
        </h2>
      )}
      {!entryMethodFulfilled && supportDistributionCheck && <SelectMethod methods={entryMethods} />}
      {entryMethodFulfilled && supportDistributionCheck && (
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

EntryMethod.propTypes = {
  entryMethodFulfilled: PropTypes.bool.isRequired,
  isEdition: PropTypes.bool,
};

EntryMethod.defaultProps = {
  isEdition: false,
};

export default EntryMethod;
