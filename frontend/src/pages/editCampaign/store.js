import { configureStore, combineReducers } from '@reduxjs/toolkit';

import appReducer from 'store/common/app/appSlice';
import errorReducer from 'store/common/error/errorSlice';
import campaignReducer from 'store/editCampaign/campaign/campaignSlice';
import recipientReducer from 'store/createCampaign/recipient/recipientSlice';
import designReducer from 'store/createCampaign/design/designSlice';

const combinedReducers = combineReducers({
  app: appReducer,
  error: errorReducer,
  campaign: campaignReducer,
  recipient: recipientReducer,
  design: designReducer,
});

export default configureStore({
  reducer: combinedReducers,
});
