import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import { authRoutes } from './auth.routes';
import { clinicalRoutes } from './clinical.routes';
import { emrRoutes } from './emr.routes';
import { pharmacyRoutes } from './pharmacy.routes';
import { adminRoutes } from './admin.routes';
import { patientRoutes } from './patient.routes';
import { enterpriseRoutes } from './enterprise.routes';
import { useAuth } from '../contexts/useAuth';

const Wrap = ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;

function AuthRedirector({ children }) {
  const { role } = useAuth();
  if (role === 'PATIENT') return <Navigate to="/portal" replace />;
  return children;
}

export const router = createBrowserRouter([
  ...authRoutes,
  {
    children: [
      {
        element: <MainLayout />,
        children: [
          ...clinicalRoutes(Wrap, AuthRedirector),
          ...emrRoutes(Wrap),
          ...pharmacyRoutes(Wrap),
          ...adminRoutes(Wrap),
          ...patientRoutes(),
          ...enterpriseRoutes(Wrap),
          { path: "/", element: <Navigate to="/dashboard" replace /> }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />
  }
]);
