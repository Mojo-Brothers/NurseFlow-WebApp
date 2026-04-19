import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts & Pages
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Triage from './pages/Triage';
import EMR from './pages/EMR';
import Encounters from './pages/Encounters';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes Container */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/patients"   element={<Patients />} />
              <Route path="/triage"     element={<Triage />} />
              <Route path="/emr"        element={<EMR />} />
              <Route path="/encounters" element={<Encounters />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

            </Route>
          </Route>
          
          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
