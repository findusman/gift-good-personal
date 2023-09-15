import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { setFormData, handleUploadFromLibrary, updateCampaignMedia } from 'store/createCampaign/design/designSlice';
import { setIsLoading } from 'store/common/app/appSlice';
import uploadIcon from 'assets/images/upload.svg';
import checkboxMarker from 'assets/images/check_mark_lg.svg';
import BaseDialog from 'components/common/BaseDialog';
import AssetPreview from 'pages/createCampaign/components/steps/DesignStep/components/AssetPreview';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content.json';

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
const UploadIcon = () => <img src={uploadIcon} alt="" className="inline-block w-4.5 mr-4 align-text-bottom" />;

const MediaUpload = ({ register, setValue, watch, trigger, setLibrary, isEdition, campaignId }) => {
  const dispatch = useDispatch();
  const { formData, libraryUpload } = useSelector((state) => ({
    formData: state.design.formData,
    libraryUpload: state.design.libraryUpload,
  }));
  const [mediaDialog, showMediaDialog] = useState(false);
  const [mediaLink, setMediaLink] = useState(null);
  const [fileNames, setFileNames] = useState({});
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [activeType, setActiveType] = useState('');
  const mediaUploadFields = ['logo', 'banner', 'video'];
  const {
    designStep: { uploadDialogs: uploadContent },
  } = content;

  const handleUpload = async (fieldName, value) => {
    dispatch(setIsLoading({ loading: true }));
    const data = new FormData();

    data.append('file', value);
    data.append('type', fieldName);

    let rsp = await fetch('/upload-file', {
      method: 'POST',
      body: data,
    });
    rsp = await rsp.json();
    dispatch(setIsLoading({ loading: false }));
    return rsp;
  };
  const handleMediaUpdate = async (name) => {
    let relatedCheckboxes;
    if (name === 'logo') {
      relatedCheckboxes = {
        includeLogoOnLanding: true,
        includeLogoInEmail: true,
      };
      Object.keys(relatedCheckboxes).forEach((key) => {
        if (formData[key]) {
          setValue(key, relatedCheckboxes[key]);
        }
      });
    }
    setValue(name, mediaLink, { shouldValidate: true, shouldDirty: true });
    await dispatch(
      setFormData({
        ...formData,
        ...relatedCheckboxes,
        [name]: mediaLink,
      }),
    );
    showMediaDialog(false);
  };
  const handleAssetRemove = (name) => {
    let relatedCheckboxes;

    if (name === 'banner') {
      relatedCheckboxes = {
        includeBannerOnLanding: false,
        includeBannerInEmail: false,
      };
    } else if (name === 'logo') {
      relatedCheckboxes = {
        includeLogoOnLanding: false,
        includeLogoInEmail: false,
        includeGiftsForGoodLogo: false,
      };
    }

    if (relatedCheckboxes) {
      Object.keys(relatedCheckboxes).forEach((key) => {
        if (formData[key]) {
          setValue(key, relatedCheckboxes[key]);
        }
      });
    }
    setValue(name, null, { shouldValidate: true, shouldDirty: true });
    dispatch(
      setFormData({
        ...formData,
        ...relatedCheckboxes,
        [name]: null,
      }),
    );
    dispatch(handleUploadFromLibrary(null));
  };

  const handleMediaEdition = (type) => {
    setIsConfirmationVisible(true);
    setActiveType(type);
  };

  useEffect(() => {
    const subscription = watch(async (value, { name }) => {
      if (mediaUploadFields.indexOf(name) >= 0 && typeof value[name]?.[0] === 'object') {
        const newFileNames = fileNames;
        newFileNames[name] = value[name][0].name;
        setFileNames(newFileNames);
        // todo: error handling
        const upload = await handleUpload(name, value[name][0]);
        setMediaLink(upload.file_link);
        dispatch(handleUploadFromLibrary(null));

        return;
      }

      dispatch(setFormData({ ...formData, ...value }));
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    setMediaLink(libraryUpload?.src);
  }, [libraryUpload]);

  useEffect(() => {
    if (libraryUpload?.type && !mediaDialog) {
      const { type } = libraryUpload;

      handleMediaUpdate(type);
    }
  }, [mediaLink]);

  useEffect(() => {
    trigger(mediaUploadFields);
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
        {content.designStep.sectionMessages.logo.title}
        <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.optional}</span>
      </h3>
      <p className="max-w-[633px] mb-5 md:mb-10">{content.designStep.sectionMessages.logo.description}</p>
      {formData.logo ? (
        <AssetPreview
          type="logo"
          asset={{ src: formData.logo, alt: 'Logo' }}
          handleAssetRemove={() => handleAssetRemove('logo')}
        />
      ) : (
        <div className="flex justify-center items-center text-center bg-beige-dark w-40 h-40 box-border p-7">
          <p className="text-1.5xl font-crimsonpro leading-6">{content.designStep.sectionMessages.logo.customLogo}</p>
        </div>
      )}
      <button type="button" className="btn-underline mt-2" onClick={() => showMediaDialog('logo')}>
        {content.designStep.sectionMessages.logo.uploadImage}
      </button>
      <BaseDialog
        visible={mediaDialog === 'logo'}
        handleClose={() => showMediaDialog(false)}
        panelContent={
          <UploadDialogContent title={uploadContent.logo.title} text={uploadContent.logo.text}>
            <>
              <div className="flex flex-wrap items-center mb-8">
                <label htmlFor="logo" className="btn-secondary btn-icon cursor-pointer p-3.5 mr-4 relative">
                  <input
                    type="file"
                    className="absolute opacity-0 w-full h-full"
                    id="logo"
                    accept=".jpg, .jpeg, .png, .gif"
                    {...register('logo')}
                  />
                  <UploadIcon />
                  {content.designStep.sectionMessages.logo.uploadImage}
                </label>
                {fileNames.logo && <span>{fileNames.logo}</span>}
              </div>
              <button type="button" onClick={() => handleMediaUpdate('logo')} className="btn-primary px-13 md:px-8.75">
                {content.common.done}
              </button>
            </>
          </UploadDialogContent>
        }
      />
      <label
        className={classnames('mt-7 flex items-center cursor-pointer', formData.logo ? '' : 'disabled--no-interactive')}
        htmlFor="includeLogoOnLanding"
      >
        <input
          className="hidden"
          id="includeLogoOnLanding"
          disabled={!formData.logo}
          type="checkbox"
          {...register('includeLogoOnLanding')}
        />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {formData.includeLogoOnLanding ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.designStep.sectionMessages.logo.includeLandingPage}
      </label>
      <label
        className={classnames('mt-7 flex items-center cursor-pointer', formData.logo ? '' : 'disabled--no-interactive')}
        htmlFor="includeLogoInEmail"
      >
        <input
          className="hidden"
          id="includeLogoInEmail"
          disabled={!formData.logo}
          type="checkbox"
          {...register('includeLogoInEmail')}
        />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {formData.includeLogoInEmail ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.designStep.sectionMessages.logo.includeCustomLogo}
      </label>
      <label className="mt-7 flex items-center cursor-pointer" htmlFor="includeGiftsForGoodLogo">
        <input
          className="hidden"
          id="includeGiftsForGoodLogo"
          type="checkbox"
          {...register('includeGiftsForGoodLogo')}
        />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {formData.includeGiftsForGoodLogo ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.designStep.sectionMessages.logo.includeLogo}
      </label>
      {isEdition && (
        <button type="button" className="btn btn-primary block mt-4" onClick={() => handleMediaEdition('logo')}>
          Update logo
        </button>
      )}

      <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
        {content.designStep.sectionMessages.bannerImage.title}
        <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.optional}</span>
      </h3>
      <p className="max-w-[633px] mb-5 md:mb-10">{content.designStep.sectionMessages.bannerImage.description}</p>
      <AssetPreview
        type="banner"
        asset={{ src: formData.banner, alt: 'Banner' }}
        handleAssetRemove={() => handleAssetRemove('banner')}
      />
      <button type="button" className="btn-underline mt-2 mr-8" onClick={() => showMediaDialog('banner')}>
        {content.designStep.sectionMessages.bannerImage.uploadBannerImage}
      </button>
      <BaseDialog
        visible={mediaDialog === 'banner'}
        handleClose={() => showMediaDialog(false)}
        panelContent={
          <UploadDialogContent title={uploadContent.banner.title} text={uploadContent.banner.text}>
            <>
              <div className="flex flex-wrap items-center mb-8">
                <label htmlFor="banner" className="btn-secondary btn-icon cursor-pointer p-3.5 mr-4 relative">
                  <input
                    type="file"
                    className="absolute opacity-0 w-full h-full"
                    id="banner"
                    accept=".jpg, .jpeg, .png, .gif"
                    {...register('banner')}
                  />
                  <UploadIcon />
                  {content.designStep.sectionMessages.bannerImage.uploadBannerImage}
                </label>
                {fileNames.banner && <span>{fileNames.banner}</span>}
              </div>
              <button
                type="button"
                onClick={() => handleMediaUpdate('banner')}
                className="btn-primary px-13 md:px-8.75"
              >
                {content.common.done}
              </button>
            </>
          </UploadDialogContent>
        }
      />
      <button
        type="button"
        className="btn-underline mt-5"
        onClick={() => setLibrary({ dialogVisible: true, type: 'banner' })}
      >
        {content.designStep.sectionMessages.bannerImage.selectFromLibrary}
      </button>
      <label
        className={classnames(
          'mt-7 flex items-center cursor-pointer',
          formData.banner ? '' : 'disabled--no-interactive',
        )}
        htmlFor="includeBannerOnLanding"
      >
        <input
          className="hidden"
          id="includeBannerOnLanding"
          disabled={!formData.banner}
          type="checkbox"
          {...register('includeBannerOnLanding')}
        />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {formData.includeBannerOnLanding ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.designStep.sectionMessages.bannerImage.includeLandingPage}
      </label>
      <label
        className={classnames(
          'mt-7 flex items-center cursor-pointer',
          formData.banner ? '' : 'disabled--no-interactive',
        )}
        htmlFor="includeBannerInEmail"
      >
        <input
          className="hidden"
          id="includeBannerInEmail"
          disabled={!formData.banner}
          type="checkbox"
          {...register('includeBannerInEmail')}
        />
        <div className="w-6 h-6 border border-black mr-2 inline-block">
          {formData.includeBannerInEmail ? <img src={checkboxMarker} alt="checkbox" /> : null}
        </div>
        {content.designStep.sectionMessages.bannerImage.includeEmail}
      </label>
      {isEdition && (
        <button type="button" className="btn btn-primary block mt-4" onClick={() => handleMediaEdition('banner')}>
          Update banner
        </button>
      )}

      <h3 className="mt-10 mb-5 pb-2 border-b border-beige-dark text-1.5xl md:text-2.6xl">
        {content.designStep.sectionMessages.video.title}
        <span className="text-base md:text-lg italic ml-1 md:ml-2">{content.common.optional}</span>
      </h3>
      <p className="max-w-[633px] mb-5 md:mb-10">{content.designStep.sectionMessages.video.description}</p>
      <AssetPreview
        asset={{ video: formData.video }}
        handleAssetRemove={() => handleAssetRemove('video')}
        type="video"
      />
      <button type="button" className="btn-underline mt-2 mr-8" onClick={() => showMediaDialog('video')}>
        {content.designStep.sectionMessages.video.uploadVideo}
      </button>
      <BaseDialog
        visible={mediaDialog === 'video'}
        handleClose={() => showMediaDialog(false)}
        panelContent={
          <UploadDialogContent title={uploadContent.video.title} text={uploadContent.video.text}>
            <>
              <div className="flex flex-wrap items-center mb-8">
                <label htmlFor="video" className="btn-secondary btn-icon cursor-pointer p-3.5 mr-4 relative">
                  <input
                    type="file"
                    accept="video/mp4,video/x-m4v,video/quicktime"
                    className="absolute opacity-0 w-full h-full"
                    id="video"
                    {...register('video')}
                  />
                  <UploadIcon />
                  {content.designStep.sectionMessages.video.uploadVideo}
                </label>
                {fileNames.video && <span>{fileNames.video}</span>}
              </div>
              <button type="button" onClick={() => handleMediaUpdate('video')} className="btn-primary px-13 md:px-8.75">
                {content.common.done}
              </button>
            </>
          </UploadDialogContent>
        }
      />
      <button
        type="button"
        className="btn-underline mt-5 block md:inline"
        onClick={() => setLibrary({ dialogVisible: true, type: 'video' })}
      >
        {content.designStep.sectionMessages.video.selectFromLibrary}
      </button>
      {isEdition && (
        <button type="button" className="btn btn-primary block mt-4" onClick={() => handleMediaEdition('video')}>
          Update video
        </button>
      )}
      {isConfirmationVisible && isEdition && (
        <ConfirmationDialog
          isOpen={isConfirmationVisible}
          title="Plase confirm"
          content="Please confirm you want to make changes to this campaign. Your changes will reflect instantly on any live campaign."
          showDialog={setIsConfirmationVisible}
          handleApprove={() => dispatch(updateCampaignMedia({ cid: campaignId, type: activeType }))}
        />
      )}
    </>
  );
};

MediaUpload.propTypes = {
  setValue: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  trigger: PropTypes.func.isRequired,
  watch: PropTypes.func.isRequired,
  setLibrary: PropTypes.func.isRequired,
  isEdition: PropTypes.bool,
  campaignId: PropTypes.string,
};

MediaUpload.defaultProps = {
  isEdition: false,
  campaignId: '',
};

export default MediaUpload;
