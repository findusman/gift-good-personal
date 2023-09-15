import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import BaseDialog from 'components/common/BaseDialog';
import { setCollectionLearnMoreVisibility } from 'store/createCampaign/collection/collectionSlice';
import { setRecipientLearnMoreVisibility } from 'store/createCampaign/recipient/recipientSlice';
import { setDesignLearnMoreVisibility } from 'store/createCampaign/design/designSlice';
import { setPaymentLearnMoreVisibility } from 'store/createCampaign/payment/paymentSlice';
import content from 'data/content.json';
import classnames from 'classnames';
import { Video } from 'components/layout';

const VideoContent = ({ section }) => {
  if (section.type !== 'video') {
    return null;
  }

  return <Video id="video-content" video={section.file} />;
};

const Description = ({ section }) => {
  if (section.type) {
    return null;
  }

  return <p className="mt-4 text-base">{section.content}</p>;
};

const SectionDownload = ({ section }) => {
  if (section.type !== 'download') {
    return null;
  }

  return (
    <a href={section.downloadSrc} download className="border-b border-b-black text-base">
      {section.content}
    </a>
  );
};

const PanelContent = ({ stepKey, handleClose }) => {
  const {
    heading,
    body: { sections },
  } = content.learnMore[stepKey];

  const isMobile = useSelector((state) => state.app.isMobile);

  return (
    <>
      <h2 className="text-2.6xl 2xl:text-4.2xl font-crimsonpro">{heading}</h2>
      {sections.map((section) => {
        return (
          <section
            className={classnames(
              `mt-8 ${isMobile && section?.device === 'desktop' ? 'hidden' : null} ${
                !isMobile && section?.device === 'mobile' ? 'hidden' : null
              }`,
            )}
            key={section.key}
          >
            <h3 className="font-bold font-lato text-base">{section.title}</h3>
            <VideoContent section={section} />
            <Description section={section} />
            <SectionDownload section={section} />
          </section>
        );
      })}
      <button type="button" className="btn-primary mt-13" onClick={() => handleClose()} tabIndex="-1">
        {content.common.done}
      </button>
    </>
  );
};
const LearnMoreDialog = () => {
  const { visible, stepKey } = useSelector((state) => {
    const key = state.step.options[state.step.active].pathname;
    let isVisible = state.collection.learnMoreVisible;

    if (key === 'recipients') {
      isVisible = state.recipient.learnMoreVisible;
    } else if (key === 'design') {
      isVisible = state.design.learnMoreVisible;
    } else if (key === 'payment') {
      isVisible = state.payment.learnMoreVisible;
    }

    return {
      stepKey: key,
      visible: isVisible,
    };
  });
  const dispatch = useDispatch();
  // todo: prepare close actions for all steps
  const handleClose = () => {
    switch (stepKey) {
      case 'recipients':
        return dispatch(setRecipientLearnMoreVisibility(false));
      case 'design':
        return dispatch(setDesignLearnMoreVisibility(false));
      case 'payment':
        return dispatch(setPaymentLearnMoreVisibility(false));
      default:
        return dispatch(setCollectionLearnMoreVisibility(false));
    }
  };

  // todo: introduce content for all learn more dialogs
  if (!visible || !content.learnMore[stepKey]) {
    return null;
  }

  return (
    <BaseDialog
      visible={visible}
      handleClose={handleClose}
      panelContent={<PanelContent stepKey={stepKey} handleClose={handleClose} />}
    />
  );
};

PanelContent.propTypes = {
  stepKey: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
};

const sectionPropTypes = PropTypes.shape({
  type: PropTypes.string,
  file: PropTypes.string,
  content: PropTypes.string,
  downloadSrc: PropTypes.string,
});

VideoContent.propTypes = {
  section: sectionPropTypes.isRequired,
};

Description.propTypes = {
  section: sectionPropTypes.isRequired,
};

SectionDownload.propTypes = {
  section: sectionPropTypes.isRequired,
};

export default LearnMoreDialog;
