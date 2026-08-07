import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate,
  Outlet
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import { processQueue } from './core/services/syncQueue.service.js';
import { executeQueuedAction } from './core/services/syncProcessor.js';

// Layouts & Pages
import MainLayout  from './layouts/MainLayout';
import Login       from './modules/auth/pages/LoginPage';
import Dashboard   from './modules/dashboard/pages/DashboardPage';
import Patients    from './modules/patient/pages/PatientPage';
import Triage      from './modules/triage/pages/TriagePage';
import EMR         from './modules/emr/pages/EMRPage';
import OutpatientEMR from './modules/emr/pages/OutpatientEMR';
import PatientCarePage from './modules/emr/pages/PatientCarePage';
import Encounters  from './modules/encounter/pages/EncounterPage';
import Pharmacy    from './modules/pharmacy/pages/PharmacyPage';
import Worklist    from './modules/worklist/pages/WorklistPage';
import Billing     from './modules/billing/pages/BillingPage';
import AdminHub    from './modules/admin/pages/AdminHubPage';
import MasterServicePage from './modules/admin/pages/MasterServicePage';
import MaterialRequestPage from './modules/inventory/pages/MaterialRequestPage';
import ItemDepartmentPage from './modules/inventory/pages/ItemDepartmentPage';
import ReceiveMutasiPage from './modules/inventory/pages/ReceiveMutasiPage';
import InternalUsePage from './modules/inventory/pages/InternalUsePage';
import KartuStockPage from './modules/inventory/pages/KartuStockPage';
import StockAdjustmentPage from './modules/inventory/pages/StockAdjustmentPage';
import HealthCheck from './modules/core/pages/HealthCheckPage';
import GuidePage   from './modules/core/pages/GuidePage';
import LabPage     from './modules/lab/pages/LabPage';
import WardMonitor from './modules/dashboard/pages/WardMonitorPage';
import BedManagement from './modules/ward/pages/BedManagementPage';
import Analytics from './modules/dashboard/pages/AnalyticsDashboard';
import EncounterSummary from './modules/reporting/pages/EncounterSummaryPage';
import EnterpriseInventoryPage from './modules/inventory/pages/EnterpriseInventoryPage';
import Inventory from './modules/pharmacy/pages/InventoryPage';
import PatientPortal from './modules/patient/pages/PatientPortal';
import WayfindingPortal from './modules/patient/pages/WayfindingPortal';
import WayfindingAdmin from './modules/enterprise/pages/WayfindingAdmin';
import SurgeryDashboard from './modules/emr/pages/SurgeryDashboard';
import InfectionSurveillance from './modules/admin/pages/InfectionSurveillance';
import StaffManagementPage from './modules/admin/pages/StaffManagementPage';
import ExecutiveDashboard from './modules/enterprise/pages/ExecutiveDashboard';
import IncidentReporting from './modules/gld/pages/IncidentReportingPage';
import DevTools from './modules/admin/pages/DevTools';
import SQECredentialsDashboard from './modules/sqe/pages/CredentialsDashboard';
import MOIInformationGovernanceHub from './modules/moi/pages/InformationGovernanceHub';
import PFRInformedConsent from './modules/pfr/pages/InformedConsentPage';
import PFRPatientRightsDashboard from './modules/pfr/pages/PatientRightsDashboard';
import MasterDataHub from './modules/admin/pages/MasterDataHub';
import Teleconsultation from './modules/telemedicine/pages/TeleconsultationPage';
import VirtualWaitingRoom from './modules/telemedicine/components/VirtualWaitingRoom';
import SignaturePadEndpoint from './modules/emr/pages/SignaturePadEndpoint';
import AppointmentPage from './modules/appointment/pages/AppointmentPage';
import AppointmentReviewPage from './modules/appointment_review/pages/AppointmentReviewPage';
import VerificationEndpoint from './modules/inventory/pages/VerificationEndpoint';
import { useAuth } from './contexts/useAuth';
import { Toaster } from 'react-hot-toast';

const Wrap = ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;

function AuthRedirector({ children }) {
  const { role } = useAuth();
  if (role === 'PATIENT') return <Navigate to="/portal" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/e-sign/:requestId",
    element: <SignaturePadEndpoint />
  },
  {
    path: "/auth/verify/:rqId",
    element: <VerificationEndpoint />
  },
  {
    path: "/verify/:rqId",
    element: <VerificationEndpoint />
  },
  {
//    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/dashboard",
            element: (
              <AuthRedirector>
                <Wrap><Dashboard /></Wrap>
              </AuthRedirector>
            ),
          },
          { path: "/patients",   element: <Wrap><Patients /></Wrap> },
          { path: "/appointments", element: <Wrap><AppointmentPage /></Wrap> },
          { path: "/review-design-ui-modul", element: <Wrap><AppointmentReviewPage /></Wrap> },
          { path: "/encounters", element: <Wrap><Encounters /></Wrap> },
          { path: "/triage",     element: <Wrap><Triage /></Wrap> },
          { path: "/patient-care", element: <Wrap><PatientCarePage /></Wrap> },
          { path: "/patient_care", element: <Navigate to="/patient-care" replace /> },
          { path: "/admin/services", element: <Wrap><MasterServicePage /></Wrap> },
          { path: "/inventory",  element: <Navigate to="/inventory/material-request" replace /> },
          { path: "/inventory/*", element: <Wrap><EnterpriseInventoryPage /></Wrap> },
          { path: "/emr",        element: <Wrap><EMR /></Wrap> },
          { path: "/emr-rj",     element: <Wrap><OutpatientEMR /></Wrap> },
          { path: "/emr-ri",     element: <Wrap><OutpatientEMR /></Wrap> },
          { path: "/credentials", element: <Wrap><SQECredentialsDashboard /></Wrap> },
          { path: "/surgery",    element: <Wrap><SurgeryDashboard /></Wrap> },
          { path: "/telemedicine", element: <Wrap><Teleconsultation /></Wrap> },
          { path: "/worklist",   element: <Wrap><Worklist /></Wrap> },
          {
            element: <ProtectedRoute allowedRoles={['PHARMACIST','ADMIN','DOCTOR']} />,
            children: [{ path: "/pharmacy", element: <Wrap><Pharmacy /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN','DOCTOR']} />,
            children: [{ path: "/billing", element: <Wrap><Billing /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />,
            children: [
               { path: "/admin", element: <Wrap><AdminHub /></Wrap> },
               { path: "/admin/staff-access", element: <Wrap><StaffManagementPage /></Wrap> },
               { path: "/surveillance", element: <Wrap><InfectionSurveillance /></Wrap> },
               { path: "/executive",    element: <Wrap><ExecutiveDashboard /></Wrap> },
              { path: "/information-governance", element: <Wrap><MOIInformationGovernanceHub /></Wrap> },
              { path: "/admin/master-hub", element: <Wrap><MasterDataHub /></Wrap> },
              { path: "/admin/dev-tools", element: <Wrap><DevTools /></Wrap> },
              { path: "/health", element: <Wrap><HealthCheck /></Wrap> },
              { path: "/lab", element: <Wrap><LabPage /></Wrap> },
              { path: "/wayfinding-admin", element: <WayfindingAdmin /> }
            ]
          },
          { path: "/guide",         element: <Wrap><GuidePage /></Wrap> },
          { path: "/pfr/consent",   element: <Wrap><PFRInformedConsent /></Wrap> },
          { path: "/pfr/dashboard", element: <Wrap><PFRPatientRightsDashboard /></Wrap> },
          { path: "/gld-report",    element: <Wrap><IncidentReporting /></Wrap> },
          { path: "/ward-monitor", element: <Wrap><WardMonitor /></Wrap> },
          {
            element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'SUPERVISOR', 'ADMIN']} />,
            children: [{ path: "/bed-management", element: <Wrap><BedManagement /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']} />,
            children: [{ path: "/analytics", element: <Wrap><Analytics /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']} />,
            children: [{ path: "/pharmacy/inventory", element: <Wrap><Inventory /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'SUPERVISOR', 'ADMIN']} />,
            children: [{ path: "/reporting/:encounterId", element: <Wrap><EncounterSummary /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['PATIENT']} />,
            children: [
              { path: "/portal", element: <PatientPortal /> },
              { path: "/portal/waiting", element: <VirtualWaitingRoom doctorName="TELEMEDICINE_DOCTOR" appointmentTime="14:00" /> },
              { path: "/wayfinding", element: <WayfindingPortal /> }
            ]
          },
          { path: "/", element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

function App() {
  useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleSync = () => {
      console.log('[App] Network Online: Triggering background sync queue...');
      processQueue(executeQueuedAction);
    };

    window.addEventListener('online', handleSync);
    if (navigator.onLine) handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
