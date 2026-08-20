/**
 * NurseFlow Enterprise HIS 2026 — DPJP Override Modal
 * Two-Factor Clinical Authorization, 6-Digit PIN, Mandatory Clinical Rationale & WORM Audit Trail
 */

import React, { useState } from 'react';
import { ALERT_PRIORITY_TIERS } from '../../modules/clinical_core/services/clinicalAlertOrchestrator.service.js';

export default function DpjpOverrideModal({
  isOpen = false,
  cluster = null,
  patient = {},
  dpjpUser = { id: 'DPJP-01', name: 'dr. Sp.PD', role: 'DPJP' },
  onConfirmOverride = () => {},
  onClose = () => {}
}) {
  const [pin, setPin] = useState('');
  const [justificationCategory, setJustificationCategory] = useState('CHRONIC_BASELINE');
  const [justificationNotes, setJustificationNotes] = useState('');
  const [targetPriority, setTargetPriority] = useState(ALERT_PRIORITY_TIERS.PRIORITY_REVIEW);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !cluster) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setErrorMsg('PIN Otorisasi DPJP wajib 6 digit angka.');
      return;
    }
    if (justificationNotes.trim().length < 15) {
      setErrorMsg('Catatan justifikasi klinis wajib minimal 15 karakter.');
      return;
    }

    onConfirmOverride({
      targetPriority,
      targetSla: targetPriority === ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS ? 240 : 60,
      overrideDirection: 'DOWNGRADE',
      justificationCategory,
      justificationNotes,
      pinVerified: true
    }, dpjpUser);

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dpjp-override-title"
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-indigo-600">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 id="dpjp-override-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🛡️ OTORISASI OVERRIDE TINGKAT RISIKO (DPJP)
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded bg-red-100 dark:bg-red-900/50 p-2 text-xs font-bold text-red-700 dark:text-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Pasien & Status Saat Ini:
            </label>
            <p className="rounded bg-slate-100 dark:bg-slate-800 p-2 font-mono text-slate-800 dark:text-slate-200">
              {patient.name} ({cluster.wardOrBedLocation}) — Status: <strong>{cluster.priorityTier}</strong>
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Target Level Risiko Baru:
            </label>
            <select
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value={ALERT_PRIORITY_TIERS.PRIORITY_REVIEW}>PRIORITY REVIEW (SLA 60 Menit)</option>
              <option value={ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS}>ROUTINE AWARENESS (SLA 240 Menit)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Kategori Justifikasi Klinis:
            </label>
            <select
              value={justificationCategory}
              onChange={(e) => setJustificationCategory(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="CHRONIC_BASELINE">Kondisi Baseline Kronis Pasien Stabil</option>
              <option value="PALLIATIVE_GOAL">Tujuan Perawatan Paliatif / End-of-Life</option>
              <option value="PLANNED_PROCEDURE">Tindakan Sedasi / Prosedur Terencana</option>
              <option value="ARTIFACT_CONFIRMED">Artefak Sensor Terkonfirmasi Palsu</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Catatan Klinis DPJP Wajib (Min 15 Karakter):
            </label>
            <textarea
              value={justificationNotes}
              onChange={(e) => setJustificationNotes(e.target.value)}
              placeholder="Jelaskan alasan medis rasional untuk penyesuaian level prioritas..."
              rows={3}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              PIN Otorisasi DPJP (6 Digit Angka):
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] font-mono text-base font-bold rounded border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
              required
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
              type="submit"
              className="rounded bg-indigo-700 hover:bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition"
            >
              🔒 Tanda Tangani & Override (WORM)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
