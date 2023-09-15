import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import moment from 'moment';

import { fetchLocalApi } from 'helpers/fetchData';
import { recipientsStep } from 'data/content.json';

const initialState = {
  learnMoreVisible: false,
  recipientsDialogVisible: false,
  importerDialogVisible: false,
  dateDialogVisible: false,
  distributionMethod: {
    selected: '',
    options: [
      {
        key: 'gfg',
        text: recipientsStep.distribution.gfg.title,
        description: recipientsStep.distribution.gfg.description,
      },
      {
        key: 'self',
        text: recipientsStep.distribution.self.title,
        description: recipientsStep.distribution.self.description,
        note: recipientsStep.distribution.self.note,
      },
    ],
  },
  entryMethod: {
    selected: '', // upload vs enter manually
    options: [
      {
        key: 'upload',
        text: 'Add Recipients',
        useFileUpload: true,
      },
      {
        key: 'manual',
        text: 'Add Recipients',
        useFileUpload: false,
      },
    ],
  },
  recipients: [],
  recipientFormsValidation: [],
  isFormDirty: false,
  unsupportedTags: [],
  defaultDate: '',
  defaultTime: '',
  campaignExpiration: {
    selected: '3',
    options: [
      {
        key: '1',
        label: '1 Month',
      },
      {
        key: '2',
        label: '2 Months',
      },
      {
        key: '3',
        label: '3 Months',
      },
      {
        key: '4',
        label: '4 Months',
      },
      {
        key: '5',
        label: '5 Months',
      },
      {
        key: '6',
        label: '6 Months',
      },
      {
        key: '12',
        label: '12 Months',
      },
    ],
  },
  template: {
    name: '',
    status: '',
    error: '',
  },
  templateDelete: {
    status: '',
    error: '',
  },
  addRecipientsStatus: {
    status: '',
    error: '',
  },
};

export const fetchTemplate = createAsyncThunk(
  'recipients/fetchTemplate',
  async ({ date, time }, { rejectWithValue }) => {
    const params = new URLSearchParams({ date, time });
    try {
      const response = await fetchLocalApi({
        method: 'get',
        url: `recipients/template?${params}`,
      });
      return response.data.name;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const deleteTemplate = createAsyncThunk(
  'recipients/deleteTemplate',
  async ({ templateKey }, { rejectWithValue }) => {
    const params = new URLSearchParams({ templateKey });
    try {
      const response = await fetchLocalApi({
        method: 'delete',
        url: `recipients/template?${params}`,
      });
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

export const addRecipients = createAsyncThunk('recipients/add', async (contacts, { rejectWithValue }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const cid = searchParams.get('cid');
  try {
    const response = await fetchLocalApi({
      method: 'post',
      url: 'recipients/add',
      body: JSON.stringify({ cid, contacts }),
    });
    // TODO: Refactor this after we change the whole edit campaign page
    if (response?.data?.status === 'success') {
      window.showInfo(response.data.msg);
      return response;
    }
    window.showError(response.data.msg);
    return rejectWithValue(response);
  } catch (e) {
    return rejectWithValue(e);
  }
});

const recipientSlice = createSlice({
  name: 'recipient',
  initialState,
  reducers: {
    setRecipientLearnMoreVisibility: (state, action) => {
      state.learnMoreVisible = action.payload;
    },
    setRecipientsDialogVisibility: (state, action) => {
      state.recipientsDialogVisible = action.payload;
    },
    setImporterDialogVisibility: (state, action) => {
      state.importerDialogVisible = action.payload;
    },
    setDateDialogVisibility: (state, action) => {
      state.dateDialogVisible = action.payload;
    },
    setDistributionMethod: (state, action) => {
      state.distributionMethod.selected = action.payload;
    },
    setEntryMethod: (state, action) => {
      state.entryMethod.selected = action.payload;
    },
    storeRecipients: (state, action) => {
      const smartTags = [
        'from_first_name',
        'from_last_name',
        'from_email',
        'from_company_name',
        'to_first_name',
        'to_last_name',
        'to_email',
        'to_company_name',
      ];
      const unsupportedTags = [];
      const recipients = action.payload.map((recipient) => {
        smartTags
          .filter((tag) => unsupportedTags.indexOf(tag) < 0)
          .forEach((tag) => {
            if (!(recipient[tag] || tag === 'signature')) {
              unsupportedTags.push(tag);
            }
          });

        return {
          ...recipient,
          send_on_date: recipient.send_on_date ? moment(recipient.send_on_date).format('YYYY-MM-DD') : '',
        };
      });
      state.recipients = recipients;
      state.unsupportedTags = unsupportedTags;
    },
    updateCampaignExpiration: (state, action) => {
      state.campaignExpiration.selected = action.payload;
    },
    setDefaultDateAndTime: (state, action) => {
      state.defaultDate = action.payload.date;
      state.defaultTime = action.payload.time;
    },
    setIsFormDirty: (state, action) => {
      state.isFormDirty = action.payload;
    },
    updateRecipientFormsValidation: (state, action) => {
      const existingValidation = JSON.parse(JSON.stringify(state.recipientFormsValidation));
      const found = existingValidation.find((item) => item.id === action.payload.id);

      if (found) {
        state.recipientFormsValidation = existingValidation.map((item) => {
          return item.id === action.payload.id ? action.payload : item;
        });
      } else {
        state.recipientFormsValidation.push(action.payload);
      }
    },
    removeFormValidation: (state, action) => {
      state.recipientFormsValidation.splice(
        state.recipientFormsValidation.findIndex((element) => element.id === action.payload),
        1,
      );
    },
  },
  extraReducers(builder) {
    builder.addCase(PURGE, (state) => {
      Object.assign(state, initialState);
    });
    builder.addCase(fetchTemplate.pending, (state) => {
      state.template.status = 'loading';
    });
    builder.addCase(fetchTemplate.fulfilled, (state, action) => {
      state.template.status = 'success';
      state.template.error = '';
      state.template.name = action.payload;
      state.importerDialogVisible = true;
      state.dateDialogVisible = false;
    });
    builder.addCase(fetchTemplate.rejected, (state, action) => {
      state.template.status = 'failed';
      state.template.error = action.error && action.error.message;
    });
    builder.addCase(deleteTemplate.pending, (state) => {
      state.templateDelete.status = 'loading';
    });
    builder.addCase(deleteTemplate.fulfilled, (state) => {
      state.templateDelete.status = 'success';
      state.templateDelete.error = '';
      state.template.name = '';
    });
    builder.addCase(deleteTemplate.rejected, (state, action) => {
      state.templateDelete.status = 'failed';
      state.templateDelete.error = action.error && action.error.message;
    });
    builder.addCase(addRecipients.pending, (state) => {
      state.addRecipientsStatus.status = 'loading';
    });
    builder.addCase(addRecipients.fulfilled, (state) => {
      state.addRecipientsStatus.status = 'success';
      state.addRecipientsStatus.error = '';
      // TODO Remove when we refactor the whole edit campaign page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });
    builder.addCase(addRecipients.rejected, (state, action) => {
      state.addRecipientsStatus.status = 'failed';
      state.addRecipientsStatus.error = action.error && action.error.message;
    });
  },
});

export const {
  setRecipientLearnMoreVisibility,
  setRecipientsDialogVisibility,
  setImporterDialogVisibility,
  setDateDialogVisibility,
  setDistributionMethod,
  setEntryMethod,
  storeRecipients,
  updateCampaignExpiration,
  setDefaultDateAndTime,
  setIsFormDirty,
  updateRecipientFormsValidation,
  removeFormValidation,
} = recipientSlice.actions;

export default recipientSlice.reducer;
