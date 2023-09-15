import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

import { fetchLocalApi } from 'helpers/fetchData';

const initialState = {
  learnMoreVisible: false,
  useCredits: false,
  amountToPay: 0,
  payWithCard: false,
  isCardPaymentValid: false,
  initializePayment: false,
  payment: {
    status: '',
    error: '',
  },
  balance: {
    value: 0,
    status: '',
    error: '',
  },
  shouldDonate: false,
};

export const getUserBalance = createAsyncThunk('payment/getBalance', async (data, { rejectWithValue }) => {
  try {
    const response = await fetchLocalApi({
      method: 'get',
      url: `payments/balance`,
    });
    return {
      balance: response.data.balance,
    };
  } catch (e) {
    return rejectWithValue(e);
  }
});

export const payWithStripe = createAsyncThunk('payment/payWithStripe', async (data, { rejectWithValue }) => {
  const { stripe, card, clientSecret, amountToPay, billingData } = data;
  try {
    const stripeResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: billingData,
      },
    });

    if (stripeResult.error) {
      return rejectWithValue(stripeResult.error.message);
    }

    const savePurchaseResult = await fetchLocalApi({
      method: 'post',
      url: 'payments/purchase-credits',
      body: JSON.stringify({ price: amountToPay, credit: amountToPay, stripeId: stripeResult.paymentIntent.id }),
    });

    if (savePurchaseResult.error) {
      return rejectWithValue(savePurchaseResult.error);
    }

    return savePurchaseResult;
  } catch (e) {
    return rejectWithValue(e);
  }
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentLearnMoreVisibility: (state, action) => {
      state.learnMoreVisible = action.payload;
    },
    setUseCredits: (state, action) => {
      state.useCredits = action.payload;
    },
    setAmountToPay: (state, action) => {
      state.amountToPay = action.payload;
    },
    setPayWithCard: (state, action) => {
      state.payWithCard = action.payload;
    },
    setInitializePayment: (state, action) => {
      state.initializePayment = action.payload;
    },
    setIsCardPaymentValid: (state, action) => {
      state.isCardPaymentValid = action.payload;
    },
    resetPaymentStep: (state) => {
      Object.assign(state, initialState);
    },
    setShouldDonate: (state, action) => {
      state.shouldDonate = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(getUserBalance.pending, (state) => {
        state.balance.status = 'loading';
      })
      .addCase(getUserBalance.fulfilled, (state, action) => {
        const {
          payload: { balance },
        } = action;
        state.balance.status = 'succeeded';
        state.balance.value = balance;
      })
      .addCase(getUserBalance.rejected, (state, action) => {
        state.balance.status = 'failed';
        state.balance.error = action.error && action.error.message;
      })
      .addCase(payWithStripe.pending, (state) => {
        state.initializePayment = false;
        state.payment.status = 'loading';
        state.payment.error = null;
      })
      .addCase(payWithStripe.fulfilled, (state) => {
        state.payment.status = 'succeeded';
      })
      .addCase(payWithStripe.rejected, (state, action) => {
        state.payment.status = 'rejected';
        state.payment.error = action.payload;
      });
  },
});

export default paymentSlice.reducer;
export const {
  setPaymentLearnMoreVisibility,
  setUseCredits,
  setAmountToPay,
  setPayWithCard,
  setInitializePayment,
  setIsCardPaymentValid,
  resetPaymentStep,
  setShouldDonate,
} = paymentSlice.actions;
