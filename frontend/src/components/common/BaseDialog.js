import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import classnames from 'classnames';

const BaseDialog = ({
  visible,
  handleClose,
  hideCloseIcon,
  panelContent,
  unmount,
  paddingY,
  paddingT,
  paddingX,
  maxWidth,
}) => {
  if (!visible && unmount) {
    return null;
  }

  return (
    <>
      <Transition show={visible}>
        <Transition.Child
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 z-50" aria-hidden="true" onClick={handleClose} />
        </Transition.Child>
      </Transition>
      <Transition show={visible || !unmount}>
        <Transition.Child
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog
            className={classnames(
              `fixed inset-0 overflow-hidden ${maxWidth ? 'max-w-4xl w-full' : ''} z-50 bg-white right-0 left-auto`,
            )}
            open={visible}
            onClose={handleClose}
            unmount={unmount}
            tabIndex="0"
          >
            <Dialog.Panel className={`${paddingY} ${paddingT} ${paddingX} h-full overflow-auto`}>
              {panelContent}
              {!hideCloseIcon && (
                <button
                  type="button"
                  className="absolute flex justify-center items-center top-[55px] md:top-2.5 right-8 md:right-2.5 bg-beige md:bg-transparent rounded-full w-10 h-10 z-10 focus:outline-none"
                  onClick={handleClose}
                >
                  <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.163 10.163a1.094 1.094 0 0 1 1.549 0l5.788 5.79 5.788-5.79a1.095 1.095 0 0 1 1.549 1.549l-5.79 5.788 5.79 5.788a1.096 1.096 0 0 1-1.549 1.549l-5.788-5.79-5.788 5.79a1.096 1.096 0 0 1-1.549-1.549l5.79-5.788-5.79-5.788a1.094 1.094 0 0 1 0-1.549z"
                      fill="#000"
                    />
                  </svg>
                </button>
              )}
            </Dialog.Panel>
          </Dialog>
        </Transition.Child>
      </Transition>
    </>
  );
};

BaseDialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  hideCloseIcon: PropTypes.bool,
  panelContent: PropTypes.node.isRequired,
  unmount: PropTypes.bool,
  paddingY: PropTypes.string,
  paddingT: PropTypes.string,
  paddingX: PropTypes.string,
  maxWidth: PropTypes.bool,
};

BaseDialog.defaultProps = {
  hideCloseIcon: false,
  unmount: true,
  paddingY: 'py-32',
  paddingT: 'md:pt-24',
  paddingX: 'px-8 md:px-18',
  maxWidth: true,
};

export default BaseDialog;
