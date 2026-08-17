import React, { useState } from 'react';
import { forensicAuditEcosystemService } from '../../../../../server/services/forensicAuditEcosystem.service.js';
import toast from 'react-hot-toast';

export default function BreakTheGlassMonitorStudio() {
  const [events, setEvents] = useState(forensicAuditEcosystemService.getBreakTheGlassEvents());

  const handleApproveAccess = (id) => {
    const item = events.find(e => e.id === id);
    if (item) {
      item.security_review_status = 'APPROVED_BY_COMMITTEE';
      setEvents([...events]);
      toast.success('Akses Break-the-Glass telah ditinjau dan disetujui oleh Komite Medis.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner & Information */}
      <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-xs flex items-start gap-4">
        <div className="p-3 bg-rose-600 text-white rounded-xl shrink-0">
          <span className="material-symbols-outlined text-2xl">emergency</span>
        </div>
        <div>
          <h3 className="text-sm font-black text-rose-900 dark:text-rose-100">
            JCI Emergency Break-the-Glass Governance Monitor
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
            Pusat pengawasan akses rekam medis darurat tanpa penugasan klinis langsung. Standar JCI & Permenkes No. 24/2022 mewajibkan setiap pembukaan data darurat menyertakan justifikasi klinis yang dapat diverifikasi oleh Komite Etik & Medis.
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{event.id}</span>
                  <span className="text-[10px] text-slate-400 ml-2">
                    {new Date(event.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                event.security_review_status === 'APPROVED_BY_COMMITTEE'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {event.security_review_status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Nakes Pemohon Akses</span>
                <p className="font-bold text-slate-900 dark:text-white">{event.performed_by}</p>
                <p className="text-[11px] text-slate-500">{event.user_role}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pasien Sasaran</span>
                <p className="font-bold text-slate-900 dark:text-white">{event.patient_name}</p>
                <p className="font-mono text-[11px] text-slate-500">MRN: {event.patient_mrn}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Departemen & IP Terminal</span>
                <p className="font-bold text-slate-900 dark:text-white">{event.department}</p>
                <p className="font-mono text-[11px] text-slate-500">{event.ip_address}</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs">
              <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1">Justifikasi Klinis Darurat:</span>
              <p className="text-slate-700 dark:text-slate-300 italic">"{event.reason}"</p>
            </div>

            {event.security_review_status === 'PENDING_REVIEW' && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleApproveAccess(event.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Verifikasi & Setujui Audit Komite Medis
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
