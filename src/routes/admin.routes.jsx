import React, { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const Billing = lazy(() => import('../modules/billing/pages/BillingPage'));
const AdminHub = lazy(() => import('../modules/admin/pages/AdminHubPage'));
const MasterServicePage = lazy(() => import('../modules/admin/pages/MasterServicePage'));
const StaffManagementPage = lazy(() => import('../modules/admin/pages/StaffManagementPage'));
const InfectionSurveillance = lazy(() => import('../modules/admin/pages/InfectionSurveillance'));
const MasterDataHub = lazy(() => import('../modules/admin/pages/MasterDataHub'));
const MasterDataWorkspacePage = lazy(() => import('../modules/master_data/pages/MasterDataWorkspacePage'));
const DummyDataManagementPage = lazy(() => import('../modules/admin/pages/DummyDataManagementPage'));
const DevTools = lazy(() => import('../modules/admin/pages/DevTools'));
const HealthCheck = lazy(() => import('../modules/core/pages/HealthCheckPage'));
const SystemPerformanceSuite = lazy(() => import('../modules/diagnostics/pages/SystemPerformanceSuite'));
const WayfindingAdmin = lazy(() => import('../modules/enterprise/pages/WayfindingAdmin'));
const Analytics = lazy(() => import('../modules/dashboard/pages/AnalyticsDashboard'));
const UiDesignReviewPage = lazy(() => import('../modules/appointment_review/pages/UiDesignReviewPage'));
const AuditTrailDashboardPage = lazy(() => import('../modules/admin/pages/AuditTrailDashboardPage'));

export const adminRoutes = (Wrap) => [
  { path: "/review-design-ui-modul", element: <Wrap><UiDesignReviewPage /></Wrap> },
  { path: "/modular-design-review", element: <Wrap><ModularDesignSystemReviewPage /></Wrap> },
  { path: "/admin/services", element: <Wrap><MasterServicePage /></Wrap> },
  { path: "/master-data", element: <Wrap><MasterDataWorkspacePage /></Wrap> },
  { path: "/master-data/:entity", element: <Wrap><MasterDataWorkspacePage /></Wrap> },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']} />,
    children: [
      { path: "/billing", element: <Wrap><Billing /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/admin", element: <Wrap><AdminHub /></Wrap> },
      { path: "/admin/staff-access", element: <Wrap><StaffManagementPage /></Wrap> },
      { path: "/audit-trail", element: <Wrap><AuditTrailDashboardPage /></Wrap> },
      { path: "/surveillance", element: <Wrap><InfectionSurveillance /></Wrap> },
      { path: "/admin/master-hub", element: <Wrap><MasterDataHub /></Wrap> },
      { path: "/admin/dev-tools", element: <Wrap><DevTools /></Wrap> },
      { path: "/admin/dummy-data", element: <Wrap><DummyDataManagementPage /></Wrap> },
      { path: "/health", element: <Wrap><HealthCheck /></Wrap> },
      { path: "/performance-diagnostics", element: <Wrap><SystemPerformanceSuite /></Wrap> },
      { path: "/wayfinding-admin", element: <WayfindingAdmin /> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']} />,
    children: [
      { path: "/analytics", element: <Wrap><Analytics /></Wrap> }
    ]
  }
];
