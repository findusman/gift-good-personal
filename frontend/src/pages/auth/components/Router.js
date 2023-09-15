import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Register from 'pages/auth/components/routes/Register';
import Login from 'pages/auth/components/routes/Login';
import ForgotPassword from 'pages/auth/components/routes/ForgotPassword';
import ResetPassword from 'pages/auth/components/routes/ResetPassword';

const Router = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
};

export default Router;
