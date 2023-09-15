import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { persistStore } from 'redux-persist';
import moment from 'moment';

import { setIsLoading, setIsMobile } from 'store/common/app/appSlice';
import LearnMoreDialog from 'components/common/LearnMoreDialog';
import Loader from 'components/common/Loader';
import ErrorDialog from 'components/common/ErrorDialog';
import hotjarScript from 'helpers/hotjarScript';
import Header from 'pages/createCampaign/components/Header';
import CampaignSidebar from 'pages/createCampaign/components/CampaignSidebar';
import Router from 'pages/createCampaign/components/Router';
import packageData from '../../../../package.json';

import 'assets/styles/main.css';

const App = () => {
  const dispatch = useDispatch();
  const { appVersion, isAdmin, expirationTime } = useSelector((state) => ({
    appVersion: state.app.version,
    isAdmin: state.app.isAdmin,
    expirationTime: state.app.expirationTime,
  }));

  useEffect(() => {
    dispatch(setIsLoading({ loading: true, duration: 400 }));

    if (window.innerWidth < 1024) {
      dispatch(setIsMobile({ isMobile: true }));
    }

    const isCurrentUserAdmin = document.querySelector('#root').getAttribute('data-is-admin') === 'true';
    const isDataExpired = moment().diff(expirationTime, 'minutes') > 0;

    if (appVersion !== packageData.version || isAdmin !== isCurrentUserAdmin || isDataExpired) {
      persistStore({ dispatch }).purge();
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = hotjarScript;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <BrowserRouter basename="/campaign/create">
      <>
        <Header />
        <main className="pb-5">
          <Router />
        </main>
        <footer className="footer" />
      </>
      <CampaignSidebar />
      <LearnMoreDialog />
      <Loader />
      <ErrorDialog />
    </BrowserRouter>
  );
};

export default App;
