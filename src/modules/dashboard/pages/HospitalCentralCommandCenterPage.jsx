import React, { useState } from 'react';
import OperationalCockpitLiveTelemetry from '../components/OperationalCockpitLiveTelemetry.jsx';
import CapacityCommandStudio from '../components/CapacityCommandStudio.jsx';
import EmergencyCommandStudio from '../components/EmergencyCommandStudio.jsx';
import FinancialCommandStudio from '../components/FinancialCommandStudio.jsx';
import ClinicalSafetyCommandStudio from '../components/ClinicalSafetyCommandStudio.jsx';
import BloodBankCommandStudio from '../components/BloodBankCommandStudio.jsx';
import ExecutiveKpiCommandStudio from '../components/ExecutiveKpiCommandStudio.jsx';
import ClinicalEvidenceWarehouseStudio from '../components/ClinicalEvidenceWarehouseStudio.jsx';
import ExecutiveAlertCenter from '../components/ExecutiveAlertCenter.jsx';

export default function HospitalCentralCommandCenterPage() {
  const [activeTab, setActiveTab] = useState('CAPACITY'); // 'CAPACITY' | 'EMERGENCY' | 'FINANCE' | 'SAFETY' | 'BLOOD' | 'KPIS' | 'EVIDENCE'

  const TABS = [
    { id: 'CAPACITY', label: '1. Capacity Command (BOR/ICU)', icon: 'hotel' },
    { id: 'EMERGENCY', label: '2. Emergency SLA (IGD)', icon: 'emergency' },
    { id: 'FINANCE', label: '3. Financial Cycle & BPJS', icon: 'payments' },
    { id: 'SAFETY', label: '4. Clinical Safety (JCI)', icon: 'verified_user' },
    { id: 'BLOOD', label: '5. Blood Bank (BDRS)', icon: 'bloodtype' },
    { id: 'KPIS', label: '6. Executive KPIs (NDR/GDR)', icon: 'insights' },
    { id: 'EVIDENCE', label: '7. Clinical Evidence (90-Day Proof)', icon: 'fact_check' }
  ];

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              NurseFlow Hospital Operating System (HOS)
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              EXECUTIVE C-SUITE COCKPIT
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              GATE 1F.4
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Hospital Central Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Pusat komando eksekutif direksi rumah sakit: konsolidasi 6 domain intelijen operasional (Kapasitas Bed, Triase IGD, Siklus Finansial BPJS, Mutu Keselamatan JCI, Persediaan Darah BDRS, dan Indikator Kemenkes).
          </p>
        </div>

        {/* Executive Director Profile Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Direktur Utama RS</p>
            <p className="font-bold text-xs text-slate-900 dark:text-white">dr. Surya Wijaya, MARS</p>
          </div>
        </div>
      </div>

      {/* 30-Second Real-time Situational Awareness Cockpit */}
      <OperationalCockpitLiveTelemetry />

      {/* Real-time Executive Alert Action Center */}
      <ExecutiveAlertCenter />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'CAPACITY' && <CapacityCommandStudio />}
        {activeTab === 'EMERGENCY' && <EmergencyCommandStudio />}
        {activeTab === 'FINANCE' && <FinancialCommandStudio />}
        {activeTab === 'SAFETY' && <ClinicalSafetyCommandStudio />}
        {activeTab === 'BLOOD' && <BloodBankCommandStudio />}
        {activeTab === 'KPIS' && <ExecutiveKpiCommandStudio />}
        {activeTab === 'EVIDENCE' && <ClinicalEvidenceWarehouseStudio />}
      </div>
    </div>
  );
}
