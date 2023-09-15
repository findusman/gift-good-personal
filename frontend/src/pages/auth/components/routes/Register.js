import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';

import Layout from 'pages/auth/components/Layout';
import Input from 'pages/auth/components/form/Input';
import PasswordErrors from 'pages/auth/components/form/PasswordErrors';
import useRegister from 'pages/auth/hooks/useRegister';
import content from 'data/content-auth.json';
import checkboxMarker from 'assets/images/check_mark_lg.svg';

const Register = () => {
  const { register, handleSubmit, errors, onSubmit, setIsAgreementChecked, getValues } = useRegister();

  return (
    <Layout>
      <div className="flex flex-col md:pt-[68px] pb-21 w-[350px] md:w-full md:max-w-[490px] mx-auto">
        <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl">{content.register.heading}</h2>
        <p className="mt-3">{content.register.subHeading}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="flex flex-col md:flex-row gap-x-7 w-full">
            <Input
              name="firstName"
              label={content.common.firstName}
              placeholder={content.placeholder.firstName}
              error={errors.firstName}
              register={register}
            />
            <Input
              name="lastName"
              label={content.common.lastName}
              placeholder={content.placeholder.lastName}
              error={errors.lastName}
              register={register}
            />
          </div>
          <Input
            name="email"
            type="email"
            label={content.common.email}
            placeholder={content.placeholder.email}
            error={errors.email}
            register={register}
          />
          <Input
            name="job"
            label={content.common.job}
            placeholder={content.placeholder.job}
            error={errors.job}
            register={register}
          />
          <Input
            name="company"
            label={content.common.company}
            placeholder={content.placeholder.company}
            error={errors.company}
            register={register}
          />
          <Input
            name="password"
            type="password"
            label={content.common.password}
            placeholder={content.placeholder.password}
            error={errors.password}
            register={register}
          />
          <PasswordErrors errors={errors.password ?? {}} />
          <Input
            name="confirmPassword"
            type="password"
            label={content.common.confirmPassword}
            placeholder={content.placeholder.confirmPassword}
            error={errors.confirmPassword}
            register={register}
          />
          <label
            className={classnames('mt-7 flex items-center cursor-pointer', { 'text-red-error': errors.agreement })}
            htmlFor="agreement"
          >
            <input
              className="hidden"
              id="agreement"
              type="checkbox"
              onClick={() => setIsAgreementChecked((prevState) => !prevState)}
              {...register('agreement')}
            />
            <div className="w-6 h-6 border border-black mr-2 inline-block">
              {getValues().agreement ? <img src={checkboxMarker} alt="checkbox" /> : null}
            </div>
            {content.common.agreement}
            <a
              href="/terms-and-conditions"
              className={classnames('border-b border-b-black ml-1', { 'border-b-red-error': errors.agreement })}
            >
              {content.common.termsAndConditions}
            </a>
          </label>
          <button type="submit" className="py-4 px-4 mt-8 btn-primary">
            {content.register.button}
          </button>
          <div className="flex flex-col items-start">
            <Link className="text-sm border-b border-b-black mt-10" to="/login">
              {content.common.haveAnAccount}
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Register;
