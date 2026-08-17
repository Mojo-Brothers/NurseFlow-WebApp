import React from 'react';
import PatientPortal from '../modules/patient/pages/PatientPortal';
import VirtualWaitingRoom from '../modules/telemedicine/components/VirtualWaitingRoom';
import WayfindingPortal from '../modules/patient/pages/WayfindingPortal';
import ProtectedRoute from '../components/ProtectedRoute';

export const patientRoutes = () => [
  {
    element: <ProtectedRoute allowedRoles={['PATIENT']} />,
    children: [
      { path: "/portal", element: <PatientPortal /> },
      { path: "/portal/waiting", element: <VirtualWaitingRoom doctorName="TELEMEDICINE_DOCTOR" appointmentTime="14:00" /> },
      { path: "/wayfinding", element: <WayfindingPortal /> }
    ]
  }
];
