import React, { lazy } from 'react';

const GovernanceDashboardLayout = lazy(() => import('../modules/governance/layouts/GovernanceDashboardLayout'));
const GovernanceOverviewPage = lazy(() => import('../modules/governance/pages/GovernanceOverviewPage'));
const GovernanceRoadmapPage = lazy(() => import('../modules/governance/pages/GovernanceRoadmapPage'));
const GovernanceWorkstreamsPage = lazy(() => import('../modules/governance/pages/GovernanceWorkstreamsPage'));
const GovernanceSecurityPage = lazy(() => import('../modules/governance/pages/GovernanceSecurityPage'));
const GovernanceFindingsPage = lazy(() => import('../modules/governance/pages/GovernanceFindingsPage'));
const GovernanceEvidencePage = lazy(() => import('../modules/governance/pages/GovernanceEvidencePage'));
const GovernanceDomainsPage = lazy(() => import('../modules/governance/pages/GovernanceDomainsPage'));
const GovernanceTestsPage = lazy(() => import('../modules/governance/pages/GovernanceTestsPage'));
const GovernanceDatabasePage = lazy(() => import('../modules/governance/pages/GovernanceDatabasePage'));
const GovernanceChangesPage = lazy(() => import('../modules/governance/pages/GovernanceChangesPage'));

export const governanceRoutes = (Wrap) => [
  {
    path: '/engineering/governance',
    element: <Wrap><GovernanceDashboardLayout /></Wrap>,
    children: [
      { index: true, element: <Wrap><GovernanceOverviewPage /></Wrap> },
      { path: 'roadmap', element: <Wrap><GovernanceRoadmapPage /></Wrap> },
      { path: 'workstreams', element: <Wrap><GovernanceWorkstreamsPage /></Wrap> },
      { path: 'security', element: <Wrap><GovernanceSecurityPage /></Wrap> },
      { path: 'findings', element: <Wrap><GovernanceFindingsPage /></Wrap> },
      { path: 'evidence', element: <Wrap><GovernanceEvidencePage /></Wrap> },
      { path: 'domains', element: <Wrap><GovernanceDomainsPage /></Wrap> },
      { path: 'tests', element: <Wrap><GovernanceTestsPage /></Wrap> },
      { path: 'database', element: <Wrap><GovernanceDatabasePage /></Wrap> },
      { path: 'changes', element: <Wrap><GovernanceChangesPage /></Wrap> }
    ]
  }
];
