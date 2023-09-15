import React from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';

import { setStep } from 'store/createCampaign/step/stepSlice';
import { setIsLoading } from 'store/common/app/appSlice';
import arrow from 'assets/images/arrow_steps.svg';
import content from 'data/content.json';
import BottomNavigation from 'pages/createCampaign/components/BottomNavigation';

const Stepper = () => {
  const dispatch = useDispatch();
  const { stepData, isSuccess } = useSelector((state) => ({
    stepData: state.step,
    isSuccess: state.success.isSuccess,
  }));
  const { active: currentStep, options: steps } = stepData;
  const handleStepChange = (nextStep) => {
    if (
      nextStep > 0 &&
      nextStep <= Object.keys(steps).length &&
      (nextStep < currentStep || steps[currentStep].isValid)
    ) {
      if (nextStep > currentStep) {
        dispatch(setIsLoading({ loading: true, duration: 400 }));
      }
      dispatch(setStep(nextStep));
    }
  };

  if (isSuccess) {
    return null;
  }

  return (
    <>
      <nav className="mr-auto flex items-center justify-between w-full">
        <ul className="stepper shrink-0 flex flex-nowrap justify-center 2xl:w-auto">
          {Object.entries(steps).map(([key, step]) => {
            const isActive = key <= currentStep;
            return (
              <li
                className={classnames(
                  'flex mr-4 items-center justify-center',
                  isActive && currentStep.toString() === key ? 'inline' : 'hidden 2xl:flex',
                )}
                key={key}
              >
                <button
                  type="button"
                  className={classnames(
                    'flex items-center step font-crimsonpro text-lg 2xl:text-4 mt-[5px] ml-1',
                    isActive ? '2xl:active' : null,
                  )}
                  onClick={() => handleStepChange(key)}
                  disabled={key - currentStep > 1}
                >
                  <span
                    className={classnames(
                      'flex justify-center items-center px-3.5 py-1 mr-3 w-8.5 h-8.5 rounded-full font-crimsonpro text-xl text-center',
                      {
                        'bg-dark text-light hidden 2xl:flex 2xl:justify-center 2xl:items-center': isActive,
                        'bg-beige-light text-beige-600': !isActive,
                      },
                    )}
                  >
                    {key}
                  </span>
                  {step.label}
                </button>
                {key < Object.entries(steps).length ? (
                  <img className="ml-3 hidden 2xl:inline" src={arrow} alt="Step arrow" />
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="flex 2xl:hidden items-center">
          <span className="font-crimsonpro font-normal text-2xl mr-1.5">{currentStep}</span>
          <p className="font-crimsonpro italic text-lg mr-[7px]"> of </p>
          <span className="font-crimsonpro text-2xl">{Object.entries(steps).length}</span>
        </div>
        <a className="hidden 2xl:inline border-b-2 border-black" href="/">
          {content.header.backToDashboard}
        </a>
      </nav>

      {ReactDOM.createPortal(
        <BottomNavigation handleStepChange={handleStepChange} currentStep={currentStep} steps={steps} />,
        document.getElementById('root'),
      )}
    </>
  );
};

export default Stepper;
