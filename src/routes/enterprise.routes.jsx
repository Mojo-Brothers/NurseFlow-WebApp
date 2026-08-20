import React, { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const StaffPrivilegingWorkspacePage = lazy(() => import('../modules/staff/pages/StaffPrivilegingWorkspacePage'));
const SatusehatInteroperabilityStudioPage = lazy(() => import('../modules/interoperability/pages/SatusehatInteroperabilityStudioPage'));

export const enterpriseRoutes = (Wrap) => [
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'CLINICAL_DIRECTOR']} />,
    children: [
      { path: "/credentials", element: <Wrap><StaffPrivilegingWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'IT_ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/satusehat", element: <Wrap><SatusehatInteroperabilityStudioPage /></Wrap> },
      { path: "/interoperability", element: <Wrap><SatusehatInteroperabilityStudioPage /></Wrap> }
    ]
  }
];

