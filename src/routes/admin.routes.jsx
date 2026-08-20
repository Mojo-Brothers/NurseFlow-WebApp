import React, { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const Billing = lazy(() => import('../modules/billing/pages/BillingPage'));
const AdminHub = lazy(() => import('../modules/admin/pages/AdminHubPage'));
const MasterServicePage = lazy(() => import('../modules/admin/pages/MasterServicePage'));
const StaffManagementPage = lazy(() => import('../modules/admin/pages/StaffManagementPage'));
const MasterDataHub = lazy(() => import('../modules/admin/pages/MasterDataHub'));
const MasterDataWorkspacePage = lazy(() => import('../modules/master_data/pages/MasterDataWorkspacePage'));
const HealthCheck = lazy(() => import('../modules/core/pages/HealthCheckPage'));
const SystemPerformanceSuite = lazy(() => import('../modules/diagnostics/pages/SystemPerformanceSuite'));
const AuditTrailDashboardPage = lazy(() => import('../modules/admin/pages/AuditTrailDashboardPage'));

const HospitalCentralCommandCenterPage = lazy(() => import('../modules/dashboard/pages/HospitalCentralCommandCenterPage'));

export const adminRoutes = (Wrap) => [
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'CASHIER', 'CASEMIX_CODER', 'FINANCE', 'SUPERVISOR']} />,
    children: [
      { path: "/billing", element: <Wrap><Billing /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'HOSPITAL_DIRECTOR', 'EXECUTIVE']} />,
    children: [
      { path: "/command-center", element: <Wrap><HospitalCentralCommandCenterPage /></Wrap> },
      { path: "/executive-cockpit", element: <Wrap><HospitalCentralCommandCenterPage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/admin", element: <Wrap><AdminHub /></Wrap> },
      { path: "/admin/services", element: <Wrap><MasterServicePage /></Wrap> },
      { path: "/master-data", element: <Wrap><MasterDataWorkspacePage /></Wrap> },
      { path: "/master-data/:entity", element: <Wrap><MasterDataWorkspacePage /></Wrap> },
      { path: "/admin/staff-access", element: <Wrap><StaffManagementPage /></Wrap> },
      { path: "/audit-trail", element: <Wrap><AuditTrailDashboardPage /></Wrap> },
      { path: "/admin/master-hub", element: <Wrap><MasterDataHub /></Wrap> },
      { path: "/health", element: <Wrap><HealthCheck /></Wrap> },
      { path: "/performance-diagnostics", element: <Wrap><SystemPerformanceSuite /></Wrap> }
    ]
  }
];
