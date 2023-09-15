import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import BaseDialog from 'components/common/BaseDialog';
import { setSmartTagsDialogVisibility } from 'store/createCampaign/design/designSlice';
import content from 'data/content.json';

const PanelContent = () => {
  const dispatch = useDispatch();
  const closeSmartTagsDialog = () => dispatch(setSmartTagsDialogVisibility(false));

  return (
    <>
      <h2 className="text-2.6xl mb-8">{content.designStep.smartTagDialog.heading}</h2>
      {content.designStep.smartTagDialog.sections.map((item) => (
        <p className="mb-4" key={item.key}>
          {item.content}
        </p>
      ))}
      <button type="button" className="btn-primary mt-6" onClick={closeSmartTagsDialog}>
        {content.common.done}
      </button>
    </>
  );
};
const SmartTagsDialog = () => {
  const dispatch = useDispatch();
  const smartTagsDialogVisible = useSelector((state) => state.design.smartTagsDialogVisible);

  if (!smartTagsDialogVisible) {
    return null;
  }

  const closeSmartTagsDialog = () => dispatch(setSmartTagsDialogVisibility(false));

  return (
    <BaseDialog visible={smartTagsDialogVisible} handleClose={closeSmartTagsDialog} panelContent={<PanelContent />} />
  );
};

export default SmartTagsDialog;
