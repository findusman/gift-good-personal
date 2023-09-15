/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { string, object } from 'yup';
import moment from 'moment';

import { timeRule, dateRule } from 'helpers/validationRules';
import { Input } from 'components/layout';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content.json';
import { setIsFormDirty, updateRecipientFormsValidation } from 'store/createCampaign/recipient/recipientSlice';

const confirmationDialogTitle = 'Are you sure you want to remove recipient?';
const requiredMessage = 'This is a required field';
const emailMessage = 'Please, enter a valid email';

/**
 * Use this component to display existing recipient and also add new one
 */
const RecipientForm = ({
  id,
  index,
  recipient,
  removeRecipient,
  updateRecipient,
  showRemoveBtn,
  recipientsLength,
  formsToValidate,
}) => {
  const dispatch = useDispatch();
  const { isAdmin, distributionMethod, defaultDate, defaultTime } = useSelector((state) => ({
    isAdmin: state.app.isAdmin,
    distributionMethod: state.recipient.distributionMethod.selected,
    defaultDate: state.recipient.defaultDate,
    defaultTime: state.recipient.defaultTime,
  }));
  const defaultValues = recipient || {
    id,
    send_on_date: defaultDate,
    send_on_time: defaultTime,
  };
  const validationData = {
    to_first_name: string().required(requiredMessage),
    to_last_name: string(),
    to_company_name: string(),
    from_first_name: string().required(requiredMessage),
    from_last_name: string(),
    from_company_name: string().required(requiredMessage),
    send_on_date: dateRule({ isRequired: false }),
    send_on_time: timeRule({ isRequired: false }),
  };
  const requireEmails = distributionMethod === 'gfg' || !isAdmin;

  if (requireEmails) {
    validationData.to_email = string().email(emailMessage).required(requiredMessage);
    validationData.from_email = string().email(emailMessage);
  }

  const validationSchema = object(validationData).required();
  const {
    register,
    watch,
    formState: { errors, isDirty, isValid },
    getValues,
    trigger,
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(validationSchema),
  });
  const formValues = watch();
  const [dialog, showDialog] = useState(false);
  const [recipientToRemove, setRecipientToRemove] = useState(null);
  const onRemove = () => {
    setRecipientToRemove(formValues.id);

    return showDialog(true);
  };
  const handleApprove = () => {
    removeRecipient(recipientToRemove);
  };

  useEffect(() => {
    const subscription = watch(updateRecipient);

    return () => subscription.unsubscribe();
  }, [formValues]);

  useEffect(() => {
    if (recipientsLength === 1) {
      dispatch(setIsFormDirty(isDirty));
    }
  }, [isDirty]);

  useEffect(() => {
    dispatch(
      updateRecipientFormsValidation({
        id: recipient.id,
        isValid,
      }),
    );
  }, [isValid]);

  useEffect(() => {
    if (formsToValidate && formsToValidate.indexOf(recipient.id) >= 0) {
      trigger();
    }
  }, [formsToValidate]);

  return (
    <>
      <form className="md:shadow-custom">
        <div className="bg-beige-300 md:flex md:justify-between px-9 py-2 hidden">
          <p className="font-crimsonpro text-1.5xl">{index}</p>
          <button className="btn-underline" type="button" onClick={onRemove}>
            {content.common.remove}
          </button>
        </div>
        <div className="md:bg-beige-light md:py-8 md:px-9 md:mb-9">
          <div className="flex flex-col">
            <div className="md:flex md:flex-col">
              <p className="mb-2 mt-2 md:mt-0 text-sm md:text-xs font-bold uppercase">{content.common.recipient}</p>
              <fieldset className="md:flex md:items-start">
                <input type="hidden" {...register('id')} />
                <div className="md:mr-6">
                  <Input
                    name="to_first_name"
                    error={errors.to_first_name}
                    label="Recipient First Name"
                    register={register}
                    inputValue={getValues('to_first_name')}
                  />
                </div>
                <div className="md:mr-6">
                  <Input
                    name="to_last_name"
                    error={errors.to_last_name}
                    label="Recipient Last Name (Optional)"
                    register={register}
                    inputValue={getValues('to_last_name')}
                  />
                </div>
                {requireEmails && (
                  <div className="md:mr-6">
                    <Input
                      name="to_email"
                      error={errors.to_email}
                      label="Recipient Email"
                      register={register}
                      inputValue={getValues('to_email')}
                    />
                  </div>
                )}
                <div className="md:mr-6">
                  <Input
                    name="to_company_name"
                    error={errors.to_company_name}
                    label="Recipient Company (Optional)"
                    register={register}
                    inputValue={getValues('to_company_name')}
                  />
                </div>
              </fieldset>
              <p className="mb-2 mt-2 md:mt-0 text-sm md:text-xs font-bold uppercase">{content.common.sender}</p>
              <fieldset className="md:flex md:items-start">
                <div className="md:mr-6">
                  <Input
                    name="from_first_name"
                    error={errors.from_first_name}
                    label="Sender First Name"
                    register={register}
                    inputValue={getValues('from_first_name')}
                  />
                </div>
                <div className="md:mr-6">
                  <Input
                    name="from_last_name"
                    error={errors.from_last_name}
                    label="Sender Last Name (Optional)"
                    register={register}
                    inputValue={getValues('from_last_name')}
                  />
                </div>
                {requireEmails && (
                  <div className="md:mr-6">
                    <Input
                      name="from_email"
                      error={errors.from_email}
                      label="Sender Email (Optional)"
                      register={register}
                      inputValue={getValues('from_email')}
                    />
                  </div>
                )}
                <div className="md:mr-6">
                  <Input
                    name="from_company_name"
                    error={errors.from_company_name}
                    label="Sender Company"
                    register={register}
                    inputValue={getValues('from_company_name')}
                  />
                </div>
              </fieldset>
            </div>
            <p className="mb-2 mt-2 md:mt-0 text-sm md:text-xs font-bold uppercase">{content.common.datetime}</p>
            <fieldset>
              <div className="md:flex">
                <div className="md:mr-6">
                  <Input
                    type="date"
                    name="send_on_date"
                    error={errors.send_on_date}
                    label="Send Email Date"
                    register={register}
                    min={moment().format('YYYY-MM-DD')}
                    inputValue={getValues('send_on_date')}
                  />
                </div>
                <Input
                  type="time"
                  name="send_on_time"
                  error={errors.send_on_time}
                  label="Send Email Time (PST)"
                  register={register}
                  inputValue={getValues('send_on_time')}
                />
              </div>
            </fieldset>
          </div>
          {showRemoveBtn && (
            <button className="btn-underline md:hidden" type="button" onClick={onRemove}>
              {content.common.remove}
            </button>
          )}
          <hr className="my-5 md:hidden" />
        </div>
      </form>
      {dialog && (
        <ConfirmationDialog
          isOpen={dialog}
          title={confirmationDialogTitle}
          showDialog={showDialog}
          handleApprove={handleApprove}
        />
      )}
    </>
  );
};

RecipientForm.propTypes = {
  id: PropTypes.number.isRequired,
  recipient: PropTypes.shape({
    id: PropTypes.number,
  }),
  removeRecipient: PropTypes.func,
  updateRecipient: PropTypes.func,
  index: PropTypes.number.isRequired,
  showRemoveBtn: PropTypes.bool,
  recipientsLength: PropTypes.number.isRequired,
  formsToValidate: PropTypes.arrayOf(PropTypes.number),
};

RecipientForm.defaultProps = {
  recipient: null,
  removeRecipient: () => {},
  updateRecipient: () => {},
  showRemoveBtn: true,
  formsToValidate: [],
};

export default RecipientForm;
