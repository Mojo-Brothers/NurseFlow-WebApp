import React, { useState } from 'react';
import { bedManagementFsmEngine } from '../../../../server/services/bedManagementFsmEngine.service.js';
import LiveWardMapStudio from '../components/LiveWardMapStudio.jsx';
import BarberJohnsonAnalyticsStudio from '../components/BarberJohnsonAnalyticsStudio.jsx';
import HousekeepingQueueStudio from '../components/HousekeepingQueueStudio.jsx';
import PredictiveBedAvailabilityStudio from '../components/PredictiveBedAvailabilityStudio.jsx';

export default function BedManagementCenterPage() {
  const [activeTab, setActiveTab] = useState('WARD_MAP'); // 'WARD_MAP' | 'BARBER_JOHNSON' | 'HOUSEKEEPING' | 'PREDICTIVE'
  const totalRegisteredBeds = bedManagementFsmEngine.getAllBeds().length;

  const TABS = [
    { id: 'WARD_MAP', label: '1. Live Ward Map (2D Grid)', icon: 'grid_view' },
    { id: 'BARBER_JOHNSON', label: '2. Barber-Johnson Live Engine', icon: 'analytics' },
    { id: 'HOUSEKEEPING', label: '3. Housekeeping Turnover', icon: 'cleaning_services' },
    { id: 'PREDICTIVE', label: '4. AI Predictive Availability', icon: 'auto_awesome' }
  ];

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Governance Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              NurseFlow Enterprise HIS 2026
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              JCI PATIENT SAFETY & CAPACITY CENTER
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              GATE 1F.2
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Bed Management Center & Barber-Johnson Live Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Pusat operasional manajemen tempat tidur rumah sakit: 10-state Finite State Machine (FSM), alur pemindahan pasien, antrean sanitasi housekeeping, grafik Barber-Johnson realtime (BOR/ALOS/TOI/BTO), dan prediksi ketersediaan berbasis AI.
          </p>
        </div>

        {/* Live Facility Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-xl">hotel</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Kapasitas Rawat Inap</p>
            <p className="font-mono text-xs font-black text-slate-900 dark:text-white">{totalRegisteredBeds} Bed Terdaftar</p>
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
        {activeTab === 'WARD_MAP' && <LiveWardMapStudio />}
        {activeTab === 'BARBER_JOHNSON' && <BarberJohnsonAnalyticsStudio />}
        {activeTab === 'HOUSEKEEPING' && <HousekeepingQueueStudio />}
        {activeTab === 'PREDICTIVE' && <PredictiveBedAvailabilityStudio />}
      </div>
    </div>
  );
}
