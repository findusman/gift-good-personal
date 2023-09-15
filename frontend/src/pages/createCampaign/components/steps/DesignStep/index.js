import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';

import TopSection from 'components/common/TopSection';
import Editor from 'components/common/editor';
import { setDesignLearnMoreVisibility } from 'store/createCampaign/design/designSlice';
import { setStepValidity } from 'store/createCampaign/step/stepSlice';
import steps from 'helpers/steps';
import content from 'data/content.json';
import LibraryDialog from './components/LibraryDialog';
import SmartTagsDialog from './components/SmartTagsDialog';
import PreviewDialog from './components/PreviewDialog';
import MediaUpload from './components/MediaUpload';

const TopSectionContent = () => {
  const dispatch = useDispatch();
  const handleLearnMoreClick = () => {
    dispatch(setDesignLearnMoreVisibility(true));
  };

  return (
    <div className="flex flex-col 2xl:flex-row justify-center items-center">
      <p className="text-center text-base 2xl:text-1.5xl">{content.learnMore.design.messages.designDescription}</p>
      <button type="button" className="btn-underline mt-3 2xl:ml-4 2xl:mb-2.5" onClick={handleLearnMoreClick}>
        {content.common.learnMore}
      </button>
    </div>
  );
};
const UploadDialogContent = ({ children, text, title }) => {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-2.6xl md:text-4.2xl mb-5 md:mb-8">{title}</h3>
      <p className="mb-8">{text}</p>
      {children}
    </div>
  );
};
UploadDialogContent.propTypes = {
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
const DesignStep = () => {
  const dispatch = useDispatch();
  const [library, setLibrary] = useState({ dialogVisible: false });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewType, setPreviewType] = useState('landing');
  const { formData, richTextsValidation } = useSelector((state) => ({
    formData: state.design.formData,
    richTextsValidation: state.design.richTextsValidation,
  }));
  const { register, watch, setValue, trigger } = useForm({
    mode: 'onChange',
    defaultValues: { ...formData },
  });

  const showPreview = (type) => {
    setPreviewType(type);
    setIsPreviewVisible(true);
  };

  useEffect(() => {
    dispatch(
      setStepValidity({
        key: steps.DESIGN,
        isValid: Object.values(richTextsValidation).every((item) => item === true),
      }),
    );
  }, [richTextsValidation]);

  return (
    <>
      <TopSection title="Design" content={<TopSectionContent />} />
      <section className="p-5 md:p-10 md:pt-11 mx-auto mt-12 bg-beige-light" style={{ maxWidth: '1100px' }}>
        <form>
          <div>
            <h3 className="mb-5 border-b border-beige-dark text-1.5xl md:text-2.6xl">
              {content.designStep.sectionMessages.emailSubject.title}
              <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.required}</span>
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
          </div>
          <div>
            <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
              {content.designStep.sectionMessages.emailMessage.title}
              <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.required}</span>
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
          </div>
          {/* <div>
            <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
              {content.designStep.sectionMessages.signature.title}
            </h3>
            <Editor type="signature" useRichEditor={false} minHeight="55px" />
          </div> */}
          <div className="relative">
            <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
              {content.designStep.sectionMessages.landingPage.title}
              <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.optional}</span>
            </h3>
            <p className="max-w-[633px] mb-5 md:mb-5">{content.designStep.sectionMessages.landingPage.description}</p>
            <div className="md:left-0 md:top-32 flex flex-col items-start">
              <button type="button" className="btn-underline mb-2.5" onClick={() => showPreview('landing')}>
                {content.common.previewLandingPage}
              </button>
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
          </div>
          <MediaUpload
            register={register}
            setValue={setValue}
            trigger={trigger}
            watch={watch}
            setLibrary={setLibrary}
          />
        </form>
        <button type="button" className="btn-primary mt-10 mb-20" onClick={() => showPreview('landing')}>
          {content.common.previewDesign}
        </button>
        <SmartTagsDialog />
        {library.dialogVisible && (
          <LibraryDialog
            visible={library.dialogVisible}
            type={library.type}
            handleClose={() => setLibrary({ dialogVisible: false })}
          />
        )}
        <PreviewDialog
          isVisible={isPreviewVisible}
          handleClose={() => setIsPreviewVisible(false)}
          defaultType={previewType}
        />
      </section>
    </>
  );
};

export default DesignStep;
