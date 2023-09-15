import { createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import moment from 'moment';

import packageData from '../../../../package.json';

// Each time the store structure is considerably changed (meaning that using persisted outdated state will result
// in an app error), update the package version (patch number) in package.json. It will cause the app to reset its state.
const initialState = {
  version: packageData.version,
  isAdmin: document.querySelector('#root').getAttribute('data-is-admin') === 'true',
  isLoading: false,
  duration: 0,
  isMobile: false,
  expirationTime: null,
};

function isPendingAction(action) {
  return action.type.endsWith('pending');
}

function isFinishedAction(action) {
  return action.type.endsWith('rejected') || action.type.endsWith('fulfilled');
}

function isCustomAction(action) {
  const types = ['campaign', 'design', 'payment', 'productDetails', 'products', 'recipient', 'step'];
  return types.some((type) => action.type.startsWith(type));
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setIsLoading: (state, action) => {
      state.isLoading = action.payload.loading;
      state.duration = action.payload.duration || 0;
    },
    setIsMobile: (state, action) => {
      state.isMobile = action.payload.isMobile;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addMatcher(isCustomAction, (state) => {
        state.expirationTime = moment().add(15, 'minutes');
      })
      .addMatcher(isPendingAction, (state) => {
        state.isLoading = true;
        state.duration = 0;
      })
      .addMatcher(isFinishedAction, (state) => {
        state.isLoading = false;
        state.duration = 0;
      });
  },
});

export default appSlice.reducer;
export const { setIsLoading, setIsMobile } = appSlice.actions;
