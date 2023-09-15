import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RadioGroup } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';

import BaseDialog from 'components/common/BaseDialog';
import { serializeHtml } from 'components/common/editor/utils';
import {
  setLandingPageMessage,
  setEmailMessage,
  handleUploadFromLibrary,
  setFormData,
} from 'store/createCampaign/design/designSlice';
import libraryData from 'data/library.json';
import content from 'data/content.json';
import './library-dialog.css';
import { Video } from 'components/layout';

const ContentBlock = ({ element }) => {
  const { type, content: elementContent } = element;

  if (type !== 'rich-text') {
    return null;
  }

  return <div className="content mt-2" dangerouslySetInnerHTML={{ __html: serializeHtml(elementContent, true) }} />;
};

ContentBlock.propTypes = {
  element: PropTypes.shape({
    type: PropTypes.string,
    content: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
};

const ImageBlock = ({ element, type }) => {
  const { type: elementType, src, alt } = element;

  if (elementType !== 'image') {
    return null;
  }

  const classNames = type === 'banner' ? 'w-full pt-[22.5%]' : 'w-40 h-40';

  return (
    <div className={`relative ${classNames}`}>
      <img className="absolute top-0 left-0 w-full h-full object-contain" src={src} alt={alt} />
    </div>
  );
};

ImageBlock.propTypes = {
  element: PropTypes.shape({
    type: PropTypes.string,
    src: PropTypes.string,
    alt: PropTypes.string,
  }).isRequired,
  type: PropTypes.string.isRequired,
};

const VideoBlock = ({ element }) => {
  const { type, src } = element;

  if (type !== 'video') {
    return null;
  }

  return <Video id="video-block" video={src} containerClassName="w-80" />;
};

VideoBlock.propTypes = {
  element: PropTypes.shape({
    type: PropTypes.string,
    src: PropTypes.string,
  }).isRequired,
};

const PanelContent = ({ type, handleClose, isEdition }) => {
  const dispatch = useDispatch();
  const { collectionType, formData } = useSelector((state) => ({
    collectionType: isEdition
      ? state.campaign.data.signatureCollection.type
      : state.collection?.currentCollection?.type,
    formData: state.design.formData,
  }));
  const { heading, content: description, options = libraryData.defaultOptions } = libraryData[type];
  const [selected, setOption] = useState(options[0].key);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 5;
  const handleChange = (value) => {
    setOption(value);
  };

  let supportedOptions = [...options];
  supportedOptions = options.filter((option) => {
    if (!option.supportedCollectionTypes) {
      return true;
    }

    return option.supportedCollectionTypes.indexOf(collectionType) !== -1;
  });

  useEffect(() => {
    setCurrentOptions(supportedOptions.slice(0, page * limit));
  }, [page]);

  const applyUpdate = async () => {
    const { content: pickedContent, src = '' } = supportedOptions.find((option) => option.key === selected);

    if (type === 'emailMessage') {
      await dispatch(setEmailMessage(pickedContent));
      dispatch(setFormData({ ...formData, emailMessage: pickedContent }));
    } else if (type === 'landingMessage') {
      await dispatch(setLandingPageMessage(pickedContent));
      dispatch(setFormData({ ...formData, landingMessage: pickedContent }));
    }

    dispatch(handleUploadFromLibrary({ type, selected, src }));
    handleClose();
  };

  return (
    <>
      <h2 className="text-2.6xl 2xl:text-4.2xl font-crimsonpro">{heading}</h2>
      <p className="mt-5">{description}</p>
      <RadioGroup value={selected} onChange={handleChange} className="mt-8 flex flex-wrap">
        {currentOptions.map((option) => (
          <RadioGroup.Option className="mb-21 flex mr-10 w-full" value={option.key} key={option.key}>
            {({ checked }) => (
              <>
                <span
                  className="mr-7 border border-black relative rounded-full"
                  style={{
                    width: '18px',
                    height: '18px',
                    minWidth: '18px',
                  }}
                >
                  {checked && (
                    <span
                      className="absolute top-0.5 left-0.5 bg-black rounded-full"
                      style={{
                        width: '12px',
                        height: '12px',
                      }}
                    />
                  )}
                </span>
                <div className="dialog-content flex flex-col w-full">
                  {option.type !== 'image' ? (
                    <h3 className="text-lg md:text-base font-bold font-lato">{option.label}</h3>
                  ) : null}
                  <ContentBlock element={option} />
                  <ImageBlock element={option} type={type} />
                  <VideoBlock element={option} />
                  {option.type === 'image' ? (
                    <h3 className="text-lg md:text-base mt-5 font-lato">{option.label}</h3>
                  ) : null}
                </div>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </RadioGroup>
      {supportedOptions.length > currentOptions.length && (
        <div className="flex justify-center mb-12">
          <button type="button" className="btn-secondary py-3" onClick={() => setPage(page + 1)}>
            {content.common.showMore}
          </button>
        </div>
      )}
      <div className="flex justify-between absolute bottom-0 bg-white w-full py-8">
        <button type="submit" className="btn-primary" onClick={applyUpdate}>
          {content.common.done}
        </button>
      </div>
    </>
  );
};

PanelContent.propTypes = {
  type: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  isEdition: PropTypes.bool,
};

PanelContent.defaultProps = {
  isEdition: false,
};

const LibraryDialog = ({ visible, type, handleClose, isEdition }) => {
  return (
    <BaseDialog
      visible={visible}
      handleClose={handleClose}
      panelContent={<PanelContent type={type} handleClose={handleClose} isEdition={isEdition} />}
    />
  );
};

LibraryDialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  isEdition: PropTypes.bool,
};

LibraryDialog.defaultProps = {
  isEdition: false,
};

export default LibraryDialog;
