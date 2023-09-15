const fetchData = async ({ url, method, body = null, headers = null }) => {
  let data = null;
  let error = null;

  try {
    const params = {};

    if (body) {
      params.body = body;
    }

    if (headers) {
      params.headers = headers;
    }

    const response = await window.fetch(url, {
      method,
      ...params,
    });
    data = await response.json();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    error = e;
  }
  return { data, error };
};

export const fetchShopifyApi = async (params) => {
  const newParams = params;
  newParams.url = `https://${process.env.SHOPIFY_APP_NAME}/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`;
  newParams.headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN,
    ...params.headers,
  };
  return fetchData(newParams);
};

export const fetchLocalApi = async (params) => {
  const newParams = params;
  newParams.url = `/api/v1/${params.url}`;
  newParams.headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };
  return fetchData(newParams);
};

export default fetchData;
