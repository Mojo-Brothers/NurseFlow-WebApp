import React, { useState } from 'react';
import MultiDepotFefoInventoryStudio from '../components/MultiDepotFefoInventoryStudio.jsx';
import ClinicalDispensingStudio from '../components/ClinicalDispensingStudio.jsx';
import DeviceRecallAndImplantSafetyStudio from '../components/DeviceRecallAndImplantSafetyStudio.jsx';

export default function EnterprisePharmacyWorkspacePage() {
  const [activeTab, setActiveTab] = useState('FEFO_INVENTORY'); // 'FEFO_INVENTORY' | 'CLINICAL_DISPENSING' | 'RECALL_CENTER'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">local_pharmacy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Enterprise Pharmacy & Multi-Depot FEFO Studio</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                Permenkes 73/2016 & JCI MMU
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multi-Depot Stock, FEFO Deduction, 7-Prinsip Telaah Resep, Controlled Substance Dual Sign-off & Recall Vigilance
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('FEFO_INVENTORY')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FEFO_INVENTORY'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Multi-Depot FEFO</span>
          </button>

          <button
            onClick={() => setActiveTab('CLINICAL_DISPENSING')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CLINICAL_DISPENSING'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">prescriptions</span>
            <span>Telaah & Dispensing</span>
          </button>

          <button
            onClick={() => setActiveTab('RECALL_CENTER')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RECALL_CENTER'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>Recall Center</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'FEFO_INVENTORY' && <MultiDepotFefoInventoryStudio />}
        {activeTab === 'CLINICAL_DISPENSING' && <ClinicalDispensingStudio />}
        {activeTab === 'RECALL_CENTER' && <DeviceRecallAndImplantSafetyStudio />}
      </div>
    </div>
  );
}
