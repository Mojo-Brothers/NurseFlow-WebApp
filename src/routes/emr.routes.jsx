import React, { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const UnifiedPatientChart = lazy(() => import('../modules/clinical_core/pages/UnifiedPatientChart'));
const DoctorWorkspacePage = lazy(() => import('../modules/clinical_core/pages/DoctorWorkspacePage'));
const OperatingTheatreWorkspacePage = lazy(() => import('../modules/surgery/pages/OperatingTheatreWorkspacePage'));
const GoLiveControlCenter = lazy(() => import('../modules/integration/pages/GoLiveControlCenter'));

// EMR Modules & Pages
const EmrHubPage = lazy(() => import('../modules/emr/pages/EmrHubPage'));
const UploadPenunjangPage = lazy(() => import('../modules/emr/pages/UploadPenunjangPage'));
const RujukanInternalPage = lazy(() => import('../modules/emr/pages/RujukanInternalPage'));
const CatatanTerintegrasiPage = lazy(() => import('../modules/emr/pages/CatatanTerintegrasiPage'));
const DaftarPemeriksaanRjPage = lazy(() => import('../modules/emr/pages/DaftarPemeriksaanRjPage'));
const LaporanBulananUgdPage = lazy(() => import('../modules/emr/pages/LaporanBulananUgdPage'));
const DaftarPemeriksaanRiPage = lazy(() => import('../modules/emr/pages/DaftarPemeriksaanRiPage'));
const CatatanAnestesiPage = lazy(() => import('../modules/emr/pages/CatatanAnestesiPage'));

export const emrRoutes = (Wrap) => [
  {
    element: <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      // Core EMR Hub & Navigation
      { path: "/emr", element: <Wrap><EmrHubPage /></Wrap> },
      { path: "/emr/upload-penunjang", element: <Wrap><UploadPenunjangPage /></Wrap> },
      { path: "/emr/rujukan-internal", element: <Wrap><RujukanInternalPage /></Wrap> },
      { path: "/emr/catatan-terintegrasi", element: <Wrap><CatatanTerintegrasiPage /></Wrap> },
      
      // EMR Rawat Jalan (RJ)
      { path: "/emr-rj", element: <Wrap><DaftarPemeriksaanRjPage /></Wrap> },
      { path: "/emr-rj/daftar-pemeriksaan", element: <Wrap><DaftarPemeriksaanRjPage /></Wrap> },
      { path: "/emr-rj/laporan-ugd", element: <Wrap><LaporanBulananUgdPage /></Wrap> },
      
      // EMR Rawat Inap (RI)
      { path: "/emr-ri", element: <Wrap><DaftarPemeriksaanRiPage /></Wrap> },
      { path: "/emr-ri/daftar-pemeriksaan", element: <Wrap><DaftarPemeriksaanRiPage /></Wrap> },
      { path: "/emr-ri/catatan-anestesi", element: <Wrap><CatatanAnestesiPage /></Wrap> },
      { path: "/emr-ri/catatan-terintegrasi", element: <Wrap><CatatanTerintegrasiPage /></Wrap> },
      
      // Patient Chart (Unified Longitudinal Chart)
      { path: "/patient-chart", element: <Wrap><UnifiedPatientChart /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'DOCTOR', 'ADMIN', 'SUPERVISOR']} />,
    children: [
      { path: "/surgery", element: <Wrap><OperatingTheatreWorkspacePage /></Wrap> }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'IT_ADMIN']} />,
    children: [
      { path: "/go-live-control", element: <Wrap><GoLiveControlCenter /></Wrap> }
    ]
  }
];

