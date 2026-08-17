import React from 'react';
import SQECredentialsDashboard from '../modules/sqe/pages/CredentialsDashboard';
import ExecutiveDashboard from '../modules/enterprise/pages/ExecutiveDashboard';
import MOIInformationGovernanceHub from '../modules/moi/pages/InformationGovernanceHub';
import GuidePage from '../modules/core/pages/GuidePage';
import PFRInformedConsent from '../modules/pfr/pages/InformedConsentPage';
import PFRPatientRightsDashboard from '../modules/pfr/pages/PatientRightsDashboard';
import IncidentReporting from '../modules/gld/pages/IncidentReportingPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const enterpriseRoutes = (Wrap) => [
  { path: "/credentials", element: <Wrap><SQECredentialsDashboard /></Wrap> },
  { path: "/guide", element: <Wrap><GuidePage /></Wrap> },
  { path: "/pfr/consent", element: <Wrap><PFRInformedConsent /></Wrap> },
  { path: "/pfr/dashboard", element: <Wrap><PFRPatientRightsDashboard /></Wrap> },
  { path: "/gld-report", element: <Wrap><IncidentReporting /></Wrap> },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/executive", element: <Wrap><ExecutiveDashboard /></Wrap> },
      { path: "/information-governance", element: <Wrap><MOIInformationGovernanceHub /></Wrap> }
    ]
  }
];
