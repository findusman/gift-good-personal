import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import classnames from 'classnames';

import BaseDialog from 'components/common/BaseDialog';
import { setCampaignName, setCampaignDialogVisibility } from 'store/createCampaign/campaign/campaignSlice';
import content from 'data/content.json';

const PanelContent = () => {
  const { title, initialized } = useSelector((state) => ({
    title: state.campaign.title,
    initialized: state.campaign.initialized,
  }));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      campaignTitle: title,
    },
  });
  const dispatch = useDispatch();
  const onSubmit = handleSubmit(async (data) => {
    await dispatch(setCampaignName(data.campaignTitle));
    await dispatch(setCampaignDialogVisibility(false));
  });
  const description = initialized
    ? 'Update the campaign title.'
    : `Create a title to remember your gift campaign. For example, "U.S. Client Holiday Gifts" or "Women's Summit Recognition Event"`;
  const btnText = initialized ? 'Update' : 'Start';
  const titleText = initialized ? 'Edit Campaign' : 'Create Campaign';

  return (
    <>
      <h2 className="text-2.6xl 2xl:text-4.2xl font-crimsonpro">{titleText}</h2>
      <p className="mt-5 2xl:mt-8 text-base font-lato">{description}</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="campaignTitle">
          <span className="mt-13 table w-full font-lato text-xs uppercase font-bold tracking-widest">
            {content.common.campaignName}
          </span>
          <input
            id="campaignTitle"
            className={classnames('border border-black mt-3 h-16 w-full 2xl:w-96 p-3', {
              'outline-red-error outline-1.5': errors.campaignTitle,
            })}
            type="text"
            {...register('campaignTitle', { required: 'This is a required field.' })}
          />
          {errors.campaignTitle && <p className="text-red-error text-sm mt-1">{errors.campaignTitle.message}</p>}
        </label>
        <button className="mt-9 2xl:mt-19 block btn-primary px-8.75" type="submit">
          {btnText}
        </button>
      </form>
    </>
  );
};
const CampaignSidebar = () => {
  const { visible, initialized, isSuccess } = useSelector((state) => ({
    initialized: state.campaign.initialized,
    visible: state.campaign.dialogVisible,
    isSuccess: state.success.isSuccess,
  }));
  const dispatch = useDispatch();
  const handleClose = () => {
    if (!initialized) {
      return;
    }

    dispatch(setCampaignDialogVisibility(false));
  };

  if (!visible || isSuccess) {
    return null;
  }

  return (
    <BaseDialog
      visible={visible}
      handleClose={handleClose}
      hideCloseIcon={!initialized}
      panelContent={<PanelContent />}
      paddingY="py-32"
    />
  );
};

export default CampaignSidebar;
