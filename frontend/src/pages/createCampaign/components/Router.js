import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from 'components/common/Loader';

const GiftsStep = lazy(() => import('./steps/GiftsStep'));
const RecipientsStep = lazy(() => import('./steps/RecipientsStep'));
const DesignStep = lazy(() => import('./steps/DesignStep'));
const PaymentStep = lazy(() => import('./steps/PaymentStep'));
const SuccessStep = lazy(() => import('./steps/SuccessStep'));

const Router = () => {
  const { stepData, isSuccess } = useSelector((state) => {
    return { stepData: state.step, isSuccess: state.success.isSuccess };
  });
  const { active: currentStep, options: steps } = stepData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) {
      navigate('/success');
    } else if (steps[currentStep]) {
      navigate(steps[currentStep]?.pathname);
    }
  }, [currentStep, isSuccess]);

  return (
    <Routes>
      <Route
        path="/gifts"
        element={
          <Suspense fallback={<Loader />}>
            <GiftsStep />
          </Suspense>
        }
      />
      <Route
        path="/recipients"
        element={
          <Suspense fallback={<Loader />}>
            <RecipientsStep />
          </Suspense>
        }
      />
      <Route
        path="/design"
        element={
          <Suspense fallback={<Loader />}>
            <DesignStep />
          </Suspense>
        }
      />
      <Route
        path="/payment"
        element={
          <Suspense fallback={<Loader />}>
            <PaymentStep />
          </Suspense>
        }
      />
      <Route
        path="/success"
        element={
          <Suspense fallback={<Loader />}>
            <SuccessStep />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default Router;
