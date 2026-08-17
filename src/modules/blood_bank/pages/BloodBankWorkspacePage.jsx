import React, { useState } from 'react';
import BloodInventoryColdChainStudio from '../components/BloodInventoryColdChainStudio.jsx';
import DigitalCrossmatchStudio from '../components/DigitalCrossmatchStudio.jsx';
import BedsideTransfusionVerificationStudio from '../components/BedsideTransfusionVerificationStudio.jsx';

export default function BloodBankWorkspacePage() {
  const [activeTab, setActiveTab] = useState('INVENTORY'); // 'INVENTORY' | 'CROSSMATCH' | 'BEDSIDE_MTP'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">bloodtype</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Blood Bank (BDRS) Transfusion Safety Center</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                Permenkes 91/2015 & JCI IPSG 1
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cold Chain Management, Gel-Test Crossmatch, MTP 1:1:1 Protocol, Dual Nurse Bedside Verification & Hemovigilance
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INVENTORY'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Stok & Cold Chain</span>
          </button>

          <button
            onClick={() => setActiveTab('CROSSMATCH')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CROSSMATCH'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">biotech</span>
            <span>Uji Silang (Crossmatch)</span>
          </button>

          <button
            onClick={() => setActiveTab('BEDSIDE_MTP')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BEDSIDE_MTP'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Bedside & MTP 1:1:1</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'INVENTORY' && <BloodInventoryColdChainStudio />}
        {activeTab === 'CROSSMATCH' && <DigitalCrossmatchStudio />}
        {activeTab === 'BEDSIDE_MTP' && <BedsideTransfusionVerificationStudio />}
      </div>
    </div>
  );
}
