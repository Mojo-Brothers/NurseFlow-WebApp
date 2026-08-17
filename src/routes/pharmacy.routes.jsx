import React from 'react';
import { Navigate } from 'react-router-dom';
import Pharmacy from '../modules/pharmacy/pages/PharmacyPage';
import Inventory from '../modules/pharmacy/pages/InventoryPage';
import EnterpriseInventoryPage from '../modules/inventory/pages/EnterpriseInventoryPage';
import ProtectedRoute from '../components/ProtectedRoute';

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
