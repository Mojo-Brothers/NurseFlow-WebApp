/**
 * NurseFlow Enterprise HIS 2026 — Operational Disaster Recovery Portal
 * Real-Time DR Console, Split-Brain Resolver Inspector & 02:13 AM Outage Drill Runner
 */

import React, { useState } from 'react';
import { INCIDENT_LIFECYCLE_STAGE } from '../../core/services/operationalDisasterRecoveryEngine.service.js';

export default function OperationalDisasterRecoveryPortal({
  drillData = {
    incidentId: 'INC-0213-IGD-OUTAGE',
    stage: INCIDENT_LIFECYCLE_STAGE.RESTORED,
    metrics: {
      timeToDetectSeconds: 35,
      timeToDeclareSeconds: 45,
      timeToRecoverMinutes: 8,
      timeToReconcileMinutes: 3,
      timeToResumeClinicalFlowMinutes: 12
    },
    rpoMinutes: 2,
    rtoMinutes: 12,
    splitBrainStatus: 'ZERO_LOST_ACTIONS'
  },
  onTrigger0213Drill = () => {},
  onClose = () => {}
}) {
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  return (
    <div
      className="rounded-xl border border-red-800/80 bg-slate-950 p-6 text-white shadow-2xl"
      data-testid="operational-disaster-recovery-portal"
      role="region"
      aria-label="Operational Disaster Recovery Portal"
    >
      {/* ─── Header Portal ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-800/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
              🚨 OPERATIONAL DISASTER RECOVERY & READINESS PORTAL
            </h2>
            <span className="rounded bg-red-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-300 border border-red-700">
              STAGE: {drillData.stage || INCIDENT_LIFECYCLE_STAGE.RESTORED}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring Pemulihan Bencana (RPO $\le 5\text{m}$, RTO $\le 15\text{m}$), Split-Brain Resolver & Uji Coba Outage 02:13
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTrigger0213Drill}
            className="rounded bg-red-700 hover:bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow transition flex items-center gap-1.5"
          >
            ⚡ Eksekusi Drill Outage IGD 02:13
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
          >
            ✕ Tutup
          </button>
        </div>
      </div>

      {/* ─── Key RPO / RTO Metrics ─── */}
      <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">RPO (Recovery Point)</span>
          <h4 className="text-base font-mono font-black text-emerald-400 mt-1">
            {drillData.rpoMinutes || 2} Menit
          </h4>
          <span className="text-[10px] text-slate-500">Target JCI: &le; 5 Menit</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">RTO (Recovery Time)</span>
          <h4 className="text-base font-mono font-black text-teal-400 mt-1">
            {drillData.rtoMinutes || 12} Menit
          </h4>
          <span className="text-[10px] text-slate-500">Target JCI: &le; 15 Menit</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Split-Brain Resolution</span>
          <h4 className="text-base font-mono font-black text-cyan-400 mt-1">
            {drillData.splitBrainStatus || 'ZERO_LOST_ACTIONS'}
          </h4>
          <span className="text-[10px] text-slate-500">Vector Clock Merged</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Human Operator SLA</span>
          <h4 className="text-base font-mono font-black text-rose-400 mt-1">
            TTD: {drillData.metrics?.timeToDetectSeconds || 35}s / TTR: {drillData.metrics?.timeToResumeClinicalFlowMinutes || 12}m
          </h4>
          <span className="text-[10px] text-slate-500">SOP Runbook Valid</span>
        </div>
      </div>

      {/* ─── 02:13 Outage Drill Lifecycle Progress ─── */}
      <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Siklus Pemulihan Bencana Outage 02:13 WIB ({drillData.incidentId || 'INC-0213-IGD-OUTAGE'})
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="rounded bg-slate-950 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Deteksi (TTD)</span>
            <strong className="text-emerald-400 font-mono">35 Detik</strong>
          </div>
          <div className="rounded bg-slate-950 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Deklarasi (TTDec)</span>
            <strong className="text-teal-400 font-mono">45 Detik</strong>
          </div>
          <div className="rounded bg-slate-950 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Restore Database (TTR)</span>
            <strong className="text-cyan-400 font-mono">8 Menit</strong>
          </div>
          <div className="rounded bg-slate-950 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Rekonsiliasi (TTRec)</span>
            <strong className="text-indigo-400 font-mono">3 Menit</strong>
          </div>
          <div className="rounded bg-slate-950 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Alur Klinis Pulih (TTRC)</span>
            <strong className="text-emerald-300 font-mono font-black">12 Menit</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
