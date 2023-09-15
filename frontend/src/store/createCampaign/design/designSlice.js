import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLocalApi } from 'helpers/fetchData';
import { PURGE } from 'redux-persist';

export const smartTags = [
  {
    key: '[Sender First Name]',
    label: 'Sender First Name',
    format: ':sender_first_name',
    relatedFormField: 'from_first_name',
    order: {
      emailMessage: 4,
    },
  },
  {
    key: '[Sender Last Name]',
    label: 'Sender Last Name',
    format: ':sender_last_name',
    relatedFormField: 'from_last_name',
    order: {
      emailMessage: 5,
    },
  },
  {
    key: '[Sender Email]',
    label: 'Sender Email',
    format: ':sender_email',
    relatedFormField: 'from_email',
    order: {
      emailMessage: 6,
    },
  },
  {
    key: '[Sender Company]',
    label: 'Sender Company',
    format: ':sender_company',
    relatedFormField: 'from_company_name',
    order: {
      emailMessage: 7,
    },
  },
  {
    key: '[Recipient First Name]',
    label: 'Recipient First Name',
    format: ':first_name',
    relatedFormField: 'to_first_name',
    order: {
      emailMessage: 1,
    },
  },
  {
    key: '[Recipient Last Name]',
    label: 'Recipient Last Name',
    format: ':last_name',
    relatedFormField: 'to_last_name',
    order: {
      emailMessage: 2,
    },
  },
  {
    key: '[Recipient Email]',
    label: 'Recipient Email',
    format: ':email',
    relatedFormField: 'to_email',
    excludedFor: ['emailMessage'],
    order: {
      emailMessage: 8,
    },
  },
  {
    key: '[Recipient Company Name]',
    label: 'Recipient Company Name',
    format: ':company',
    relatedFormField: 'to_company_name',
    order: {
      emailMessage: 3,
    },
  },
];

const initialState = {
  learnMoreVisible: false,
  smartTagsDialogVisible: false,
  formData: {
    subject: '',
    emailMessage: '',
    landingMessage: '',
    logo: '',
    includeLogoOnLanding: false,
    includeLogoInEmail: false,
    includeGiftsForGoodLogo: true,
    banner: '/resources/images/assets/banner/1_Every_gift_gives_back.jpg',
    includeBannerOnLanding: true,
    includeBannerInEmail: true,
    video: '/resources/videos/default.mp4',
  },
  libraryUpload: null,
  subject: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'span',
          text: '',
        },
        {
          type: 'smart-tag',
          value: '[Sender First Name]',
          format: ':sender_first_name',
          children: [
            {
              type: 'span',
              text: ' ',
              marks: [],
            },
          ],
        },
        {
          type: 'span',
          text: ' at ',
        },
        {
          type: 'smart-tag',
          value: '[Sender Company]',
          format: ':sender_company',
          children: [
            {
              type: 'span',
              text: ' ',
              marks: [],
            },
          ],
        },
        {
          type: 'span',
          text: ' has sent you a gift for good!',
        },
      ],
    },
  ],
  landingMessage: [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ],
  emailMessage: [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ],
  signature: [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ],
  richTextsValidation: {
    subject: false,
    emailMessage: false,
  },
  smartTags,
  isEditionInitialized: false,
  update: {
    error: '',
    status: '',
  },
};

export const updateCampaignMedia = createAsyncThunk(
  'design/updateCampaignMedia',
  async ({ cid, type }, { rejectWithValue, getState }) => {
    const state = getState();
    try {
      const {
        design: {
          formData,
          formData: {
            includeLogoOnLanding,
            includeLogoInEmail,
            includeGiftsForGoodLogo,
            includeBannerOnLanding,
            includeBannerInEmail,
          },
        },
      } = state;
      let data = {};
      if (type === 'banner') {
        data = {
          includeBannerOnLanding,
          includeBannerInEmail,
        };
      } else if (type === 'logo') {
        data = {
          includeLogoOnLanding,
          includeLogoInEmail,
          includeGiftsForGoodLogo,
        };
      }
      const response = await fetchLocalApi({
        method: 'post',
        url: 'campaign/update-campaign',
        body: JSON.stringify({
          cid,
          type: 'update',
          media_url: formData[type],
          media: type,
          data,
        }),
      });
      // TODO Refactor when we update the whole edit campaign page
      if (response?.data?.status === 'success') {
        window.showInfo(response.msg);
        return response;
      }
      window.showError(`${type} upload failed`);
      return rejectWithValue(response);
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    setDesignLearnMoreVisibility: (state, action) => {
      state.learnMoreVisible = action.payload;
    },
    setSmartTagsDialogVisibility: (state, action) => {
      state.smartTagsDialogVisible = action.payload;
    },
    setFormData: (state, action) => {
      state.formData = action.payload;
    },
    setSubject: (state, action) => {
      state.subject = action.payload;
    },
    setLandingPageMessage: (state, action) => {
      state.landingMessage = action.payload;
    },
    setEmailMessage: (state, action) => {
      state.emailMessage = action.payload;
    },
    setSignature: (state, action) => {
      state.signature = action.payload;
    },
    setRichTextsValidationState: (state, action) => {
      const {
        payload: { type, value },
      } = action;
      state.richTextsValidation[type] = value;
    },
    handleUploadFromLibrary: (state, action) => {
      state.libraryUpload = action.payload;
    },
    setIsEditionInitialized: (state, action) => {
      state.isEditionInitialized = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PURGE, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(updateCampaignMedia.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateCampaignMedia.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateCampaignMedia.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error && action.error.message;
      });
  },
});

export default designSlice.reducer;
export const {
  setDesignLearnMoreVisibility,
  setFormData,
  setLandingPageMessage,
  setEmailMessage,
  setSignature,
  setSmartTagsDialogVisibility,
  setSubject,
  setRichTextsValidationState,
  handleUploadFromLibrary,
  setIsEditionInitialized,
} = designSlice.actions;
