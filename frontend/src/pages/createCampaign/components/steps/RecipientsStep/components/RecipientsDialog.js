/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';

import BaseDialog from 'components/common/BaseDialog';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import {
  setRecipientsDialogVisibility,
  storeRecipients,
  setDefaultDateAndTime,
  removeFormValidation,
} from 'store/createCampaign/recipient/recipientSlice';
import { setError } from 'store/common/error/errorSlice';
import content from 'data/content.json';
import addMarker from 'assets/images/add_marker.svg';
import arrowLeft from 'assets/images/arrow_left.svg';
import arrowRight from 'assets/images/arrow_right.svg';
import RecipientForm from './RecipientForm';

const Recipients = ({ closeDialog, requestRecipientsDialogClose }) => {
  const { storedRecipients, isFormDirty, recipientFormsValidation } = useSelector((state) => ({
    storedRecipients: state.recipient.recipients,
    isFormDirty: state.recipient.isFormDirty,
    recipientFormsValidation: state.recipient.recipientFormsValidation,
  }));
  const [nextId, setNextId] = useState(1);
  const [formsToValidate, triggerValidation] = useState(null);
  const recipientDefaultValues = {
    id: nextId,
    index: nextId,
    to_first_name: '',
    to_last_name: '',
    to_email: '',
    to_company_name: '',
    from_first_name: '',
    from_last_name: '',
    from_email: '',
    from_company_name: '',
    send_on_time: '',
    send_on_date: '',
  };
  // use state to not update any data without confirmation (click Done btn)
  const [recipients, setRecipients] = useState(storedRecipients.length ? storedRecipients : [recipientDefaultValues]);
  const dispatch = useDispatch();
  const itemsPerPage = 10;
  const [currentItems, setCurrentItems] = useState(recipients.slice(0, itemsPerPage));
  const initialPageCount = Math.ceil(recipients.length / itemsPerPage);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [itemOffset, setItemOffset] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [page, setPage] = useState(0);
  const [confirmationDialog, showConfirmationDialog] = useState(false);
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % recipients.length;

    setItemOffset(newOffset);
    setPage(event.selected);
  };
  const isRecipientsDataValid = () => {
    const recipientsToValidate = recipientFormsValidation.filter(
      (item) => recipients.map((element) => element.id).indexOf(item.id) >= 0,
    );
    if (recipientsToValidate.some((element) => !element.isValid)) {
      triggerValidation(recipientsToValidate.filter((item) => !item.isValid).map((e) => e.id));
      dispatch(
        setError({
          title: content.errors.recipientsValidationTitle,
          content: content.errors.recipientsValidationContent,
        }),
      );
      return false;
    }

    return true;
  };
  const saveRecipients = () => {
    if (!isFormDirty && recipients.length === 1) {
      return dispatch(setRecipientsDialogVisibility(false));
    }

    if (!isRecipientsDataValid()) {
      return false;
    }

    dispatch(setRecipientsDialogVisibility(false));

    return dispatch(storeRecipients(recipients));
  };
  const addRecipient = async (recipient) => {
    // todo: verify if exists (by email ?)
    dispatch(setDefaultDateAndTime({ date: recipient.send_on_date, time: recipient.send_on_time }));
    const updatedRecipients = [...recipients, recipient];
    setRecipients(updatedRecipients);
  };
  const removeRecipient = (recipientId) => {
    dispatch(removeFormValidation(recipientId));
    const filteredRecipients = [...recipients].filter((item) => item.id !== recipientId);

    setRecipients(filteredRecipients);
    if (currentItems.length - 1 === 0) {
      setPageCount(Math.ceil((recipients.length - 1) / itemsPerPage));
      setForceUpdate(true);
    }
  };
  const updateRecipient = (recipient) => {
    const mapped = recipients.map((item) => {
      return item.id === recipient.id ? recipient : item;
    });

    setRecipients(mapped);
  };
  const handleAddRecipient = () => {
    if (!isRecipientsDataValid()) {
      return;
    }

    let send_on_date = '';
    let send_on_time = '';

    if (recipients.length) {
      const prevRecipient = recipients[recipients.length - 1];

      if (prevRecipient.send_on_date) {
        send_on_date = prevRecipient.send_on_date;
      }
      if (prevRecipient.send_on_time) {
        send_on_time = prevRecipient.send_on_time;
      }
    }

    addRecipient({ ...recipientDefaultValues, send_on_date, send_on_time });

    // go to last page if already 3 items are presented in dialog
    if (currentItems.length === itemsPerPage) {
      setPageCount(Math.ceil((recipients.length + 1) / itemsPerPage));
      setForceUpdate(true);
    }
  };
  const handleApprove = () => {
    requestRecipientsDialogClose(false);
    dispatch(setRecipientsDialogVisibility(false));
  };

  useEffect(() => {
    const endOffset = itemOffset + itemsPerPage;
    setCurrentItems(recipients.map((item, idx) => ({ ...item, index: idx + 1 })).slice(itemOffset, endOffset));
  }, [itemOffset, itemsPerPage, recipients, pageCount]);
  useEffect(() => {
    const highestId = recipients.length ? Math.max(...recipients.map((recipient) => recipient.id)) : 0;
    setNextId(highestId + 1);
  }, [recipients.length]);
  useEffect(() => {
    if (forceUpdate) {
      const newOffset = ((pageCount - 1) * itemsPerPage) % recipients.length;

      setItemOffset(newOffset);
      setPage(pageCount - 1);
      setForceUpdate(false);
    }
  }, [forceUpdate]);
  useEffect(() => {
    if (closeDialog) {
      if (JSON.stringify(recipients) !== JSON.stringify(storedRecipients)) {
        showConfirmationDialog(true);
      } else {
        dispatch(setRecipientsDialogVisibility(false));
      }

      requestRecipientsDialogClose(false);
    }
  }, [closeDialog]);
  useEffect(() => {
    if (!confirmationDialog) {
      requestRecipientsDialogClose(false);
    }
  }, [confirmationDialog]);

  return (
    <div>
      <h2 className="text-2.6xl md:text-4.2xl">{content.recipientsStep.recipients}</h2>
      <p className="mt-4 mb-2.5">{content.recipientsStep.addRecipientsModal.enterRecipients}</p>
      <p className="mb-5">{content.recipientsStep.addRecipientsModal.noDateDescription}</p>
      {currentItems.map((recipient) => (
        <RecipientForm
          key={recipient.id}
          id={recipient.id}
          index={recipient.index}
          recipient={recipient}
          removeRecipient={removeRecipient}
          updateRecipient={updateRecipient}
          showRemoveBtn={recipients.length > 1}
          recipientsLength={recipients.length}
          formsToValidate={formsToValidate}
        />
      ))}
      <div className="md:mt-6">
        <button type="button" className="flex items-center text-lg font-crimsonpro md" onClick={handleAddRecipient}>
          <img className="mr-2" src={addMarker} alt="add recipients" />
          {content.recipientsStep.addRecipientsModal.addRecipient}
        </button>
      </div>
      {recipients.length > itemsPerPage && (
        <div className="relative block w-full">
          <ReactPaginate
            forcePage={page}
            breakLabel="..."
            nextLabel={
              <>
                <img className="ml-4 md:hidden" src={arrowRight} alt="arrow" />
                <p className="hidden md:ml-4 md:text-xs md:font-semibold md:block">NEXT</p>
              </>
            }
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            previousLabel={
              <>
                <img className="mr-4 md:hidden" src={arrowLeft} alt="arrow" />
                <p className="hidden md:mr-4 md:text-xs md:font-semibold md:block">PREV</p>
              </>
            }
            pageClassName="hidden md:block md:text-xs md:font-semibold md:mx-2 md:px-2.5"
            renderOnZeroPageCount={null}
            containerClassName="absolute -top-[18px] right-2 md:right-32 flex items-center"
            activeClassName="md:px-2.5 md:py-1.5 md:bg-beige-300 md:rounded-full"
          />
        </div>
      )}
      <button type="button" className="btn-primary mt-6" onClick={saveRecipients}>
        {content.common.done}
      </button>
      {confirmationDialog && (
        <ConfirmationDialog
          isOpen={confirmationDialog}
          title={content.recipientsStep.confirmation.title}
          content={content.recipientsStep.confirmation.content}
          showDialog={showConfirmationDialog}
          handleApprove={handleApprove}
          confirmText={content.recipientsStep.confirmation.confirmText}
          cancelText={content.recipientsStep.confirmation.cancelText}
        />
      )}
    </div>
  );
};
Recipients.propTypes = {
  closeDialog: PropTypes.bool.isRequired,
  requestRecipientsDialogClose: PropTypes.func.isRequired,
};
const RecipientsDialog = () => {
  const visible = useSelector((state) => state.recipient.recipientsDialogVisible);
  const [closeDialog, requestRecipientsDialogClose] = useState(false);

  return (
    <BaseDialog
      visible={visible}
      handleClose={() => requestRecipientsDialogClose(true)}
      panelContent={
        <Recipients closeDialog={closeDialog} requestRecipientsDialogClose={requestRecipientsDialogClose} />
      }
      maxWidth={false}
    />
  );
};

export default RecipientsDialog;
