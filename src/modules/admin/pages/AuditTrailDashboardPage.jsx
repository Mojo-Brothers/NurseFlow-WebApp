import React, { useState } from 'react';
import AuditLedgerExplorerStudio from '../components/audit/AuditLedgerExplorerStudio.jsx';
import Sha256ChainVerifierStudio from '../components/audit/Sha256ChainVerifierStudio.jsx';
import BreakTheGlassMonitorStudio from '../components/audit/BreakTheGlassMonitorStudio.jsx';
import HighRiskAccessDetectorStudio from '../components/audit/HighRiskAccessDetectorStudio.jsx';
import ComplianceReportingStudio from '../components/audit/ComplianceReportingStudio.jsx';

export default function AuditTrailDashboardPage() {
  const [activeTab, setActiveTab] = useState('LEDGER'); // 'LEDGER' | 'VERIFIER' | 'BREAK_GLASS' | 'ANOMALIES' | 'COMPLIANCE'

  const TABS = [
    { id: 'LEDGER', label: '1. Audit Ledger Explorer', icon: 'table_chart' },
    { id: 'VERIFIER', label: '2. SHA-256 Chain Verifier', icon: 'lock_reset' },
    { id: 'BREAK_GLASS', label: '3. Break-the-Glass Monitor', icon: 'emergency' },
    { id: 'ANOMALIES', label: '4. High-Risk Access Detector', icon: 'warning' },
    { id: 'COMPLIANCE', label: '5. Compliance Scorecard', icon: 'verified' }
  ];

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              NurseFlow Forensic Security Governance
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              JCI MOI.7 & ISO 27001 ISMS
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              GATE 1F.3
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            JCI Immutable Forensic Audit Trail & Break-the-Glass Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Sistem pengawasan jejak audit forensik immutable anti-tampering: verifikasi kriptografi SHA-256 berantai, pengawasan akses darurat Break-the-Glass, detektor anomali akses berisiko tinggi, dan kepatuhan akreditasi rumah sakit.
          </p>
        </div>

        {/* Security Status Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-xl">shield</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Ledger Immutability</p>
            <p className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">APPEND-ONLY SECURED</p>
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
        {activeTab === 'LEDGER' && <AuditLedgerExplorerStudio />}
        {activeTab === 'VERIFIER' && <Sha256ChainVerifierStudio />}
        {activeTab === 'BREAK_GLASS' && <BreakTheGlassMonitorStudio />}
        {activeTab === 'ANOMALIES' && <HighRiskAccessDetectorStudio />}
        {activeTab === 'COMPLIANCE' && <ComplianceReportingStudio />}
      </div>
    </div>
  );
}
