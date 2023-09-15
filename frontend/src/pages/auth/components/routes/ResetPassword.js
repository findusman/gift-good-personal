import React from 'react';
import { Link } from 'react-router-dom';

import Layout from 'pages/auth/components/Layout';
import Input from 'pages/auth/components/form/Input';
import PasswordErrors from 'pages/auth/components/form/PasswordErrors';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import useResetPassword from 'pages/auth/hooks/useResetPassword';
import content from 'data/content-auth.json';

const ResetPassword = () => {
  const { register, handleSubmit, errors, onSubmit, isDialogVisible, setIsDialogVisible } = useResetPassword();

  return (
    <Layout>
      <div className="flex flex-col pt-8 pb-21 w-[350px] md:w-full md:max-w-[490px] mx-auto">
        <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl">{content.resetPassword.heading}</h2>
        <p className="mt-3">{content.resetPassword.subHeading}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
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
          <button type="submit" className="py-4 px-4 mt-8 btn-primary">
            {content.resetPassword.button}
          </button>
          <div className="flex flex-col items-start">
            <Link className="text-sm border-b border-b-black mt-6" to="/login">
              {content.common.backToLogin}
            </Link>
          </div>
        </form>
      </div>
      {isDialogVisible && (
        <ConfirmationDialog
          isOpen={isDialogVisible}
          title={content.resetPassword.resetSuccessTitle}
          content={content.resetPassword.resetSuccess}
          showDialog={setIsDialogVisible}
          handleApprove={() => {
            window.location.href = '/login';
          }}
          confirmText={content.forgotPassword.resetSuccessConfirm}
          singleOption
        />
      )}
    </Layout>
  );
};

export default ResetPassword;
