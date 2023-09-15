import { createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

const initialState = {
  active: 1,
  isValid: false,
  options: {
    1: {
      pathname: 'gifts',
      label: 'Gifts',
      isValid: true,
    },
    2: {
      pathname: 'recipients',
      label: 'Recipients',
      isValid: false,
    },
    3: {
      pathname: 'design',
      label: 'Design',
      isValid: false,
    },
    4: {
      pathname: 'payment',
      label: 'Payment',
      isValid: false,
    },
  },
};

const stepSlice = createSlice({
  name: 'step',
  initialState,
  reducers: {
    setStep: (state, action) => {
      const { payload: step } = action;
      state.active = parseInt(step, 10);
    },
    setStepValidity: (state, action) => {
      const {
        payload: { key, isValid },
      } = action;
      if (state.options[key]) {
        state.options[key].isValid = isValid;
      }
    },
  },
  extraReducers(builder) {
    builder.addCase(PURGE, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const { setStep, setStepValidity } = stepSlice.actions;

export default stepSlice.reducer;
