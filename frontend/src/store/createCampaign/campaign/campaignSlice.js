/* eslint-disable camelcase */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { persistStore, PURGE } from 'redux-persist';
import { fetchLocalApi } from 'helpers/fetchData';
import { setSuccessData } from 'store/createCampaign/success/successSlice';

const initialState = {
  title: '',
  initialized: false,
  dialogVisible: true,
  status: '',
  error: '',
};

export const createCampaign = createAsyncThunk(
  'campaign/createCampaign',
  async (data, { rejectWithValue, getState, dispatch }) => {
    const globalState = getState();
    const {
      app: { isAdmin },
      campaign: { title },
      collection: {
        currentCollection: { price, id: collection_id },
      },
      recipient: {
        distributionMethod: { selected: selectedDistributionMethod },
        recipients: contacts,
        campaignExpiration: { selected: months_to_expiration },
      },
      design: {
        formData: {
          banner,
          logo,
          landingMessage: message,
          emailMessage: email_message,
          signature,
          subject: email_subject,
          video,
          includeLogoInEmail: email_include_logo,
          includeBannerInEmail: email_include_banner,
          includeGiftsForGoodLogo: email_include_gfg_logo,
          includeLogoOnLanding: landing_include_logo,
          includeBannerOnLanding: landing_include_banner,
        },
      },
      payment: { shouldDonate: donate_unredeemed },
    } = globalState;
    const campaignData = {
      title,
      price,
      collection_id,
      months_to_expiration,
      donate_unredeemed,
      no_email_invite: isAdmin && selectedDistributionMethod !== 'gfg',
      brands: {
        banner,
        logo,
        video,
        message,
        email_message,
        signature,
        email_subject,
        email_include_logo,
        email_include_banner,
        email_include_gfg_logo,
        landing_include_logo,
        landing_include_banner,
      },
      contacts,
    };
    try {
      const response = await fetchLocalApi({
        method: 'post',
        url: `campaign/create`,
        body: JSON.stringify({ campaignData }),
      });
      // TODO Update to handle showing error message
      if (response.data.status === 'success') {
        persistStore({ dispatch }).purge();
        dispatch(setSuccessData({ title }));
      }
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setCampaignDialogVisibility: (state, action) => {
      state.dialogVisible = action.payload;
    },
    setCampaignName: (state, action) => {
      if (!state.initialized) {
        state.initialized = true;
      }
      state.title = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(createCampaign.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createCampaign.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      });
  },
});

export const { setCampaignName, setCampaignDialogVisibility } = campaignSlice.actions;

export default campaignSlice.reducer;
