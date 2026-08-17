import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const Pharmacy = lazy(() => import('../modules/pharmacy/pages/PharmacyPage'));
const Inventory = lazy(() => import('../modules/pharmacy/pages/InventoryPage'));
const EnterpriseInventoryPage = lazy(() => import('../modules/inventory/pages/EnterpriseInventoryPage'));

export const pharmacyRoutes = (Wrap) => [
  { path: "/inventory", element: <Navigate to="/inventory/material-request" replace /> },
  { path: "/inventory/*", element: <Wrap><EnterpriseInventoryPage /></Wrap> },
  {
    element: <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN', 'DOCTOR']} />,
    children: [
      { path: "/pharmacy", element: <Wrap><Pharmacy /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']} />,
    children: [
      { path: "/pharmacy/inventory", element: <Wrap><Inventory /></Wrap> }
    ]
  }
];
