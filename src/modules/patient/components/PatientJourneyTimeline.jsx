import React from 'react';
import { clinicalTimelineEngine } from '../../../core/services/clinicalTimelineEngine.service.js';

export default function PatientJourneyTimeline({ patient, patientId, encounter, events }) {
  const activeId = patient?.id || patientId || encounter?.patientId;
  const rawEvents = events || (activeId ? clinicalTimelineEngine.getPatientTimeline(activeId) : []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">timeline</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Alur Perjalanan Pasien (Patient Journey Timeline)</h3>
            <p className="text-[11px] text-slate-500">Jejak peristiwa klinis dan administratif end-to-end terverifikasi</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
          {rawEvents.length > 0 ? 'EPISODE RAWAT AKTIF' : 'STANDBY'}
        </span>
      </div>

      {/* Vertical Timeline */}
      {rawEvents.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[28px]">history_edu</span>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Perjalanan Pasien</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            Jejak peristiwa klinis (admisi, triase, CPPT, order penunjang, tindakan bedah) akan tercatat otomatis saat alur pelayanan aktif.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {rawEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              {/* Timeline Bullet */}
              <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] ${
                evt.status === 'COMPLETED'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-blue-600 text-white animate-pulse'
              }`}>
                <span className="material-symbols-outlined text-[12px]">{evt.icon || 'analytics'}</span>
              </div>

              {/* Event Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{evt.title}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {evt.details || evt.payload?.notes || JSON.stringify(evt.payload || '')}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
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
