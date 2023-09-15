const axios = require('axios');
const { nanoid } = require('nanoid');
const moment = require('moment');

const oneSchemaAxios = axios.create({
  baseURL: 'https://api.oneschema.co/templates',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': process.env.ONESCHEMA_API_KEY,
  }
});

const getTemplate = async (templateKey) => {
  try {
    const response = await oneSchemaAxios({
      method: 'get',
      url: `/export/${templateKey}`,
    });
    return response.data;
  }
  catch(e) {
    console.error(e);
  }
};

const createDynamicTemplate = async ({ date, time, masterTemplate }) => {
  const columns = masterTemplate.columns.map(el => {
    if (el.key === 'send_on_time') {
      return {
        ...el,
        default_value: time,
      }
    } else if (el.key === 'send_on_date') {
      return {
        ...el,
        default_value: moment(date).format('MM/DD/YYYY'),
      }
    } else {
      return el;
    }
  });
  const name = `${moment().format('YYYYMMDD')}-${nanoid(8)}`;
  try {
    const response = await oneSchemaAxios({
      method: 'post',
      url: '/import',
      data: {
        template_key: name,
        name: name,
        columns
      }
    });
    return { response, name };
  } catch(e) {
    console.error(e);
  }
};

const deleteTemplate = async (templateKey) => {
  try {
    const response = await oneSchemaAxios({
      method: 'delete',
      url: `/${templateKey}`,
    });
    return response;
  } catch(e) {
    console.error(e);
  }
};

module.exports = {
  getTemplate,
  createDynamicTemplate,
  deleteTemplate
};