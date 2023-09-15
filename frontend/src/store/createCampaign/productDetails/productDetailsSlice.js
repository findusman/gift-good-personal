import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

import { fetchShopifyApi } from 'helpers/fetchData';

const initialState = {
  status: '',
  data: null,
  error: '',
};

export const fetchProductDetails = createAsyncThunk('productDetails', async ({ productId }, { rejectWithValue }) => {
  try {
    const response = await fetchShopifyApi({
      method: 'post',
      body: JSON.stringify({
        query: `query getProduct {
          product(id: "gid://shopify/Product/${productId}") {
            title
            descriptionHtml
            images(first: 20) {
              edges {
                node {
                  src
                }
              }
            }
            tags
            impactShortDescription: metafield(namespace: "impact", key: "description_short") {
              value
            }
            impactImage: metafield(namespace: "impact", key: "image") {
              value
            }
            impactStoryDescription: metafield(namespace: "impact", key: "description") {
              value
            }
            impactIcon: metafield(namespace: "impact", key: "icon") {
              value
            }
            impactCard: metafield(namespace: "impact", key: "card") {
              value
            }
            ungoals: metafields(namespace: "ungoals", first: 20) {
              edges {
                node {
                  key
                  value
                }
              }
            }
          }
        }`,
      }),
    });

    return {
      data: response.data.data.product,
    };
  } catch (e) {
    return rejectWithValue(e);
  }
});

const productDetailsSlice = createSlice({
  name: 'productDetails',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.data = action.payload.data || {};
        state.status = 'succeeded';
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      });
  },
});

export default productDetailsSlice.reducer;
