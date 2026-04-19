import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

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

const Wrap = ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* ─── Public ─────────────────────────── */}
            <Route path="/login" element={<Login />} />

            {/* ─── Protected: semua role ────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard"  element={<Wrap><Dashboard /></Wrap>} />
                <Route path="/patients"   element={<Wrap><Patients /></Wrap>} />
                <Route path="/encounters" element={<Wrap><Encounters /></Wrap>} />
                <Route path="/triage"     element={<Wrap><Triage /></Wrap>} />
                <Route path="/emr"        element={<Wrap><EMR /></Wrap>} />
                <Route path="/worklist"   element={<Wrap><Worklist /></Wrap>} />

                {/* Pharmacy: PHARMACIST + ADMIN + DOCTOR */}
                <Route element={<ProtectedRoute allowedRoles={['PHARMACIST','ADMIN','DOCTOR']} />}>
                  <Route path="/pharmacy" element={<Wrap><Pharmacy /></Wrap>} />
                </Route>

                {/* Billing: ADMIN + DOCTOR */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN','DOCTOR']} />}>
                  <Route path="/billing" element={<Wrap><Billing /></Wrap>} />
                </Route>

                {/* Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<Wrap><AdminHub /></Wrap>} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* ─── Fallback ─────────────────────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
