import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const OutpatientEMR = lazy(() => import('../modules/emr/pages/OutpatientEMR'));
const InpatientEMR = lazy(() => import('../modules/emr/pages/InpatientEMR'));
const DoctorWorkspacePage = lazy(() => import('../modules/clinical_core/pages/DoctorWorkspacePage'));
const OperatingTheatreWorkspacePage = lazy(() => import('../modules/surgery/pages/OperatingTheatreWorkspacePage'));

export const emrRoutes = (Wrap) => [
  { path: "/emr", element: <Wrap><DoctorWorkspacePage /></Wrap> },
  { path: "/emr-rj", element: <Wrap><OutpatientEMR /></Wrap> },
  { path: "/emr-ri", element: <Wrap><InpatientEMR /></Wrap> },
  { path: "/surgery", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> }
];
