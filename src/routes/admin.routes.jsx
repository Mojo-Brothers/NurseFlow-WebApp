import React from 'react';
import Billing from '../modules/billing/pages/BillingPage';
import AdminHub from '../modules/admin/pages/AdminHubPage';
import MasterServicePage from '../modules/admin/pages/MasterServicePage';
import StaffManagementPage from '../modules/admin/pages/StaffManagementPage';
import InfectionSurveillance from '../modules/admin/pages/InfectionSurveillance';
import MasterDataHub from '../modules/admin/pages/MasterDataHub';
import MasterDataWorkspacePage from '../modules/master_data/pages/MasterDataWorkspacePage';
import DummyDataManagementPage from '../modules/admin/pages/DummyDataManagementPage';
import DevTools from '../modules/admin/pages/DevTools';
import HealthCheck from '../modules/core/pages/HealthCheckPage';
import SystemPerformanceSuite from '../modules/diagnostics/pages/SystemPerformanceSuite';
import WayfindingAdmin from '../modules/enterprise/pages/WayfindingAdmin';
import Analytics from '../modules/dashboard/pages/AnalyticsDashboard';
import UiDesignReviewPage from '../modules/appointment_review/pages/UiDesignReviewPage';
import ModularDesignSystemReviewPage from '../modules/admin/pages/ModularDesignSystemReviewPage';
import ProtectedRoute from '../components/ProtectedRoute';

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
