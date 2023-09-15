import { configureStore, combineReducers } from '@reduxjs/toolkit';

import appReducer from 'store/common/app/appSlice';
import errorReducer from 'store/common/error/errorSlice';

const combinedReducers = combineReducers({
  app: appReducer,
  error: errorReducer,
});

export default configureStore({
  reducer: combinedReducers,
});
