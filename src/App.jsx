import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Encounters  from './modules/encounter/pages/EncounterPage';
import Pharmacy    from './modules/pharmacy/pages/PharmacyPage';
import Worklist    from './modules/worklist/pages/WorklistPage';
import Billing     from './modules/billing/pages/BillingPage';
import AdminHub    from './modules/admin/pages/AdminHubPage';
import HealthCheck from './modules/core/pages/HealthCheckPage';
import LabPage     from './modules/lab/pages/LabPage';

const Wrap = ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;

function App() {
  useEffect(() => {
    const handleSync = () => {
      console.log('[App] Network Online: Triggering background sync queue...');
      processQueue(executeQueuedAction);
    };

    window.addEventListener('online', handleSync);
    // Initial check on load
    if (navigator.onLine) handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard"  element={<Wrap><Dashboard /></Wrap>} />
              <Route path="/patients"   element={<Wrap><Patients /></Wrap>} />
              <Route path="/encounters" element={<Wrap><Encounters /></Wrap>} />
              <Route path="/triage"     element={<Wrap><Triage /></Wrap>} />
              <Route path="/emr"        element={<Wrap><EMR /></Wrap>} />
              <Route path="/worklist"   element={<Wrap><Worklist /></Wrap>} />
              <Route element={<ProtectedRoute allowedRoles={['PHARMACIST','ADMIN','DOCTOR']} />}>
                <Route path="/pharmacy" element={<Wrap><Pharmacy /></Wrap>} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR']} />}>
                <Route path="/billing" element={<Wrap><Billing /></Wrap>} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<Wrap><AdminHub /></Wrap>} />
                <Route path="/health" element={<Wrap><HealthCheck /></Wrap>} />
                <Route path="/lab" element={<Wrap><LabPage /></Wrap>} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
