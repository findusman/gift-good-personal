import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';

import { setRecipientsDialogVisibility } from 'store/createCampaign/recipient/recipientSlice';
import content from 'data/content.json';
import t from 'helpers/localization';
import CampaignExpiration from './CampaignExpiration';

const ManageRecipients = ({ entryMethodFulfilled, isEdition }) => {
  const dispatch = useDispatch();
  const { isAdmin, recipients } = useSelector((state) => ({
    isAdmin: state.app.isAdmin,
    recipients: state.recipient.recipients,
  }));
  const handleEdit = () => {
    dispatch(setRecipientsDialogVisibility(true));
  };
  const recipientCount = () => {
    if (recipients.length === 1) {
      return `${recipients.length} ${content.recipientsStep.manageRecipients.recipientsAddedSingular}`;
    }

    return `${recipients.length} ${content.recipientsStep.manageRecipients.recipientsAdded}`;
  };

  const containerClasses = classnames('mx-auto', {
    'p-5 md:p-10 mx-auto mt-12 bg-beige-light': !isEdition,
    'mb-5': isEdition,
  });

  return (
    <section className={containerClasses} style={{ maxWidth: '1192px' }}>
      {!isEdition && (
        <h2 className="text-1.5xl md:text-2.6xl pb-2 mb-2 border-b border-beige-dark">
          {t('recipientsStep.manageRecipients.manageRecipientsSectionHeading', {
            key: 'counter',
            replacement: isAdmin ? 3 : 2,
          })}
        </h2>
      )}
      {entryMethodFulfilled && (
        <div className="flex flex-col justify-start items-start">
          <p className="mt-6 md:mt-4 md:text-lg">{content.recipientsStep.manageRecipients.description}</p>
          <h3 className="mt-10 md:mt-12 mb-2 font-lato font-black text-lg md:text-1.5xl">
            {content.recipientsStep.manageRecipients.recipients}
          </h3>
          <p className="md:text-lg">{recipientCount()}</p>
          <button type="button" className="btn-underline mt-2.5 md:text-lg" onClick={handleEdit}>
            {content.recipientsStep.manageRecipients.editRecipients}
          </button>
          {!isEdition && <CampaignExpiration />}
        </div>
      )}
    </section>
  );
};

ManageRecipients.propTypes = {
  entryMethodFulfilled: PropTypes.bool.isRequired,
  isEdition: PropTypes.bool,
};

ManageRecipients.defaultProps = {
  isEdition: false,
};

export default ManageRecipients;
