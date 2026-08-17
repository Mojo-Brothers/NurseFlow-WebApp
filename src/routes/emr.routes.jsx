import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const EmrWorkspace = lazy(() => import('../modules/emr/components/EmrWorkspace'));
const EMR = lazy(() => import('../modules/emr/pages/EMRPage'));
const OutpatientEMR = lazy(() => import('../modules/emr/pages/OutpatientEMR'));
const InpatientEMR = lazy(() => import('../modules/emr/pages/InpatientEMR'));
const PatientCarePage = lazy(() => import('../modules/emr/pages/PatientCarePage'));
const SurgeryDashboard = lazy(() => import('../modules/emr/pages/SurgeryDashboard'));
const Teleconsultation = lazy(() => import('../modules/telemedicine/pages/TeleconsultationPage'));

export const emrRoutes = (Wrap) => [
  { path: "/emr", element: <Wrap><EmrWorkspace /></Wrap> },
  { path: "/emr-legacy", element: <Wrap><EMR /></Wrap> },
  { path: "/emr-rj", element: <Wrap><OutpatientEMR /></Wrap> },
  { path: "/emr-ri", element: <Wrap><InpatientEMR /></Wrap> },
  { path: "/patient-care", element: <Wrap><PatientCarePage /></Wrap> },
  { path: "/patient_care", element: <Navigate to="/patient-care" replace /> },
  { path: "/surgery", element: <Wrap><SurgeryDashboard /></Wrap> },
  { path: "/telemedicine", element: <Wrap><Teleconsultation /></Wrap> }
];
