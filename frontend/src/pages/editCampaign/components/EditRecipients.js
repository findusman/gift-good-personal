import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addRecipients, setDistributionMethod } from 'store/createCampaign/recipient/recipientSlice';
import EntryMethod from 'pages/createCampaign/components/steps/RecipientsStep/components/EntryMethod';
import ManageRecipients from 'pages/createCampaign/components/steps/RecipientsStep/components/ManageRecipients';
import RecipientsFileImport from 'pages/createCampaign/components/steps/RecipientsStep/components/RecipientsFileImport';
import RecipientsDialog from 'pages/createCampaign/components/steps/RecipientsStep/components/RecipientsDialog';
import ConfirmationDialog from 'components/common/ConfirmationDialog';

const EditRecipients = () => {
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const dispatch = useDispatch();
  const { activeEntryMethod, recipients, campaignData } = useSelector((state) => ({
    activeEntryMethod: state.recipient.entryMethod.selected,
    recipients: state.recipient.recipients,
    campaignData: state.campaign.data,
  }));
  const entryMethodFulfilled = !!(activeEntryMethod && recipients.length);

  useEffect(() => {
    dispatch(setDistributionMethod(campaignData.noEmailInvite ? 'self' : 'gfg'));
  }, [campaignData]);

  const handleSave = () => {
    setIsConfirmationVisible(true);
  };

  if (campaignData.allowMultipleRedemptions) {
    return null;
  }

  return (
    <div>
      <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">Add New Contacts</h3>
      <EntryMethod entryMethodFulfilled={entryMethodFulfilled} isEdition />
      <ManageRecipients entryMethodFulfilled={entryMethodFulfilled} isEdition />
      <RecipientsFileImport />
      <RecipientsDialog />
      {recipients.length ? (
        <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
          Add contacts
        </button>
      ) : null}
      {isConfirmationVisible && (
        <ConfirmationDialog
          isOpen={isConfirmationVisible}
          title="Add contacts to campaign"
          content="Please confirm you want to make changes to this campaign. Your changes will reflect instantly on any live campaign."
          showDialog={setIsConfirmationVisible}
          handleApprove={() => dispatch(addRecipients(recipients))}
        />
      )}
    </div>
  );
};

export default EditRecipients;
