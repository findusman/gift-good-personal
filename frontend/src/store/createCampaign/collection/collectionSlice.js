import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

import { fetchLocalApi } from 'helpers/fetchData';

const rootElement = document.querySelector('#root');
const initialState = {
  dialogVisible: false,
  learnMoreVisible: false,
  // todo: maybe replace with API call / configuration
  // todo: currently there is no type definition on collection
  types: [
    {
      key: 'gifts',
      title: 'Gift Collection',
      description:
        'Your recipient can either select a physical gift, or give to a charity. Gifts can only be sent to recipients in the U.S.',
    },
    {
      key: 'donation',
      title: 'Charity Giving Collection',
      description: 'Give to a charity in honor of your gift recipients. Available anywhere in the world.',
    },
    {
      key: 'international',
      title: 'International (outside the U.S.)',
      description:
        'For recipients outside of the United States. Recipients in eligible countries can either select a physical gift, or give to a charity.',
    },
  ],
  currentCollection: {
    id: '',
    title: '',
    price: '',
    type: 'gifts',
  },
  defaultCollectionId: rootElement.getAttribute('data-default-collection'),
  defaultCharityCollectionId: rootElement.getAttribute('data-default-charity-collection'),
  defaultIntlCollectionId: rootElement.getAttribute('data-default-intl-collection'),
  collections: {
    status: 'idle',
    data: [],
    error: null,
  },
};

export const fetchCollections = createAsyncThunk('collection/fetch', async (data, { rejectWithValue }) => {
  try {
    const response = await fetchLocalApi({
      method: 'get',
      url: 'catalog/collections',
    });

    return response.data.collections;
  } catch (e) {
    return rejectWithValue(e);
  }
});

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    setCollectionDialogVisibility: (state, action) => {
      state.dialogVisible = action.payload;
    },
    setCollectionLearnMoreVisibility: (state, action) => {
      state.learnMoreVisible = action.payload;
    },
    setCurrentCollection(state, action) {
      const { id, title, titleShort, titleLong, titleDropdown, price, type } = action.payload;
      state.currentCollection = {
        id,
        title,
        titleShort: titleShort || title,
        titleLong: titleLong || title,
        titleDropdown: titleDropdown || '',
        price,
        type,
      };
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(fetchCollections.pending, (state) => {
        state.collections.status = 'loading';
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.collections.status = 'succeeded';
        state.collections.data = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.collections.status = 'failed';
        state.collections.error = action.error && action.error.message;
      });
  },
});

export const { setCurrentCollection, setCollectionDialogVisibility, setCollectionLearnMoreVisibility } =
  collectionSlice.actions;

export default collectionSlice.reducer;
