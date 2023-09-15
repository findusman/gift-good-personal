/* eslint-disable camelcase */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLocalApi } from 'helpers/fetchData';
import {
  setFormData,
  setSubject,
  setEmailMessage,
  setLandingPageMessage,
} from 'store/createCampaign/design/designSlice';
import { deserializeHtml } from 'components/common/editor/utils';

const initialState = {
  data: {},
  status: '',
  error: '',
};

export const getCampaignData = createAsyncThunk(
  'campaign/getCampaignData',
  async (data, { rejectWithValue, dispatch }) => {
    const searchParams = new URLSearchParams(window.location.search);
    const cid = searchParams.get('cid');
    try {
      const response = await fetchLocalApi({
        method: 'get',
        url: `campaign/get-data?cid=${cid}`,
      });
      const campaignData = response?.data?.campaign;
      if (campaignData) {
        dispatch(setSubject(deserializeHtml(campaignData.subject)));
        dispatch(setEmailMessage(deserializeHtml(campaignData.emailMessage)));
        dispatch(setLandingPageMessage(deserializeHtml(campaignData.landingMessage)));
        dispatch(setFormData(campaignData));
      }
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const updateCampaignContent = createAsyncThunk(
  'campaign/updateCampaignContent',
  async ({ cid, type }, { rejectWithValue, getState }) => {
    const globalState = getState();
    try {
      const value = globalState.design.formData[type];
      const response = await fetchLocalApi({
        method: 'post',
        url: 'campaign/update-content',
        body: JSON.stringify({
          cid,
          value,
          type,
        }),
      });
      // TODO Refactor when we rewrite the whole edit campaign page
      if (response?.data?.status === 'success') {
        window.showInfo(response.data.msg);
      } else {
        window.showError(response.error);
      }
    } catch (e) {
      rejectWithValue(e);
    }
  },
);

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getCampaignData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getCampaignData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload.data.campaign || {};
      })
      .addCase(getCampaignData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      })
      .addCase(updateCampaignContent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateCampaignContent.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateCampaignContent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      });
  },
});

export const { setCampaignName, setCampaignDialogVisibility } = campaignSlice.actions;

export default campaignSlice.reducer;
