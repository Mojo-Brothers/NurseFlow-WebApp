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
import Encounters  from './modules/encounter/pages/EncounterPage';
import Pharmacy    from './modules/pharmacy/pages/PharmacyPage';
import Worklist    from './modules/worklist/pages/WorklistPage';
import Billing     from './modules/billing/pages/BillingPage';
import AdminHub    from './modules/admin/pages/AdminHubPage';
import HealthCheck from './modules/core/pages/HealthCheckPage';
import LabPage     from './modules/lab/pages/LabPage';
import WardMonitor from './modules/dashboard/pages/WardMonitorPage';
import BedManagement from './modules/ward/pages/BedManagementPage';
import Analytics from './modules/dashboard/pages/AnalyticsDashboard';
import EncounterSummary from './modules/reporting/pages/EncounterSummaryPage';
import Inventory from './modules/pharmacy/pages/InventoryPage';
import PatientPortal from './modules/patient/pages/PatientPortal';
import WayfindingPortal from './modules/patient/pages/WayfindingPortal';
import WayfindingAdmin from './modules/enterprise/pages/WayfindingAdmin';
import SurgeryDashboard from './modules/emr/pages/SurgeryDashboard';
import InfectionSurveillance from './modules/admin/pages/InfectionSurveillance';
import ExecutiveDashboard from './modules/enterprise/pages/ExecutiveDashboard';
import StaffCredentials from './modules/enterprise/pages/StaffCredentials';
import DataGovernanceHub from './modules/admin/pages/DataGovernanceHub';
import { useAuth } from './contexts/useAuth';

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
    element: <ProtectedRoute />,
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
          { path: "/encounters", element: <Wrap><Encounters /></Wrap> },
          { path: "/triage",     element: <Wrap><Triage /></Wrap> },
          { path: "/emr",        element: <Wrap><EMR /></Wrap> },
          { path: "/emr-rj",     element: <Wrap><OutpatientEMR /></Wrap> },
          { path: "/credentials", element: <Wrap><StaffCredentials /></Wrap> },
          { path: "/surgery",    element: <Wrap><SurgeryDashboard /></Wrap> },
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
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: "/admin", element: <Wrap><AdminHub /></Wrap> },
              { path: "/surveillance", element: <Wrap><InfectionSurveillance /></Wrap> },
              { path: "/executive",    element: <Wrap><ExecutiveDashboard /></Wrap> },
              { path: "/governance",   element: <Wrap><DataGovernanceHub /></Wrap> },
              { path: "/health", element: <Wrap><HealthCheck /></Wrap> },
              { path: "/lab", element: <Wrap><LabPage /></Wrap> },
              { path: "/wayfinding-admin", element: <WayfindingAdmin /> }
            ]
          },
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
            children: [{ path: "/inventory", element: <Wrap><Inventory /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'SUPERVISOR', 'ADMIN']} />,
            children: [{ path: "/reporting/:encounterId", element: <Wrap><EncounterSummary /></Wrap> }]
          },
          {
            element: <ProtectedRoute allowedRoles={['PATIENT']} />,
            children: [
              { path: "/portal", element: <PatientPortal /> },
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
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
