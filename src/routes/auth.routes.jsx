import React from 'react';
import Login from '../modules/auth/pages/LoginPage';
import SignaturePadEndpoint from '../modules/emr/pages/SignaturePadEndpoint';
import VerificationEndpoint from '../modules/inventory/pages/VerificationEndpoint';

export const authRoutes = [
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/e-sign/:requestId",
    element: <SignaturePadEndpoint />
  },
  {
    path: "/auth/verify/:rqId",
    element: <VerificationEndpoint />
  },
  {
    path: "/verify/:rqId",
    element: <VerificationEndpoint />
  }
];
