import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const OutpatientEMR = lazy(() => import('../modules/emr/pages/OutpatientEMR'));
const InpatientEMR = lazy(() => import('../modules/emr/pages/InpatientEMR'));
const UnifiedPatientChart = lazy(() => import('../modules/clinical_core/pages/UnifiedPatientChart'));
const DoctorWorkspacePage = lazy(() => import('../modules/clinical_core/pages/DoctorWorkspacePage'));
const OperatingTheatreWorkspacePage = lazy(() => import('../modules/surgery/pages/OperatingTheatreWorkspacePage'));

export const emrRoutes = (Wrap) => [
  { path: "/emr", element: <Wrap><DoctorWorkspacePage /></Wrap> },
  { path: "/patient-chart", element: <Wrap><UnifiedPatientChart /></Wrap> },
  { path: "/emr-rj", element: <Wrap><UnifiedPatientChart /></Wrap> },
  { path: "/emr-ri", element: <Wrap><UnifiedPatientChart /></Wrap> },
  { path: "/surgery", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> }
];

