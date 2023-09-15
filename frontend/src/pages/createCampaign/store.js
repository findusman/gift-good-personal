import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import appReducer from 'store/common/app/appSlice';
import campaignReducer from 'store/createCampaign/campaign/campaignSlice';
import collectionReducer from 'store/createCampaign/collection/collectionSlice';
import designSliceReducer from 'store/createCampaign/design/designSlice';
import productsReducer from 'store/createCampaign/products/productsSlice';
import recipientReducer from 'store/createCampaign/recipient/recipientSlice';
import stepReducer from 'store/createCampaign/step/stepSlice';
import paymentReducer from 'store/createCampaign/payment/paymentSlice';
import successReducer from 'store/createCampaign/success/successSlice';
import productDetailsReducer from 'store/createCampaign/productDetails/productDetailsSlice';
import errorReducer from 'store/common/error/errorSlice';

const recipientPersistConfig = {
  key: 'recipient',
  storage,
  blacklist: ['recipientFormsValidation'],
};
const designPersistConfig = {
  key: 'design',
  storage,
  blacklist: ['libraryUpload'],
};
const combinedReducer = combineReducers({
  app: appReducer,
  campaign: campaignReducer,
  collection: collectionReducer,
  design: persistReducer(designPersistConfig, designSliceReducer),
  products: productsReducer,
  recipient: persistReducer(recipientPersistConfig, recipientReducer),
  step: stepReducer,
  payment: paymentReducer,
  success: successReducer,
  productDetails: productDetailsReducer,
  error: errorReducer,
});
const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['design', 'recipient', 'success', 'error', 'payment'],
};

export const persistedReducer = persistReducer(persistConfig, combinedReducer);
export default configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
