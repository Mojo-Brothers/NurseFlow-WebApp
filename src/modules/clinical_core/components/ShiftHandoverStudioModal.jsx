/**
 * NurseFlow Enterprise HIS 2026 — Shift Handover Studio Modal
 * Structured Clinical Handover (SBAR with Live Trajectory Vectors & Dual Digital Sign-off)
 */

import React, { useState } from 'react';
import { HANDOVER_SIGN_STATUS } from '../services/clinicalCommandOperations.service.js';

export default function ShiftHandoverStudioModal({
  isOpen = false,
  handoverRecord = null,
  currentUser = { id: 'NURSE-01', name: 'Sr. Siti Nurhaliza', role: 'WARD_NURSE' },
  onSignOutbound = () => {},
  onSignInbound = () => {},
  onClose = () => {}
}) {
  const [inboundPin, setInboundPin] = useState('');
  const [outboundPin, setOutboundPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !handoverRecord) return null;

  const isOutboundSigned = Boolean(handoverRecord.outboundSign);
  const isCompletedLocked = handoverRecord.status === HANDOVER_SIGN_STATUS.COMPLETED_LOCKED;

  const handleOutboundSubmit = (e) => {
    e.preventDefault();
    if (outboundPin.length < 4) {
      setErrorMsg('PIN perawat pengirim wajib minimal 4 digit.');
      return;
    }
    onSignOutbound(handoverRecord.handoverId, currentUser);
    setOutboundPin('');
    setErrorMsg('');
  };

  const handleInboundSubmit = (e) => {
    e.preventDefault();
    if (inboundPin.length < 4) {
      setErrorMsg('PIN perawat penerima wajib minimal 4 digit.');
      return;
    }
    onSignInbound(handoverRecord.handoverId, currentUser);
    setInboundPin('');
    setErrorMsg('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 id="handover-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              📋 SHIFT HANDOVER STUDIO — {handoverRecord.ward}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shift: {handoverRecord.shiftName} | Status: <strong className="text-teal-600">{handoverRecord.status}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded bg-red-100 dark:bg-red-900/50 p-2 text-xs font-bold text-red-700 dark:text-red-200">
            {errorMsg}
          </div>
        )}

        {/* ─── Daftar Pasien & Rangkuman SBAR Otomatis ─── */}
        <div className="my-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Ringkasan Pasien Serah Terima ({handoverRecord.patients?.length || 0} Pasien)
          </h4>

          {handoverRecord.patients?.map((p, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-2">
                <span>{p.bed} — {p.patientName} ({p.mrn})</span>
                <span className="rounded bg-teal-600 text-white px-2 py-0.5 text-[10px] uppercase">
                  {p.priorityTier}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div>
                  <p><strong>S (Situation):</strong> {p.sbar?.situation}</p>
                  <p className="mt-1"><strong>B (Background):</strong> {p.sbar?.background}</p>
                </div>
                <div>
                  <p><strong>A (Assessment):</strong> {p.sbar?.assessment}</p>
                  <p className="mt-1"><strong>R (Recommendation):</strong> {p.sbar?.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Tanda Tangan Elektronik Ganda (Dual Sign-off) ─── */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Outbound Nurse Sign */}
          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              1. Tanda Tangan Perawat Jaga Lama (Outbound)
            </h5>
            {isOutboundSigned ? (
              <div className="rounded bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-800 dark:text-emerald-200 text-xs">
                ✓ Ditandatangani: <strong>{handoverRecord.outboundSign.signedBy}</strong> ({handoverRecord.outboundSign.timestamp})
              </div>
            ) : (
              <form onSubmit={handleOutboundSubmit} className="space-y-2">
                <input
                  type="password"
                  placeholder="PIN Perawat Lama..."
                  value={outboundPin}
                  onChange={(e) => setOutboundPin(e.target.value)}
                  className="w-full rounded border border-slate-300 dark:border-slate-600 p-1.5 text-xs text-slate-900 dark:text-white"
                />
                <button type="submit" className="w-full rounded bg-teal-700 hover:bg-teal-600 text-white font-bold p-1.5 text-xs shadow">
                  Tanda Tangani Penyerahan
                </button>
              </form>
            )}
          </div>

          {/* Inbound Nurse Sign */}
          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              2. Tanda Tangan Perawat Jaga Baru (Inbound)
            </h5>
            {isCompletedLocked ? (
              <div className="rounded bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-800 dark:text-emerald-200 text-xs">
                ✓ Diterima & Terkunci: <strong>{handoverRecord.inboundSign.signedBy}</strong> ({handoverRecord.inboundSign.timestamp})
              </div>
            ) : (
              <form onSubmit={handleInboundSubmit} className="space-y-2">
                <input
                  type="password"
                  disabled={!isOutboundSigned}
                  placeholder={isOutboundSigned ? "PIN Perawat Baru..." : "Menunggu Tanda Tangan Penyerah"}
                  value={inboundPin}
                  onChange={(e) => setInboundPin(e.target.value)}
                  className="w-full rounded border border-slate-300 dark:border-slate-600 p-1.5 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={!isOutboundSigned}
                  className="w-full rounded bg-indigo-700 hover:bg-indigo-600 text-white font-bold p-1.5 text-xs shadow disabled:opacity-50"
                >
                  🔒 Terima & Kunci Handover (Immutable)
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500">
          <span className="font-mono truncate max-w-md">SHA-256: {handoverRecord.tamperProofHash}</span>
          <button onClick={onClose} className="rounded bg-slate-800 text-white px-3 py-1 text-xs">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
