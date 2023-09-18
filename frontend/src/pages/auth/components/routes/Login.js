import React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Layout from 'pages/auth/components/Layout';
import Input from 'pages/auth/components/form/Input';
import useLogin from 'pages/auth/hooks/useLogin';
import useResendInvitation from 'pages/auth/hooks/useResendInvitation';
import ConfirmationDialog from 'components/common/ConfirmationDialog';
import content from 'data/content-auth.json';

const Login = () => {
  const { sesionOut } = useParams();

  // const sesionOut  = 'Session Out'

  const navigate = useNavigate();
  const { register, handleSubmit, errors, onSubmit, getValues } = useLogin();
  const { handleResendInvitation, isDialogVisible, setIsDialogVisible } = useResendInvitation(getValues);

  const handleRegisterClick = () => navigate('/register');

  return (
    <Layout>
      <div className="flex md:gap-x-10 md:pt-12 pb-14 mx-auto justify-center">
        <div className="w-[350px]">
          <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl md:hidden">{content.signIn.headingMobile}</h2>
          <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl hidden md:block">{content.signIn.heading}</h2>
          <p className="mt-3 md:hidden">{content.signIn.subheadingMobile}</p>
          <p className="mt-3 hidden md:block">{content.signIn.subHeading}</p>
          <h1>{sesionOut}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <Input
              name="email"
              type="email"
              label={content.common.email}
              placeholder={content.placeholder.email}
              error={errors.email}
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
            <button type="submit" className="py-4 px-4 mt-8 btn-primary">
              {content.signIn.button}
            </button>
          </form>
          <div className="flex flex-col items-start">
            <Link to="/forgot-password" className="text-sm border-b border-b-black mt-11">
              {content.common.forgotPassword}
            </Link>
            <button type="button" onClick={handleResendInvitation} className="text-sm border-b border-b-black mt-5">
              {content.common.lostInvitation}
            </button>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center">
          <span className="h-full w-[1px] bg-beige-dark" />
          <span className="text-lg font-bold uppercase py-6">{content.common.or}</span>
          <span className="h-full w-[1px] bg-beige-dark mb-10" />
        </div>
        <div className="hidden md:block w-[350px]">
          <h2 className="text-[30px] leading-[34px] 2xl:text-2.5xl">{content.register.heading}</h2>
          <p className="mt-3">{content.register.subTitle}</p>
          <button type="button" className="py-4 px-4 mt-5 btn-secondary w-full" onClick={handleRegisterClick}>
            {content.register.button}
          </button>
        </div>
      </div>
      {isDialogVisible && (
        <ConfirmationDialog
          isOpen={isDialogVisible}
          title={content.signIn.resetInvitationTitle}
          content={content.signIn.resetInvitationMessage}
          showDialog={setIsDialogVisible}
          handleApprove={() => navigate('/login')}
          confirmText={content.signIn.resetInvitationConfirm}
          singleOption
        />
      )}
    </Layout>
  );
};

export default Login;
