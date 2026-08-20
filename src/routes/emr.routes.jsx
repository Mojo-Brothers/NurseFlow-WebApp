import React, { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const UnifiedPatientChart = lazy(() => import('../modules/clinical_core/pages/UnifiedPatientChart'));
const DoctorWorkspacePage = lazy(() => import('../modules/clinical_core/pages/DoctorWorkspacePage'));
const OperatingTheatreWorkspacePage = lazy(() => import('../modules/surgery/pages/OperatingTheatreWorkspacePage'));
const GoLiveControlCenter = lazy(() => import('../modules/integration/pages/GoLiveControlCenter'));

export const emrRoutes = (Wrap) => [
  {
    element: <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/emr", element: <Wrap><DoctorWorkspacePage /></Wrap> },
      { path: "/patient-chart", element: <Wrap><UnifiedPatientChart /></Wrap> },
      { path: "/emr-rj", element: <Wrap><UnifiedPatientChart /></Wrap> },
      { path: "/emr-ri", element: <Wrap><UnifiedPatientChart /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/surgery", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'IT_ADMIN']} />,
    children: [
      { path: "/go-live-control", element: <Wrap><GoLiveControlCenter /></Wrap> }
    ]
  }
];
