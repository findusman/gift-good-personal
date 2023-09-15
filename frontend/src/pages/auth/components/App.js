import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setIsMobile } from 'store/common/app/appSlice';
import Router from 'pages/auth/components/Router';
import Loader from 'components/common/Loader';
import ErrorDialog from 'components/common/ErrorDialog';

import 'assets/styles/main.css';

const App = () => {
  const dispatch = useDispatch();
  const isMobile = useSelector((state) => state.app.isMobile);

  useEffect(() => {
    if (isMobile && window.innerWidth >= 768) {
      dispatch(setIsMobile({ isMobile: false }));
    }

    if (!isMobile && window.innerWidth < 768) {
      dispatch(setIsMobile({ isMobile: true }));
    }
  }, []);

  return (
    <BrowserRouter basename="/">
      <Router />
      <Loader />
      <ErrorDialog />
    </BrowserRouter>
  );
};

export default App;
