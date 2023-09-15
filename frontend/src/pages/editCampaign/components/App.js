import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getCampaignData } from 'store/editCampaign/campaign/campaignSlice';
import Loader from 'components/common/Loader';
import ErrorDialog from 'components/common/ErrorDialog';
import EditContent from './EditContent';
import EditRecipients from './EditRecipients';

import 'assets/styles/main.css';

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getCampaignData());
  }, []);

  return (
    <>
      <EditRecipients />
      <EditContent />
      <Loader />
      <ErrorDialog />
    </>
  );
};

export default App;
