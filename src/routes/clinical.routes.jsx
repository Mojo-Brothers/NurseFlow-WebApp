import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const PatientCommandCenterPage = lazy(() => import('../modules/patient/pages/PatientCommandCenterPage'));
const AppointmentPage = lazy(() => import('../modules/appointment/pages/AppointmentPage'));
const Encounters = lazy(() => import('../modules/encounter/pages/EncounterPage'));
const Triage = lazy(() => import('../modules/triage/pages/TriagePage'));
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
const RadiologyWorkspacePage = lazy(() => import('../modules/radiology/pages/RadiologyWorkspacePage'));
const OperatingTheatreWorkspacePage = lazy(() => import('../modules/surgery/pages/OperatingTheatreWorkspacePage'));
const EnterprisePharmacyWorkspacePage = lazy(() => import('../modules/pharmacy/pages/EnterprisePharmacyWorkspacePage'));

export const clinicalRoutes = (Wrap, AuthRedirector) => [
  {
    path: "/dashboard",
    element: (
      <AuthRedirector>
        <Wrap><Dashboard /></Wrap>
      </AuthRedirector>
    )
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'CASHIER', 'PHARMACIST', 'LAB_ANALYST', 'RADIOLOGIST']} />,
    children: [
      { path: "/patients", element: <Wrap><PatientCommandCenterPage /></Wrap> },
      { path: "/appointments", element: <Wrap><AppointmentPage /></Wrap> },
      { path: "/encounters", element: <Wrap><Encounters /></Wrap> },
      { path: "/front-office", element: <Wrap><RegistrationDeskWorkspace /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/triage", element: <Wrap><Triage /></Wrap> },
      { path: "/emergency", element: <Wrap><EmergencyWorkspace /></Wrap> },
      { path: "/nursing-workspace", element: <Wrap><NursingWorkspacePage /></Wrap> },
      { path: "/nursing", element: <Wrap><NursingWorkspacePage /></Wrap> },
      { path: "/emar", element: <Wrap><NursingWorkspacePage /></Wrap> },
      { path: "/fluid-balance", element: <Wrap><NursingWorkspacePage /></Wrap> },
      { path: "/ward-monitor", element: <Wrap><WardMonitor /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/clinical-core", element: <Wrap><DoctorWorkspacePage /></Wrap> },
      { path: "/doctor-workspace", element: <Wrap><DoctorWorkspacePage /></Wrap> },
      { path: "/orders", element: <Wrap><OrdersWorkspace /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['RADIOLOGIST', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/radiology", element: <Wrap><RadiologyWorkspacePage /></Wrap> },
      { path: "/pacs", element: <Wrap><RadiologyWorkspacePage /></Wrap> },
      { path: "/pacs-viewer", element: <Wrap><RadiologyWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['LAB_ANALYST', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/lab", element: <Wrap><LabPage /></Wrap> },
      { path: "/worklist", element: <Wrap><Worklist /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/operating-theatre", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> },
      { path: "/ibs", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> },
      { path: "/surgery-board", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/pharmacy-enterprise", element: <Wrap><EnterprisePharmacyWorkspacePage /></Wrap> },
      { path: "/farmasi-fefo", element: <Wrap><EnterprisePharmacyWorkspacePage /></Wrap> },
      { path: "/fefo-dispensing", element: <Wrap><EnterprisePharmacyWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['BLOOD_BANK_OFFICER', 'LAB_ANALYST', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/blood-bank", element: <Wrap><BloodBankWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ICU_NURSE', 'NURSE', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/icu-acuity", element: <Wrap><IcuAcuityWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'CLINICAL_DIRECTOR']} />,
    children: [
      { path: "/staff-privileges", element: <Wrap><StaffPrivilegingWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'SUPERVISOR', 'ADMIN']} />,
    children: [
      { path: "/bed-management", element: <Wrap><BedManagement /></Wrap> },
      { path: "/reporting/:encounterId", element: <Wrap><EncounterSummary /></Wrap> }
    ]
  }
];
