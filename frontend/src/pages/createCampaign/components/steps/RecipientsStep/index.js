import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setRecipientLearnMoreVisibility } from 'store/createCampaign/recipient/recipientSlice';
import { setStepValidity } from 'store/createCampaign/step/stepSlice';
import steps from 'helpers/steps';
import TopSection from 'components/common/TopSection';
import content from 'data/content.json';
import DistributionMethod from './components/DistributionMethod';
import EntryMethod from './components/EntryMethod';
import ManageRecipients from './components/ManageRecipients';
import RecipientsDialog from './components/RecipientsDialog';
import RecipientsFileImport from './components/RecipientsFileImport';

const TopSectionContent = () => {
  const dispatch = useDispatch();
  const handleLearnMoreClick = () => {
    dispatch(setRecipientLearnMoreVisibility(true));
  };

  return (
    <div className="flex flex-col 2xl:flex-row justify-center items-center">
      <p className="text-center 2xl:text-1.5xl">{content.recipientsStep.description}</p>
      <button type="button" className="btn-underline mt-3 2xl:ml-4 2xl:mb-2.5" onClick={handleLearnMoreClick}>
        {content.common.learnMore}
      </button>
    </div>
  );
};

const RecipientsStep = () => {
  const dispatch = useDispatch();
  const { isAdmin, distributionSelected, activeEntryMethod, recipients } = useSelector((state) => ({
    isAdmin: state.app.isAdmin,
    distributionSelected: state.recipient.distributionMethod.selected,
    activeEntryMethod: state.recipient.entryMethod.selected,
    recipients: state.recipient.recipients,
  }));
  const entryMethodFulfilled = !!(activeEntryMethod && recipients.length);

  useEffect(() => {
    dispatch(
      setStepValidity({ key: steps.RECIPIENTS, isValid: entryMethodFulfilled && (distributionSelected || !isAdmin) }),
    );
  }, [entryMethodFulfilled]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <TopSection title="Recipients" content={<TopSectionContent />} />
      {isAdmin && <DistributionMethod />}
      <EntryMethod entryMethodFulfilled={entryMethodFulfilled} />
      <ManageRecipients entryMethodFulfilled={entryMethodFulfilled} />
      <RecipientsFileImport />
      <RecipientsDialog />
    </>
  );
};

export default RecipientsStep;
