import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../modules/dashboard/pages/DashboardPage';
import Patients from '../modules/patient/pages/PatientPage';
import AppointmentPage from '../modules/appointment/pages/AppointmentPage';
import Encounters from '../modules/encounter/pages/EncounterPage';
import Triage from '../modules/triage/pages/TriagePage';
import ClinicalCoreWorkspace from '../modules/clinical_core/components/ClinicalCoreWorkspace';
import RegistrationDeskWorkspace from '../modules/front_office/components/RegistrationDeskWorkspace';
import EmergencyWorkspace from '../modules/emergency/components/EmergencyWorkspace';
import OrdersWorkspace from '../modules/orders/components/OrdersWorkspace';
import Worklist from '../modules/worklist/pages/WorklistPage';
import LabPage from '../modules/lab/pages/LabPage';
import WardMonitor from '../modules/dashboard/pages/WardMonitorPage';
import BedManagement from '../modules/ward/pages/BedManagementPage';
import EncounterSummary from '../modules/reporting/pages/EncounterSummaryPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const clinicalRoutes = (Wrap, AuthRedirector) => [
  {
    path: "/dashboard",
    element: (
      <AuthRedirector>
        <Wrap><Dashboard /></Wrap>
      </AuthRedirector>
    )
  },
  { path: "/patients", element: <Wrap><Patients /></Wrap> },
  { path: "/appointments", element: <Wrap><AppointmentPage /></Wrap> },
  { path: "/encounters", element: <Wrap><Encounters /></Wrap> },
  { path: "/triage", element: <Wrap><Triage /></Wrap> },
  { path: "/front-office", element: <Wrap><RegistrationDeskWorkspace /></Wrap> },
  { path: "/emergency", element: <Wrap><EmergencyWorkspace /></Wrap> },
  { path: "/clinical-core", element: <Wrap><ClinicalCoreWorkspace /></Wrap> },
  { path: "/orders", element: <Wrap><OrdersWorkspace /></Wrap> },
  { path: "/worklist", element: <Wrap><Worklist /></Wrap> },
  { path: "/lab", element: <Wrap><LabPage /></Wrap> },
  { path: "/ward-monitor", element: <Wrap><WardMonitor /></Wrap> },
  {
    element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'SUPERVISOR', 'ADMIN']} />,
    children: [
      { path: "/bed-management", element: <Wrap><BedManagement /></Wrap> },
      { path: "/reporting/:encounterId", element: <Wrap><EncounterSummary /></Wrap> }
    ]
  }
];
