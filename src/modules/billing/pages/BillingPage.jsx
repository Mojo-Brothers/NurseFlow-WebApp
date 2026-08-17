import React, { useState } from 'react';
import CasemixClaimsQueueStudio from '../components/CasemixClaimsQueueStudio.jsx';
import InaCbgGroupingStudio from '../components/InaCbgGroupingStudio.jsx';
import BpjsDisputeManagementStudio from '../components/BpjsDisputeManagementStudio.jsx';
import RevenueCycleAnalyticsStudio from '../components/RevenueCycleAnalyticsStudio.jsx';
import { casemixRevenueCycleEngineService } from '../../../../server/services/casemixRevenueCycleEngine.service.js';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('CLAIMS_QUEUE'); // 'CLAIMS_QUEUE' | 'GROUPER' | 'DISPUTES' | 'ANALYTICS'
  const [selectedCase, setSelectedCase] = useState(() => casemixRevenueCycleEngineService.getAllCases()[0] || null);

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setActiveTab('GROUPER');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#015C80]/10 border border-[#015C80]/20 text-[#015C80] dark:text-cyan-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Casemix & Revenue Cycle Command Center</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                Permenkes 3/2023 & BPJS V-Claim 2.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Klaim Kolektif INA-CBG 6.0, Rekonsiliasi Kasir Pasien, Penanganan Dispute BPJS & Audit Finansial RS
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('CLAIMS_QUEUE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CLAIMS_QUEUE'
                ? 'bg-white dark:bg-slate-900 text-[#015C80] dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Daftar Klaim Casemix</span>
          </button>

          <button
            onClick={() => setActiveTab('GROUPER')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GROUPER'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            <span>INA-CBG Grouper</span>
          </button>

          <button
            onClick={() => setActiveTab('DISPUTES')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DISPUTES'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Dispute BPJS</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ANALYTICS'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">query_stats</span>
            <span>Analytics Finansial</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'CLAIMS_QUEUE' && <CasemixClaimsQueueStudio onSelectCase={handleSelectCase} />}
        {activeTab === 'GROUPER' && <InaCbgGroupingStudio selectedCase={selectedCase} />}
        {activeTab === 'DISPUTES' && <BpjsDisputeManagementStudio />}
        {activeTab === 'ANALYTICS' && <RevenueCycleAnalyticsStudio />}
      </div>
    </div>
  );
}
