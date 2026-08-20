/**
 * NurseFlow Enterprise HIS 2026 — MET Escalation Modal
 * Instant Medical Emergency Team (MET) Paging & SBAR Transfer Protocol
 */

import React, { useState } from 'react';

export default function MetEscalationModal({
  isOpen = false,
  cluster = null,
  patient = {},
  onConfirmEscalate = () => {},
  onClose = () => {}
}) {
  const [escalateRole, setEscalateRole] = useState('MET_ICU_TEAM');
  const [notes, setNotes] = useState('');

  if (!isOpen || !cluster) return null;

  const handleEscalate = () => {
    onConfirmEscalate({
      escalateRole,
      notes: notes || 'Panggilan Darurat Tim MET diaktifkan dari Ward Central Board.',
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="met-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-red-600">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 id="met-modal-title" className="text-base font-bold text-red-600 flex items-center gap-2">
            🚨 AKTIVASI PANGGILAN TIM MEDIS DARURAT (MET)
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded bg-red-50 dark:bg-red-950/40 p-3 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
            <p className="font-bold">Pasien: {patient.name} ({cluster.wardOrBedLocation})</p>
            <p className="mt-1">Krisis: {cluster.clusterTitle}</p>
            <p className="mt-0.5 font-semibold">Tindakan: {cluster.headlineAction}</p>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Tim Tujuan Panggilan Cito:
            </label>
            <select
              value={escalateRole}
              onChange={(e) => setEscalateRole(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="MET_ICU_TEAM">Tim Medical Emergency Team (MET / ICU)</option>
              <option value="CODE_BLUE_RESUSCITATION">Tim Code Blue Resusitasi Jantung-Paru</option>
              <option value="SURGICAL_AIRWAY_TEAM">Tim Bedah & Anestesi Jalan Napas</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Catatan Situasi Tambahan (Opsional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan info tambahan (misal: posisi infus, riwayat alergi)..."
              rows={2}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-slate-200 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              className="rounded bg-red-700 hover:bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-md animate-pulse"
            >
              🚨 Panggil Cito Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
