/**
 * NurseFlow Enterprise HIS 2026 — Evidence Lineage Viewer
 * Deterministic Lineage Provenance Inspector (Zero Black-Box Explanations)
 */

import React from 'react';

export default function EvidenceLineageViewer({
  lineage = {
    recommendationId: 'REC-2026-001921',
    appliedRuleId: 'HOSP-RULE-TRAJECTORY-HEMODYNAMIC-V2026.08',
    inputObservations: [
      { time: '14:21', param: 'MAP', val: '68 mmHg' },
      { time: '14:24', param: 'MAP', val: '64 mmHg' },
      { time: '14:27', param: 'MAP', val: '61 mmHg' }
    ],
    calculatedVelocity: { param: 'MAP', slope: '-4.7 mmHg/h', formula: 'Delta_MAP / Delta_T' },
    resultingPriorityTier: 'IMMEDIATE_LIFE_THREAT',
    actionHeadline: 'BEDSIDE DPJP SPECIALIST ASSESSMENT (<= 15M)',
    deterministicFormulas: ['Delta_MAP = (MAP_now - MAP_prev) / Delta_T'],
    humanDecision: { actor: 'dr. Budi, Sp.PD (DPJP)', action: 'APPROVED_FLUID_CHALLENGE', timestamp: '14:36 WIB' },
    tamperProofHash: '7f3b8c12a019485bcf8e1194205819aaec71928490aefd918237490184910284'
  },
  onClose = () => {}
}) {
  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      data-testid="evidence-lineage-viewer"
      role="region"
      aria-label="Evidence Lineage Viewer"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🧬 EVIDENCE LINEAGE PROVENANCE INSPECTOR
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Silsilah Bukti Rekomendasi Klinis Deterministik (Bebas Black-Box AI)
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-xs">✕ Tutup</button>
      </div>

      <div className="my-4 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">ID Aturan Protokol RS</span>
            <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">
              {lineage.appliedRuleId}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">Tingkat Prioritas Hasil</span>
            <p className="font-bold text-red-600 mt-1 uppercase">
              {lineage.resultingPriorityTier}
            </p>
          </div>
        </div>

        {/* ─── Titik Observasi Masukan ─── */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
            1. Observasi Fisiologis Mentah yang Memicu:
          </span>
          <div className="space-y-1">
            {lineage.inputObservations?.map((obs, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <span>[{obs.time}] {obs.param}</span>
                <strong className="text-slate-900 dark:text-white">{obs.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Rumus & Kalkulus Deterministik ─── */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
            2. Rumus & Laju Perubahan Fisiologis:
          </span>
          <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            {lineage.calculatedVelocity?.param}: {lineage.calculatedVelocity?.slope}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Formula: {lineage.calculatedVelocity?.formula || lineage.deterministicFormulas?.[0]}
          </p>
        </div>

        {/* ─── Respon Klinisi Manusia ─── */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
            3. Respon & Keputusan Klinisi Manusia (Human-in-the-loop):
          </span>
          {lineage.humanDecision ? (
            <p className="text-slate-800 dark:text-slate-200">
              Aktor: <strong>{lineage.humanDecision.actor}</strong> | Tindakan: <strong>{lineage.humanDecision.action}</strong> ({lineage.humanDecision.timestamp})
            </p>
          ) : (
            <p className="text-slate-500 italic">Menunggu respon/keputusan klinisi.</p>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>WORM Merkle Root: {lineage.tamperProofHash}</span>
        </div>
      </div>
    </div>
  );
}
