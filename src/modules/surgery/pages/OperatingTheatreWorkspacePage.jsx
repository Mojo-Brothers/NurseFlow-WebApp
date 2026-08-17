import React, { useState } from 'react';
import InteractiveSurgeryBoard from '../components/InteractiveSurgeryBoard.jsx';
import WhoSurgicalSafetyStudio from '../components/WhoSurgicalSafetyStudio.jsx';
import SurgicalClinicalNotesStudio from '../components/SurgicalClinicalNotesStudio.jsx';
import PacuRecoveryAndAldreteStudio from '../components/PacuRecoveryAndAldreteStudio.jsx';
import SurgicalRevenueAndInaCbgStudio from '../components/SurgicalRevenueAndInaCbgStudio.jsx';
import { operatingTheatreEngineService } from '../services/operatingTheatreEngine.service.js';

export default function OperatingTheatreWorkspacePage() {
  const [cases] = useState(operatingTheatreEngineService.getCases());
  const [selectedCase, setSelectedCase] = useState(cases[0] || null);
  const [activeTab, setActiveTab] = useState('WHO_CHECKLIST'); // 'WHO_CHECKLIST' | 'OPERATIVE_NOTE' | 'PACU_ALDRETE' | 'BILLING_INACBG'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">surgical</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Operating Theatre (IBS) Command Center</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                JCI IPSG 4 & INA-CBG Financials
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Surgery Matrix, WHO Safety Checklist, Operative Reports, UDI Implants, CSSD Tracking & INA-CBG Grouper
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('WHO_CHECKLIST')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WHO_CHECKLIST'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>WHO Safety</span>
          </button>

          <button
            onClick={() => setActiveTab('OPERATIVE_NOTE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OPERATIVE_NOTE'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
            <span>Laporan Operasi</span>
          </button>

          <button
            onClick={() => setActiveTab('PACU_ALDRETE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PACU_ALDRETE'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bedtime</span>
            <span>PACU Aldrete</span>
          </button>

          <button
            onClick={() => setActiveTab('BILLING_INACBG')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BILLING_INACBG'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Biaya & INA-CBG</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {/* Operating Room Status Matrix */}
        <InteractiveSurgeryBoard
          onSelectCase={(c) => setSelectedCase(c)}
          activeCaseId={selectedCase?.id}
        />

        {/* Dynamic Studio Tab */}
        <div>
          {activeTab === 'WHO_CHECKLIST' && (
            <WhoSurgicalSafetyStudio activeCase={selectedCase} />
          )}

          {activeTab === 'OPERATIVE_NOTE' && (
            <SurgicalClinicalNotesStudio activeCase={selectedCase} />
          )}

          {activeTab === 'PACU_ALDRETE' && (
            <PacuRecoveryAndAldreteStudio activeCase={selectedCase} />
          )}

          {activeTab === 'BILLING_INACBG' && (
            <SurgicalRevenueAndInaCbgStudio activeCase={selectedCase} />
          )}
        </div>
      </div>
    </div>
  );
}
