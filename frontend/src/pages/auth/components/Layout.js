import React, { useMemo } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';

import authBackgroundImage from 'assets/images/auth-background.png';
import logoTitle from 'assets/images/logo-giftforward-title.svg';
import content from 'data/content-auth.json';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLoginBackgroundVisible = useMemo(() => pathname === '/login', [pathname]);
  const containerStyles = {
    backgroundImage: `url(${authBackgroundImage})`,
    backgroundSize: 'cover',
    position: 'fixed',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };

  const isRegister = pathname === '/register';
  const isLogin = pathname === '/login';
  const isMobileSwitcherVisible = isRegister || isLogin;
  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');

  return (
    <>
      {isLoginBackgroundVisible && (
        <div className="hidden md:block min-h-screen w-full absolute " style={containerStyles} />
      )}
      <section
        className={classnames(
          'min-h-screen relative md:static w-screen bg-no-repeat bg-left-overlap-bottom bg-size-190 md:bg-cover md:bg-center md:bg-cover md:flex md:flex-col md:justify-center md:items-center',
          { 'md:pt-[160px] md:pb-20 md:bg-beige-900': pathname !== '/login' },
          { 'md:pt-16 md:pb-6': pathname === '/login' },
        )}
      >
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img
          src={authBackgroundImage}
          alt="gifts for good - background image"
          className="w-full h-full object-fit object-bottom md:hidden"
          style={{ aspectRatio: '1.53' }}
        />
        <div className="md:relative px-8 md:px-11 bg-beige-light shadow-2xl max-w-[920px] w-full">
          <div className="absolute flex justify-center top-4 md:top-[-60px] left-1/2 -translate-x-1/2">
            <h1 className="text-center">
              <span className="sr-only">{content.common.giftForward}</span>
              <img src={logoTitle} alt="Gifts forward logo" />
            </h1>
          </div>
          {isMobileSwitcherVisible ? (
            <div className="md:hidden flex justify-around max-w-[350px] mx-auto border-b pt-10 mb-8">
              <button
                type="button"
                className={classnames('grow', { 'border-b-2 font-bold': !isRegister })}
                onClick={handleLoginClick}
              >
                {content.signIn.heading}
              </button>
              <button
                type="button"
                className={classnames('grow', { 'border-b-2 font-bold': isRegister })}
                onClick={handleRegisterClick}
              >
                {content.register.heading}
              </button>
            </div>
          ) : null}
          {children}
        </div>
      </section>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
