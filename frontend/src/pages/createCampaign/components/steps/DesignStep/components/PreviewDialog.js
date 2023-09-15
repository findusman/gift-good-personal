import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useWindowWidth } from '@react-hook/window-size';
import BaseDialog from 'components/common/BaseDialog';
import contentData from 'data/content.json';

const SectionTitle = ({ text }) => (
  <h3 className="hidden md:block uppercase font-lato text-xs font-bold pb-3 mb-9 border-b border-beige-dark tracking-wider">
    {text}
  </h3>
);

SectionTitle.propTypes = {
  text: PropTypes.string.isRequired,
};

const PanelContent = ({ defaultType }) => {
  const [type, setType] = useState(defaultType);
  const [emailContent, setEmailContent] = useState('');
  const [landingContent, setLandingContent] = useState('');
  const { formData, selectedCollection, recipients } = useSelector((state) => ({
    formData: state.design.formData,
    recipients: state.recipient.recipients,
    selectedCollection: state.collection.currentCollection,
  }));
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 768;
  const {
    designStep: { preview: content },
  } = contentData;

  const loadPreviewInFrame = async ({ url, params, contentType }) => {
    let result;
    try {
      result = await window.fetch(url, {
        method: 'post',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json', Accept: 'text/html' },
      });
    } catch (e) {
      console.error(e);
    }
    const previewContent = await result.text();
    if (contentType === 'email') {
      setEmailContent(previewContent);
    } else {
      setLandingContent(previewContent);
    }
  };

  const showPreview = () => {
    const contact = recipients[0];
    const params = {
      collection: selectedCollection && selectedCollection.id,
      from_first_name: contact && contact.from_first_name,
      from_company_name: contact && contact.from_company_name,
      message: formData.landingMessage,
      video_url: formData.video,
      banner_url: formData.banner,
      logo_url: formData.logo,
      contact,
      landing_include_logo: !!formData.includeLogoOnLanding,
      landing_include_banner: !!formData.includeBannerOnLanding,
    };
    loadPreviewInFrame({
      url: '/preview/landing-page?where=create',
      params,
      contentType: 'landing',
    });
  };
  const showEmail = () => {
    const contact = recipients[0];
    const params = {
      rec_name: contact && contact.to_first_name,
      snd_name: contact && contact.from_first_name,
      snd_company: contact && contact.from_company_name,
      message: formData.emailMessage,
      video: formData.video,
      banner: formData.banner,
      logo: formData.logo,
      showGFGLogo: formData.includeGiftsForGoodLogo,
      contact,
      email_include_logo: !!formData.includeLogoInEmail,
      email_include_banner: !!formData.includeBannerInEmail,
      collection: selectedCollection && selectedCollection.id,
    };
    loadPreviewInFrame({
      url: '/preview/campaign-email?where=create',
      params,
      contentType: 'email',
    });
  };

  useEffect(() => {
    if (type === 'email') {
      showEmail();
    } else {
      showPreview();
    }
  }, [type]);

  return (
    <>
      <div className="px-8 md:px-0">
        <h2 className="text-2.6xl md:text-4.2xl mb-8">{content.title}</h2>
        <p className="hidden md:block mb-8">{content.infoText}</p>
        <div className="mb-18 md:mb-22">
          <button type="button" onClick={() => setType('email')} className="btn-underline mr-8">
            {content.emailPreview}
          </button>
          <button type="button" onClick={() => setType('landing')} className="btn-underline">
            {content.landingPreview}
          </button>
        </div>
      </div>
      {type === 'email' && emailContent && (
        <div>
          <SectionTitle text={content.desktopEmail} />
          <iframe
            srcDoc={emailContent}
            title="Preview Email Desktop"
            width="600"
            height="890"
            className="hidden md:block border border-gray mb-25"
          />
          <SectionTitle text={content.mobileEmail} />
          <iframe
            srcDoc={emailContent}
            title="Preview Email Mobile"
            width={isDesktop ? '375' : '100%'}
            height="720"
            className="md:border border-gray"
          />
        </div>
      )}
      {type === 'landing' && landingContent && (
        <div>
          <SectionTitle text={content.desktopLanding} />
          <div className="w-full overflow-hidden md:mb-[-759px]">
            <iframe
              srcDoc={landingContent}
              title="Preview Landing Desktop"
              width="1200"
              height="2027"
              style={{ transform: 'scale(0.626)', transformOrigin: '0 0' }}
              className="hidden md:block border border-gray mb-25"
            />
          </div>
          <SectionTitle text={content.mobileLanding} />
          <iframe
            srcDoc={landingContent}
            title="Preview Landing Mobile"
            width={isDesktop ? '375px' : '100%'}
            height="1000px"
            className="md:border border-gray"
          />
        </div>
      )}
    </>
  );
};

PanelContent.propTypes = {
  defaultType: PropTypes.string,
};

PanelContent.defaultProps = {
  defaultType: 'landing',
};

const PreviewDialog = ({ isVisible, handleClose, defaultType }) => {
  return (
    <BaseDialog
      visible={isVisible}
      handleClose={handleClose}
      panelContent={<PanelContent defaultType={defaultType} />}
      paddingY="py-32 pb-0 md:pb-32"
      paddingX="md:px-18"
    />
  );
};

PreviewDialog.propTypes = {
  isVisible: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  defaultType: PropTypes.string,
};

PreviewDialog.defaultProps = {
  isVisible: false,
  defaultType: 'landing',
};

export default PreviewDialog;
