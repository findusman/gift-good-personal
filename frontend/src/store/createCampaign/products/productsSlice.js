import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

import { fetchLocalApi } from 'helpers/fetchData';

const initialState = {
  // Multiple possible status enum values
  status: 'idle',
  hasMore: false,
  page: 1,
  data: [],
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'collection/fetchProducts',
  async ({ collectionId, page = 1 }, { rejectWithValue }) => {
    const count = 12;
    const offset = page > 1 ? count * page - count : 0;
    const params = new URLSearchParams({
      collectionId,
      count,
      offset,
    });
    try {
      const response = await fetchLocalApi({
        method: 'get',
        url: `catalog/collection-products?${params}`,
      });

      return {
        products: response.data.products,
        collectionId,
        offset,
        count,
        page,
      };
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const products = action.payload.products || [];
        state.status = 'succeeded';
        if (action.payload.offset > 0) {
          products.forEach((product) => state.data.push(product));
        } else {
          state.data = products;
        }
        state.page = action.payload.page;
        // todo: can cause inccorect value if on next page we will have 0 items but there is no information in API about total products
        state.hasMore = products.length === action.payload.count;
        state.collectionId = action.payload.collectionId;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      });
  },
});

export default productsSlice.reducer;
