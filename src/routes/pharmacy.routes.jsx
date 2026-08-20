import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const EnterprisePharmacyWorkspacePage = lazy(() => import('../modules/pharmacy/pages/EnterprisePharmacyWorkspacePage'));
const EnterpriseInventoryPage = lazy(() => import('../modules/inventory/pages/EnterpriseInventoryPage'));

export const pharmacyRoutes = (Wrap) => [
  { path: "/inventory", element: <Navigate to="/inventory/material-request" replace /> },
  {
    element: <ProtectedRoute allowedRoles={['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/inventory/*", element: <Wrap><EnterpriseInventoryPage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN', 'DOCTOR']} />,
    children: [
      { path: "/pharmacy", element: <Wrap><EnterprisePharmacyWorkspacePage /></Wrap> },
      { path: "/pharmacy/inventory", element: <Wrap><EnterprisePharmacyWorkspacePage /></Wrap> }
    ]
  }
];
