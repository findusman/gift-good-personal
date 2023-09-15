import React from 'react';
import OneSchemaImporter from '@oneschema/react';
import { useSelector, useDispatch } from 'react-redux';

import {
  setImporterDialogVisibility,
  storeRecipients,
  deleteTemplate,
} from 'store/createCampaign/recipient/recipientSlice';
import content from 'data/content.json';

const OneSchemaImport = () => {
  const {
    recipientsStep: {
      addRecipients: { uploadOption },
    },
  } = content;
  const dispatch = useDispatch();
  const { isAdmin, distributionSelected, isOpen, templateKey } = useSelector((state) => ({
    isAdmin: state.app.isAdmin,
    distributionSelected: state.recipient.distributionMethod.selected,
    isOpen: state.recipient.importerDialogVisible,
    templateKey: state.recipient.template.name,
  }));
  const defaultTemplateKey =
    distributionSelected === 'gfg' || !isAdmin
      ? process.env.ONESCHEMA_TEMPLATE
      : process.env.ONESCHEMA_TEMPLATE_UNIQUE_LINKS;
  const onSuccess = (data) => {
    dispatch(storeRecipients(data.records));
    dispatch(deleteTemplate({ templateKey }));
  };

  const onCancel = () => {
    dispatch(deleteTemplate({ templateKey }));
  };

  const onError = (message) => {
    // TODO Handle error message
    // eslint-disable-next-line no-console
    console.error(message);
  };

  return (
    <div>
      <OneSchemaImporter
        isOpen={isOpen}
        onRequestClose={() => dispatch(setImporterDialogVisibility(false))}
        clientId={process.env.ONESCHEMA_CLIENT_ID}
        userJwt={process.env.ONESCHEMA_JWT}
        templateKey={templateKey || defaultTemplateKey}
        config={{
          blockImportIfErrors: true,
          contentOptions: {
            upload: {
              uploader: {
                header: uploadOption.uploadHeader,
                subheader: uploadOption.uploadSubheader,
              },
              infoSidebar: {
                hideInfoBanner: false,
                infoBannerText: uploadOption.infoBannerText,
                displayTemplateColumns: 'required',
              },
            },
          },
        }}
        devMode={process.env.NODE_ENV !== 'production'}
        className="oneschema-importer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 51,
        }}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </div>
  );
};

export default OneSchemaImport;
