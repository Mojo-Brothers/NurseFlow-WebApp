/**
 * NurseFlow Enterprise HIS 2026 — Production Hardening & SRE Dashboard
 * Real-Time Site Reliability Engineering (SRE) & Platform Health Monitor
 */

import React, { useState } from 'react';
import { CIRCUIT_BREAKER_STATES, HEALTH_STATUS } from '../../core/services/productionPlatformHardening.service.js';

export default function ProductionHardeningSreDashboard({
  healthData = {
    status: HEALTH_STATUS.HEALTHY,
    details: {
      database: 'CONNECTED',
      memoryUsageMb: 84,
      circuitBreakersOpenCount: 0,
      dlqDepth: 0,
      p95LatencyMs: 48
    }
  },
  circuitBreakers = [
    { serviceName: 'SATUSEHAT_GATEWAY', state: CIRCUIT_BREAKER_STATES.CLOSED, failureCount: 0 },
    { serviceName: 'BPJS_VCLAIM_GATEWAY', state: CIRCUIT_BREAKER_STATES.CLOSED, failureCount: 0 },
    { serviceName: 'PACS_DICOM_SERVER', state: CIRCUIT_BREAKER_STATES.CLOSED, failureCount: 0 }
  ],
  onReplayDlq = () => {},
  onClose = () => {}
}) {
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const isHealthy = healthData.status === HEALTH_STATUS.HEALTHY;

  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-white shadow-2xl"
      data-testid="production-hardening-sre-dashboard"
      role="region"
      aria-label="Production Hardening SRE Dashboard"
    >
      {/* ─── Header Dashboard ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              🛠️ PRODUCTION SRE & PLATFORM HARDENING DASHBOARD
            </h2>
            <span className={`rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isHealthy ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-300 animate-pulse'}`}>
              System: {healthData.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring Keandalan Transaksi, Circuit Breaker, Observabilitas & Telemetri SRE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReplayDlq}
            className="rounded bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow transition"
          >
            🔄 Replay Dead-Letter Queue ({healthData.details?.dlqDepth || 0})
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
          >
            ✕ Tutup
          </button>
        </div>
      </div>

      {/* ─── Quick SRE Key Metrics ─── */}
      <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Database Persistence</span>
          <h4 className="text-base font-mono font-black text-emerald-400 mt-1">
            {healthData.details?.database || 'CONNECTED'}
          </h4>
          <span className="text-[10px] text-slate-500">In-Memory / PostgreSQL HA</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Memory Heap Usage</span>
          <h4 className="text-base font-mono font-black text-teal-400 mt-1">
            {healthData.details?.memoryUsageMb || 64} MB
          </h4>
          <span className="text-[10px] text-slate-500">Target Shift: &lt; 250 MB</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Alert Delivery Latency (p95)</span>
          <h4 className="text-base font-mono font-black text-cyan-400 mt-1">
            {healthData.details?.p95LatencyMs || 0} ms
          </h4>
          <span className="text-[10px] text-slate-500">Target SRE: &lt; 250 ms</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Dead-Letter Queue Depth</span>
          <h4 className={`text-base font-mono font-black mt-1 ${healthData.details?.dlqDepth > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {healthData.details?.dlqDepth || 0} Pesan
          </h4>
          <span className="text-[10px] text-slate-500">Isolasi Kegagalan Parsial</span>
        </div>
      </div>

      {/* ─── Circuit Breaker Matrix ─── */}
      <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Status Integrasi Gateway Eksternal & Circuit Breakers
        </h4>

        <div className="space-y-2">
          {circuitBreakers.map((cb, idx) => {
            const isClosed = cb.state === CIRCUIT_BREAKER_STATES.CLOSED;
            const isOpen = cb.state === CIRCUIT_BREAKER_STATES.OPEN;

            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs"
              >
                <div>
                  <strong className="text-white font-mono">{cb.serviceName}</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kegagalan Beruntun: {cb.failureCount || 0} / Threshold: 5
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${isClosed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : (isOpen ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' : 'bg-amber-950 text-amber-300 border border-amber-800')}`}
                  >
                    STATE: {cb.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
