import React from 'react';
import { clinicalTimelineEngine } from '../../../core/services/clinicalTimelineEngine.service.js';

export default function PatientClinicalTimeline({ patientMrn = '-', patientName = '-', patientId = null }) {
  const rawEvents = patientId ? clinicalTimelineEngine.getPatientTimeline(patientId) : [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">timeline</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Alur Pelayanan Klinis Pasien (End-to-End Timeline)</h3>
            <p className="text-xs text-slate-400">Pasien: <strong className="text-slate-700 dark:text-slate-200">{patientName}</strong> • No. RM: <span className="font-mono">{patientMrn}</span></p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase border border-emerald-500/20">
          {rawEvents.length > 0 ? 'EPISODE RAWAT AKTIF' : 'STANDBY'}
        </span>
      </div>

      {rawEvents.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 dark:text-slate-700">history_edu</span>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum Ada Riwayat Perjalanan Pasien</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            Jejak peristiwa radiologi (order CPOE, check-in MWL, akuisisi citra, ekspertise) akan tercatat otomatis saat studi aktif.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {rawEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-teal-500 flex items-center justify-center text-[8px] text-white">
                <span className="material-symbols-outlined text-[10px]">{evt.icon || 'analytics'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500 transition-all space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">{evt.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{evt.details || evt.payload?.notes || JSON.stringify(evt.payload || '')}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                  <span>Unit: {evt.department || evt.sourceEntityType || '-'}</span>
                  <span>Oleh: {evt.actor || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
