import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Layout from 'pages/auth/components/Layout';
import Input from 'pages/auth/components/form/Input';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import useForgotPassword from 'pages/auth/hooks/useForgotPassword';
import content from 'data/content-auth.json';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, errors, onSubmit, isDialogVisible, setIsDialogVisible } = useForgotPassword();

  return (
    <Layout>
      <div className="flex flex-col pt-8 pb-21 w-[350px] md:w-full md:max-w-[490px] mx-auto">
        <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl">{content.forgotPassword.heading}</h2>
        <p className="mt-3">{content.forgotPassword.subHeading}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <Input
            name="email"
            type="email"
            label={content.common.email}
            placeholder={content.placeholder.email}
            error={errors.email}
            register={register}
          />
          <button type="submit" className="py-4 px-4 mt-8 btn-primary">
            {content.forgotPassword.button}
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
          title={content.forgotPassword.resetSuccessTitle}
          content={content.forgotPassword.resetSuccess}
          showDialog={setIsDialogVisible}
          handleApprove={() => navigate('/login')}
          confirmText={content.forgotPassword.resetSuccessConfirm}
          singleOption
        />
      )}
    </Layout>
  );
};

export default ForgotPassword;
