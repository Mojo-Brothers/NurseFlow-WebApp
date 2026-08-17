import React from 'react';
import PatientPortal from '../modules/patient/pages/PatientPortal';
import ProtectedRoute from '../components/ProtectedRoute';

export const patientRoutes = () => [
  {
    element: <ProtectedRoute allowedRoles={['PATIENT']} />,
    children: [
      { path: "/portal", element: <PatientPortal /> }
    ]
  }
];
