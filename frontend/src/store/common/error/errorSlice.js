import { createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

const initialState = {
  isOpen: false,
  title: '',
  content: '',
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setError: (state, action) => {
      const {
        payload: { title, content },
      } = action;
      state.title = title;
      state.content = content;
      state.isOpen = true;
    },
    hideError: (state) => {
      state.title = '';
      state.content = '';
      state.isOpen = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(PURGE, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const { setError, hideError } = errorSlice.actions;

export default errorSlice.reducer;
