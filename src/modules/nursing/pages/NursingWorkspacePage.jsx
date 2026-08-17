import React, { useState } from 'react';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import NursingCommandCenter from '../components/NursingCommandCenter.jsx';
import EmarAdministrationStudio from '../components/EmarAdministrationStudio.jsx';
import FluidBalanceSheet from '../components/FluidBalanceSheet.jsx';
import NursingAssessmentAndPlan from '../components/NursingAssessmentAndPlan.jsx';
import PatientJourneyTimeline from '../../patient/components/PatientJourneyTimeline.jsx';

export default function NursingWorkspacePage() {
  const [activeTab, setActiveTab] = useState('COMMAND_CENTER'); // 'COMMAND_CENTER' | 'EMAR' | 'FLUID_BALANCE' | 'CARE_PLAN'
  const { activePatientId } = useEncounterStore();
  const { patients } = usePatientStore();

  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">medical_services</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Nursing Care & eMAR Workspace</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                JCI IPSG 3 & 6 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pusat Pelayanan Keperawatan Rawat Inap, Administrasi Obat (5-Benar), Balans Cairan & ISBAR Handover
            </p>
          </div>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMMAND_CENTER'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Bed Grid & Worklist</span>
          </button>

          <button
            onClick={() => setActiveTab('EMAR')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EMAR'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">vaccines</span>
            <span>eMAR (5-Benar Obat)</span>
          </button>

          <button
            onClick={() => setActiveTab('FLUID_BALANCE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FLUID_BALANCE'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">water_drop</span>
            <span>Balans Cairan 24 Jam</span>
          </button>

          <button
            onClick={() => setActiveTab('CARE_PLAN')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CARE_PLAN'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">assignment</span>
            <span>Pengkajian & SDKI/SIKI</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Content Area with Right-Rail Timeline */}
      <div className="flex-1 p-4 flex flex-col xl:flex-row gap-4 max-w-7xl w-full mx-auto">
        {/* Left Column: Tab Component */}
        <div className="flex-1">
          {activeTab === 'COMMAND_CENTER' && (
            <NursingCommandCenter onSelectPatientTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'EMAR' && (
            <EmarAdministrationStudio activePatient={activePatient} />
          )}
          {activeTab === 'FLUID_BALANCE' && (
            <FluidBalanceSheet activePatient={activePatient} />
          )}
          {activeTab === 'CARE_PLAN' && (
            <NursingAssessmentAndPlan activePatient={activePatient} />
          )}
        </div>

        {/* Right Rail: Patient Clinical Journey Timeline */}
        <div className="w-full xl:w-80">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">timeline</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Timeline Asuhan Pasien</h4>
            </div>
            <PatientJourneyTimeline patientId={activePatient?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
