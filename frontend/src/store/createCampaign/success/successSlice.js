import { createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

const initialState = {
  isSuccess: false,
  title: '',
};

const successSlice = createSlice({
  name: 'success',
  initialState,
  reducers: {
    setSuccessData: (state, action) => {
      const {
        payload: { title },
      } = action;
      state.title = title;
      state.isSuccess = true;
    },
  },
  extraReducers(builder) {
    builder.addCase(PURGE, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const { setSuccessData } = successSlice.actions;

export default successSlice.reducer;
