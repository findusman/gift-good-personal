import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog } from '@headlessui/react';

import { hideError } from 'store/common/error/errorSlice';
import errorIcon from 'assets/images/error.svg';

const ErrorDialog = ({ confirmText }) => {
  const { isOpen, content, title } = useSelector((state) => ({
    isOpen: state.error.isOpen,
    content: state.error.content,
    title: state.error.title,
  }));
  const dispatch = useDispatch();

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative" style={{ zIndex: 60 }}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="px-18 py-14 mx-auto bg-white w-full max-w-[550px] text-center flex flex-col justify-center items-center">
          <img src={errorIcon} alt="error" className="mx-auto mb-6" />
          {!!title && <Dialog.Title className="text-3xl">{title}</Dialog.Title>}
          {!!content && <div className="mt-4 text-lg">{content}</div>}
          <div className="flex items-between justify-center mt-5 w-full">
            <button className="btn-primary uppercase" type="button" onClick={() => dispatch(hideError())}>
              {confirmText}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

ErrorDialog.propTypes = {
  confirmText: PropTypes.string,
};

ErrorDialog.defaultProps = {
  confirmText: 'Close',
};

export default ErrorDialog;
