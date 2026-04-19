import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts & Pages
import MainLayout  from './layouts/MainLayout';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Patients    from './pages/Patients';
import Triage      from './pages/Triage';
import EMR         from './pages/EMR';
import Encounters  from './pages/Encounters';
import AdminHub    from './pages/AdminHub';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected — semua role */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard"  element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/patients"   element={<ErrorBoundary><Patients /></ErrorBoundary>} />
                <Route path="/encounters" element={<ErrorBoundary><Encounters /></ErrorBoundary>} />
                <Route path="/triage"     element={<ErrorBoundary><Triage /></ErrorBoundary>} />
                <Route path="/emr"        element={<ErrorBoundary><EMR /></ErrorBoundary>} />

                {/* Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<ErrorBoundary><AdminHub /></ErrorBoundary>} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
