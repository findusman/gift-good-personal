import React from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';

const ConfirmationDialog = ({
  isOpen,
  title,
  content,
  confirmText,
  cancelText,
  showDialog,
  handleApprove,
  singleOption,
}) => {
  const handleAccept = async () => {
    try {
      await handleApprove();
      showDialog(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="px-14 py-14 mx-auto max-w-sm bg-white text-center flex flex-col justify-center items-center">
          {!!title && <Dialog.Title className="text-3xl">{title}</Dialog.Title>}
          {!!content && <div className="mt-4">{content}</div>}
          <div className="flex items-between mt-4 w-full">
            <button type="button" className="btn-secondary w-full" onClick={handleAccept}>
              {confirmText}
            </button>
            {!singleOption ? (
              <button className="ml-4 btn-primary w-full" type="button" onClick={() => showDialog(false)}>
                {cancelText}
              </button>
            ) : null}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  showDialog: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  singleOption: PropTypes.bool,
};
ConfirmationDialog.defaultProps = {
  title: '',
  content: '',
  confirmText: 'Yes',
  cancelText: 'No',
  singleOption: false,
};

export default ConfirmationDialog;
