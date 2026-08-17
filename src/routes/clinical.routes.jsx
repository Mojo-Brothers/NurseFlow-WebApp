import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const Patients = lazy(() => import('../modules/patient/pages/PatientPage'));
const PatientCommandCenterPage = lazy(() => import('../modules/patient/pages/PatientCommandCenterPage'));
const AppointmentPage = lazy(() => import('../modules/appointment/pages/AppointmentPage'));
const Encounters = lazy(() => import('../modules/encounter/pages/EncounterPage'));
const Triage = lazy(() => import('../modules/triage/pages/TriagePage'));
const ClinicalCoreWorkspace = lazy(() => import('../modules/clinical_core/components/ClinicalCoreWorkspace'));
const DoctorWorkspacePage = lazy(() => import('../modules/clinical_core/pages/DoctorWorkspacePage'));
const RegistrationDeskWorkspace = lazy(() => import('../modules/front_office/components/RegistrationDeskWorkspace'));
const EmergencyWorkspace = lazy(() => import('../modules/emergency/components/EmergencyWorkspace'));
const OrdersWorkspace = lazy(() => import('../modules/orders/components/OrdersWorkspace'));
const Worklist = lazy(() => import('../modules/worklist/pages/WorklistPage'));
const LabPage = lazy(() => import('../modules/lab/pages/LabPage'));
const WardMonitor = lazy(() => import('../modules/dashboard/pages/WardMonitorPage'));
const BedManagement = lazy(() => import('../modules/ward/pages/BedManagementCenterPage'));
const EncounterSummary = lazy(() => import('../modules/reporting/pages/EncounterSummaryPage'));

const BloodBankWorkspacePage = lazy(() => import('../modules/blood_bank/pages/BloodBankWorkspacePage'));
const IcuAcuityWorkspacePage = lazy(() => import('../modules/critical_care/pages/IcuAcuityWorkspacePage'));
const StaffPrivilegingWorkspacePage = lazy(() => import('../modules/staff/pages/StaffPrivilegingWorkspacePage'));
const NursingWorkspacePage = lazy(() => import('../modules/nursing/pages/NursingWorkspacePage'));

export const clinicalRoutes = (Wrap, AuthRedirector) => [
  {
    path: "/dashboard",
    element: (
      <AuthRedirector>
        <Wrap><Dashboard /></Wrap>
      </AuthRedirector>
    )
  },
  { path: "/patients", element: <Wrap><PatientCommandCenterPage /></Wrap> },
  { path: "/appointments", element: <Wrap><AppointmentPage /></Wrap> },
  { path: "/encounters", element: <Wrap><Encounters /></Wrap> },
  { path: "/triage", element: <Wrap><Triage /></Wrap> },
  { path: "/front-office", element: <Wrap><RegistrationDeskWorkspace /></Wrap> },
  { path: "/emergency", element: <Wrap><EmergencyWorkspace /></Wrap> },
  { path: "/clinical-core", element: <Wrap><DoctorWorkspacePage /></Wrap> },
  { path: "/doctor-workspace", element: <Wrap><DoctorWorkspacePage /></Wrap> },
  { path: "/nursing-workspace", element: <Wrap><NursingWorkspacePage /></Wrap> },
  { path: "/nursing", element: <Wrap><NursingWorkspacePage /></Wrap> },
  { path: "/emar", element: <Wrap><NursingWorkspacePage /></Wrap> },
  { path: "/fluid-balance", element: <Wrap><NursingWorkspacePage /></Wrap> },
  { path: "/orders", element: <Wrap><OrdersWorkspace /></Wrap> },
  { path: "/blood-bank", element: <Wrap><BloodBankWorkspacePage /></Wrap> },
  { path: "/icu-acuity", element: <Wrap><IcuAcuityWorkspacePage /></Wrap> },
  { path: "/staff-privileges", element: <Wrap><StaffPrivilegingWorkspacePage /></Wrap> },
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
