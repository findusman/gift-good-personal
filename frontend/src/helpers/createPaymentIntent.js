import { fetchLocalApi } from 'helpers/fetchData';

const createPaymentIntent = async (price) => {
  try {
    const response = await fetchLocalApi({
      method: 'post',
      url: 'payments/payment-intent',
      body: JSON.stringify({ price }),
    });

    return response.data.clientSecret;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return e;
  }
};

export default createPaymentIntent;
