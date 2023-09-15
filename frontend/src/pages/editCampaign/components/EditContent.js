import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { updateCampaignContent } from 'store/editCampaign/campaign/campaignSlice';
import Editor from 'components/common/editor';
import SmartTagsDialog from 'pages/createCampaign/components/steps/DesignStep/components/SmartTagsDialog';
import LibraryDialog from 'pages/createCampaign/components/steps/DesignStep/components/LibraryDialog';
import content from 'data/content.json';
import MediaUpload from 'pages/createCampaign/components/steps/DesignStep/components/MediaUpload';
import ConfirmationDialog from 'components/common/ConfirmationDialog';

const EditContent = () => {
  const [library, setLibrary] = useState({ dialogVisible: false });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [activeType, setActiveType] = useState('');
  const dispatch = useDispatch();
  const { campaignData, formData } = useSelector((state) => ({
    campaignData: state.campaign.data,
    isEditionInitialized: state.design.isEditionInitialized,
    formData: state.design.formData,
  }));
  const { register, setValue, trigger, watch, reset } = useForm({
    mode: 'onChange',
    defaultValues: { ...campaignData },
  });

  const handleContentUpdate = (type) => {
    setIsConfirmationVisible(true);
    setActiveType(type);
  };

  const checkIfFieldIsEmpty = (value) => {
    return !value || value === '<p></p>';
  };

  useEffect(() => {
    reset(campaignData);
  }, [campaignData]);

  useEffect(() => {
    if (campaignData.id) {
      setIsInitialized(true);
    }
  }, [campaignData.id]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div>
      <div>
        <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
          Update your email subject
        </h3>
        <input className="hidden" id="subject" type="text" {...register('subject')} />
        <Editor
          type="subject"
          useRichEditor={false}
          minHeight="55px"
          setValue={setValue}
          counter={60}
          label={
            <div className="relative">
              <p className="md:text-lg">{content.designStep.sectionMessages.emailSubject.recipientHeadingFrom}</p>
              <p className="mt-2 mb-2 md:mb-0 md:text-lg">
                {content.designStep.sectionMessages.emailSubject.recipientHeadingTo}
              </p>
              <p className="absolute left-0 top-23 md:relative md:top-0 md:my-4 md:text-lg">
                {content.designStep.sectionMessages.emailSubject.subject}
              </p>
            </div>
          }
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleContentUpdate('subject')}
          disabled={checkIfFieldIsEmpty(formData.subject)}
        >
          Update subject
        </button>
      </div>
      <div>
        <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
          Update your email message
        </h3>
        <button
          type="button"
          className="btn-underline mb-4 md:mb-0"
          onClick={() => setLibrary({ dialogVisible: true, type: 'emailMessage' })}
        >
          {content.designStep.sectionMessages.emailMessage.selectFromLibrary}
        </button>
        <input className="hidden" id="emailMessage" type="text" {...register('emailMessage', { required: true })} />
        <Editor type="emailMessage" setValue={setValue} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleContentUpdate('emailMessage')}
          disabled={checkIfFieldIsEmpty(formData.emailMessage)}
        >
          Update email message
        </button>
      </div>
      <div className="relative">
        <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
          Update your landing page message
        </h3>
        <p className="max-w-[633px] mb-5 md:mb-5">{content.designStep.sectionMessages.landingPage.description}</p>
        <div className="md:left-0 md:top-32 flex flex-col items-start">
          <button
            type="button"
            className="btn-underline text-left mb-4 md:mb-0"
            onClick={() => setLibrary({ dialogVisible: true, type: 'landingMessage' })}
          >
            {content.designStep.sectionMessages.landingPage.selectMessage}
          </button>
        </div>
        <input className="hidden" id="landingMessage" type="text" {...register('landingMessage')} />
        <Editor type="landingMessage" setValue={setValue} counter={800} />
        <button type="button" className="btn btn-primary" onClick={() => handleContentUpdate('landingMessage')}>
          Update landing message
        </button>
      </div>
      <MediaUpload
        setValue={setValue}
        register={register}
        trigger={trigger}
        watch={watch}
        setLibrary={setLibrary}
        isEdition
        campaignId={campaignData.id}
      />
      <SmartTagsDialog />
      {library.dialogVisible && (
        <LibraryDialog
          visible={library.dialogVisible}
          type={library.type}
          handleClose={() => setLibrary({ dialogVisible: false })}
          isEdition
        />
      )}
      {isConfirmationVisible && (
        <ConfirmationDialog
          isOpen={isConfirmationVisible}
          title="Plase confirm"
          content="Please confirm you want to make changes to this campaign. Your changes will reflect instantly on any live campaign."
          showDialog={setIsConfirmationVisible}
          handleApprove={() => dispatch(updateCampaignContent({ cid: campaignData.id, type: activeType }))}
        />
      )}
    </div>
  );
};

export default EditContent;
