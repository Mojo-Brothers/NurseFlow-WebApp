import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const StaffPrivilegingWorkspacePage = lazy(() => import('../modules/staff/pages/StaffPrivilegingWorkspacePage'));
const SatusehatInteroperabilityStudioPage = lazy(() => import('../modules/interoperability/pages/SatusehatInteroperabilityStudioPage'));

export const enterpriseRoutes = (Wrap) => [
  { path: "/credentials", element: <Wrap><StaffPrivilegingWorkspacePage /></Wrap> },
  { path: "/satusehat", element: <Wrap><SatusehatInteroperabilityStudioPage /></Wrap> },
  { path: "/interoperability", element: <Wrap><SatusehatInteroperabilityStudioPage /></Wrap> }
];

