import React, { useState } from 'react';
import ModalityWorklistStudio from '../components/ModalityWorklistStudio.jsx';
import DicomWebViewer from '../components/DicomWebViewer.jsx';
import RadiologyReportingStudio from '../components/RadiologyReportingStudio.jsx';
import UrgentRadiologyAlertModal from '../components/UrgentRadiologyAlertModal.jsx';
import PatientClinicalTimeline from '../components/PatientClinicalTimeline.jsx';
import RadiologyKpiDashboard from '../components/RadiologyKpiDashboard.jsx';
import { pacsDicomEngineService } from '../services/pacsDicomEngine.service.js';

export default function RadiologyWorkspacePage() {
  const [studies] = useState(pacsDicomEngineService.queryStudies());
  const [selectedStudy, setSelectedStudy] = useState(studies[0] || null);
  const [activeRightTab, setActiveRightTab] = useState('VIEWER'); // 'VIEWER' | 'REPORT' | 'TIMELINE' | 'KPI'
  const [criticalModalData, setCriticalModalData] = useState(null);

  const handleStudySelect = (study) => {
    setSelectedStudy(study);
  };

  const handleCriticalAlert = (alertData) => {
    setCriticalModalData(alertData);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">radiology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">PACS & Radiology Information System (RIS)</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                DICOMweb PS 3.18 & JCI IPSG 2
              </span>
            </div>
            <p className="text-xs text-slate-500">
              CPOE Orders FSM, Modality Worklist (MWL), Diagnostik Citra Lossless DICOM WADO-RS & EMR Timeline
            </p>
          </div>
        </div>

        {/* View / Report / Timeline / KPI Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveRightTab('VIEWER')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'VIEWER'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
            <span>DICOM Viewer</span>
          </button>

          <button
            onClick={() => setActiveRightTab('REPORT')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'REPORT'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Ekspertise Sp.Rad</span>
          </button>

          <button
            onClick={() => setActiveRightTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'TIMELINE'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">timeline</span>
            <span>Timeline Pasien</span>
          </button>

          <button
            onClick={() => setActiveRightTab('KPI')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'KPI'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Dashboard Mutu KPI</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 p-4 flex flex-col xl:flex-row gap-4 max-w-7xl w-full mx-auto">
        {/* Left Column: Modality Worklist (MWL) Studio */}
        <div className="w-full xl:w-96">
          <ModalityWorklistStudio
            onSelectStudy={handleStudySelect}
            activeStudyUid={selectedStudy?.studyInstanceUid}
          />
        </div>

        {/* Right Column: Active Tab Content */}
        <div className="flex-1">
          {activeRightTab === 'VIEWER' && (
            <DicomWebViewer study={selectedStudy} />
          )}

          {activeRightTab === 'REPORT' && (
            <RadiologyReportingStudio
              activeStudy={selectedStudy}
              onCriticalAlertTriggered={handleCriticalAlert}
            />
          )}

          {activeRightTab === 'TIMELINE' && (
            <PatientClinicalTimeline
              patientMrn={selectedStudy?.patientMrn}
              patientName={selectedStudy?.patientName}
            />
          )}

          {activeRightTab === 'KPI' && (
            <RadiologyKpiDashboard />
          )}
        </div>
      </div>

      {/* Urgent Critical Finding Modal */}
      {criticalModalData && (
        <UrgentRadiologyAlertModal
          alertData={criticalModalData}
          onClose={() => setCriticalModalData(null)}
        />
      )}
    </div>
  );
}
