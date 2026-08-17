import React, { useState } from 'react';
import FhirResourceExplorerStudio from '../components/FhirResourceExplorerStudio.jsx';
import FhirBundleBuilderStudio from '../components/FhirBundleBuilderStudio.jsx';
import FhirResourceValidatorStudio from '../components/FhirResourceValidatorStudio.jsx';
import SatusehatTransmissionSimulatorStudio from '../components/SatusehatTransmissionSimulatorStudio.jsx';

export default function SatusehatInteroperabilityStudioPage() {
  const [activeTab, setActiveTab] = useState('EXPLORER'); // 'EXPLORER' | 'BUNDLE' | 'VALIDATOR' | 'TRANSMISSION'

  const TABS = [
    { id: 'EXPLORER', label: '1. Resource Explorer & JSON', icon: 'data_object' },
    { id: 'BUNDLE', label: '2. Bundle Builder Studio', icon: 'account_tree' },
    { id: 'VALIDATOR', label: '3. Resource Validator', icon: 'verified' },
    { id: 'TRANSMISSION', label: '4. Transmission Simulator', icon: 'send' }
  ];

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              NurseFlow Enterprise Interoperability Studio
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              KEMENKES DTO SATUSEHAT HL7 FHIR R4
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              GATE 1F.1
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            SATUSEHAT FHIR R4 Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Pusat manajemen interoperabilitas data rekam medis elektronik nasional: serialisasi 12 profil klinis resmi Kemenkes, validasi terminologi ICD/LOINC/KFA, perakitan transaksi bundle, dan transmisi sandbox OAuth2.
          </p>
        </div>

        {/* Status Org Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-xl">domain</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">SATUSEHAT Org ID</p>
            <p className="font-mono text-xs font-black text-slate-900 dark:text-white">100028741 (RSNF-PUSAT)</p>
          </div>
        </div>
      </div>

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
        {activeTab === 'EXPLORER' && <FhirResourceExplorerStudio />}
        {activeTab === 'BUNDLE' && <FhirBundleBuilderStudio />}
        {activeTab === 'VALIDATOR' && <FhirResourceValidatorStudio />}
        {activeTab === 'TRANSMISSION' && <SatusehatTransmissionSimulatorStudio />}
      </div>
    </div>
  );
}
