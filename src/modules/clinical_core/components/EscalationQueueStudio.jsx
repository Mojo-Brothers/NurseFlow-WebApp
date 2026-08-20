/**
 * NurseFlow Enterprise HIS 2026 — Escalation Queue Studio
 * Dedicated Real-Time Escalation Monitor & Auto-Escalation Hierarchy Controls
 */

import React from 'react';
import { AUTO_ESCALATION_LEVELS } from '../services/clinicalCommandOperations.service.js';

export default function EscalationQueueStudio({
  escalations = [],
  onAcknowledge = () => {},
  onPagingDoctor = () => {},
  onPagingMet = () => {}
}) {
  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-lg"
      data-testid="escalation-queue-studio"
      role="region"
      aria-label="Escalation Queue Studio"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🚨 ESCALATION QUEUE & RESPONSE HIERARCHY
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar Peringatan yang Membutuhkan Intervensi & Eskalasi Cito
          </p>
        </div>
        <span className="rounded-full bg-red-100 dark:bg-red-950 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300">
          {escalations.length} Active Escalations
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {escalations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">
            Semua alert klinis telah direspons. Tidak ada antrean eskalasi aktif.
          </div>
        ) : (
          escalations.map((item, idx) => {
            const isLevel3 = item.escalationLevel === AUTO_ESCALATION_LEVELS.LEVEL_3_HEAD_NURSE_DIRECTOR;
            const isLevel2 = item.escalationLevel === AUTO_ESCALATION_LEVELS.LEVEL_2_MET_DPJP;
            const isLevel1 = item.escalationLevel === AUTO_ESCALATION_LEVELS.LEVEL_1_WARD_DOCTOR;

            return (
              <div 
                key={idx}
                className={`rounded-lg border-2 p-4 ${isLevel3 ? 'border-red-700 bg-red-50 dark:bg-red-950/40 animate-pulse' : (isLevel2 ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20')}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                      {item.wardOrBedLocation}
                    </span>
                    <strong className="ml-2 text-xs text-slate-900 dark:text-white">
                      {item.patientName} ({item.mrn})
                    </strong>
                  </div>
                  <span className="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase">
                    Level: {item.escalationLevel}
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Krisis: {item.clinicalSignal?.title || 'Perburukan Kondisi Klinis'}
                </p>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  {!item.acknowledgement && (
                    <button
                      onClick={() => onAcknowledge(item)}
                      className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-sm"
                    >
                      [ACKNOWLEDGE]
                    </button>
                  )}
                  {isLevel1 && (
                    <button
                      onClick={() => onPagingDoctor(item)}
                      className="rounded bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 text-xs font-bold shadow-sm"
                    >
                      [PAGER DOKTER JAGA]
                    </button>
                  )}
                  {(isLevel2 || isLevel3) && (
                    <button
                      onClick={() => onPagingMet(item)}
                      className="rounded bg-red-700 hover:bg-red-600 text-white px-3 py-1 text-xs font-bold shadow-sm"
                    >
                      🚨 [PANGGIL TIM MET CITO]
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
