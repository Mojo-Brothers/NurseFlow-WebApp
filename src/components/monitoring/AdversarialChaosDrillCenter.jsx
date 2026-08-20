/**
 * NurseFlow Enterprise HIS 2026 — Adversarial Chaos Drill Center
 * Interactive Chaos Engineering & 7-Minute Hospital Blackout Drill Simulation Console
 */

import React, { useState } from 'react';
import { DRILL_STATUS } from '../../core/services/adversarialAssuranceEngine.service.js';

export default function AdversarialChaosDrillCenter({
  drillState = {
    status: DRILL_STATUS.IDLE,
    patientId: 'PT-CRITICAL-SEPSIS-01',
    offlineEvents: [],
    reconciledEvents: []
  },
  threats = [],
  onStartBlackout = () => {},
  onSimulateOfflineAction = () => {},
  onReconnectAndReconcile = () => {},
  onClose = () => {}
}) {
  const [selectedThreatTab, setSelectedThreatTab] = useState('ALL');

  const isBlackoutActive = drillState.status === DRILL_STATUS.BLACKOUT_ACTIVE || drillState.status === DRILL_STATUS.OFFLINE_JOURNALING;
  const isCompleted = drillState.status === DRILL_STATUS.COMPLETED;

  return (
    <div
      className="rounded-xl border border-red-900/60 bg-slate-950 p-6 text-white shadow-2xl"
      data-testid="adversarial-chaos-drill-center"
      role="region"
      aria-label="Adversarial Chaos Drill Center"
    >
      {/* ─── Header Console ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
              🛡️ ADVERSARIAL ASSURANCE & CHAOS DRILL CENTER
            </h2>
            <span
              className={`rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                isBlackoutActive
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                  : isCompleted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              DRILL: {drillState.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulasi Serangan Siber, Injeksi Kegagalan Basis Data & Pemadaman Jaringan RS 7 Menit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isBlackoutActive ? (
            <button
              onClick={onStartBlackout}
              className="rounded bg-rose-700 hover:bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow transition flex items-center gap-1.5"
            >
              ⚡ Mulai Simulasi Blackout 7 Menit
            </button>
          ) : (
            <>
              <button
                onClick={onSimulateOfflineAction}
                className="rounded bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow transition"
              >
                📝 Catat TTV & Obat Darurat (Offline)
              </button>
              <button
                onClick={onReconnectAndReconcile}
                className="rounded bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow transition"
              >
                🔄 Pulihkan Jaringan & Rekonsiliasi
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
          >
            ✕ Tutup
          </button>
        </div>
      </div>

      {/* ─── Quick Drill Status Cards ─── */}
      <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Target Pasien Kritis</span>
          <h4 className="text-sm font-mono font-black text-rose-400 mt-1 truncate">
            {drillState.patientId || 'PT-CRITICAL-01'}
          </h4>
          <span className="text-[10px] text-slate-500">Sepsis Shock / NEWS2: 9</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tindakan Offline Tercatat</span>
          <h4 className="text-base font-mono font-black text-amber-400 mt-1">
            {drillState.offlineEvents?.length || 0} Aksi
          </h4>
          <span className="text-[10px] text-slate-500">Jurnal IndexedDB Lokal</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Status Rekonsiliasi Server</span>
          <h4 className="text-base font-mono font-black text-emerald-400 mt-1">
            {drillState.reconciledEvents?.length || 0} Tersinkron
          </h4>
          <span className="text-[10px] text-slate-500">Vector Clock Merged</span>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Integritas Audit WORM</span>
          <h4 className="text-base font-mono font-black text-cyan-400 mt-1">
            100% VALID
          </h4>
          <span className="text-[10px] text-slate-500">SHA-256 Merkle Intact</span>
        </div>
      </div>

      {/* ─── Offline Event Journal Timeline ─── */}
      <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Riwayat Jurnal Tindakan Blackout Jaringan ({drillState.offlineEvents?.length || 0})
        </h4>

        {drillState.offlineEvents?.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            Belum ada simulasi blackout aktif. Tekan tombol &quot;Mulai Simulasi Blackout 7 Menit&quot; di atas untuk memulai.
          </p>
        ) : (
          <div className="space-y-2">
            {drillState.offlineEvents.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs"
              >
                <div>
                  <strong className="text-amber-400 font-mono">{evt.actionType}</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Payload: {JSON.stringify(evt.payload)} | Waktu Rekam: {evt.recordedAt}
                  </p>
                </div>
                <span className="rounded bg-emerald-950 text-emerald-300 px-2 py-0.5 text-[10px] font-bold border border-emerald-800">
                  {isCompleted ? '✓ RECONCILED' : 'LOCAL OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
