import React from 'react';
import { Navigate } from 'react-router-dom';
import EmrWorkspace from '../modules/emr/components/EmrWorkspace';
import EMR from '../modules/emr/pages/EMRPage';
import OutpatientEMR from '../modules/emr/pages/OutpatientEMR';
import InpatientEMR from '../modules/emr/pages/InpatientEMR';
import PatientCarePage from '../modules/emr/pages/PatientCarePage';
import SurgeryDashboard from '../modules/emr/pages/SurgeryDashboard';
import Teleconsultation from '../modules/telemedicine/pages/TeleconsultationPage';

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
