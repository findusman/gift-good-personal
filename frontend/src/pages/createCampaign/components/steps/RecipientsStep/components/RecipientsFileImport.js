import React from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import { object } from 'yup';
import {
  setImporterDialogVisibility,
  setDateDialogVisibility,
  fetchTemplate,
} from 'store/createCampaign/recipient/recipientSlice';
import moment from 'moment';
import { dateRule, timeRule } from 'helpers/validationRules';
import content from 'data/content.json';
import { Input } from 'components/layout';
import OneSchemaImport from './OneSchemaImport';

const validationSchema = object({
  date: dateRule({ isRequired: true }),
  time: timeRule({ isRequired: true }),
}).required();

const RecipientsFileImport = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => {
    return state.recipient.dateDialogVisible;
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(validationSchema),
  });
  const onSubmit = (data) => {
    const { date, time } = data;
    dispatch(fetchTemplate({ date, time }));
  };
  const handleSkip = () => {
    dispatch(setDateDialogVisibility(false));
    dispatch(setImporterDialogVisibility(true));
  };
  return (
    <>
      <Dialog open={isOpen} onClose={() => dispatch(setDateDialogVisibility(false))} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white p-10 w-125">
              <Dialog.Title className="text-2.6xl md:text-3xl">
                {content.recipientsStep.dateTimeModal.title}
              </Dialog.Title>
              <Dialog.Description className="mt-6 mb-4">
                <p className="mb-2.5">{content.recipientsStep.dateTimeModal.description}</p>
                <p>{content.recipientsStep.noDateDescription}</p>
              </Dialog.Description>
              <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset className="flex flex-col md:flex-row md:justify-between">
                  <Input
                    name="date"
                    error={errors.date}
                    label="Send Email Date"
                    type="date"
                    register={register}
                    inputValue={getValues('date')}
                    min={moment().format('YYYY-MM-DD')}
                  />
                  <Input
                    name="time"
                    error={errors.time}
                    label="Send Email Time"
                    type="time"
                    register={register}
                    inputValue={getValues('time')}
                  />
                </fieldset>
                <div className="flex justify-center mt-4 md:mt-0">
                  <button type="button" className="btn-secondary mr-6" onClick={handleSkip}>
                    {content.common.skip}
                  </button>
                  <button type="submit" className="btn-primary min-w-[104px]">
                    {content.common.next}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
      <OneSchemaImport />
    </>
  );
};

export default RecipientsFileImport;
