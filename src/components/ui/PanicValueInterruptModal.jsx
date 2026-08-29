import React, { useState } from 'react';
import { AlertTriangle, CheckCheck, PhoneCall, ShieldAlert, X } from 'lucide-react';

/**
 * NurseFlow Enterprise HIS 2026 — JCI IPSG 2 / Critical Lab Value Interruption Barrier
 * 
 * Mandates:
 * - Interrupts DPJP / Clinician screen immediately when Panic Value is broadcasted for active patient
 * - Requires mandatory TBAK (Tulis, Baca, Konfirmasi) Read-Back acknowledgment
 * - Records reporting lab analyst and acknowledging doctor
 */
export default function PanicValueInterruptModal({
  isOpen,
  panicData,
  onAcknowledge,
  onDismiss,
  currentDoctorName = 'dr. Budi Santoso, Sp.PD (DPJP)'
}) {
  const [readBackConfirmed, setReadBackConfirmed] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !panicData) return null;

  const handleAcknowledge = (e) => {
    e.preventDefault();
    if (!readBackConfirmed) {
      setErrorMsg('Anda wajib mengonfirmasi telah membaca dan memahami nilai kritis ini (TBAK Read-Back).');
      return;
    }

    setIsSubmitting(true);
    try {
      onAcknowledge({
        panicAlertId: panicData.id || `PANIC-${Date.now()}`,
        patientId: panicData.patientId,
        testName: panicData.testName || 'Hasil Kritis',
        criticalValue: panicData.criticalValue || panicData.value,
        acknowledgedBy: currentDoctorName,
        acknowledgedAt: new Date().toISOString(),
        readBackText: `TBAK Confirmed: ${panicData.testName || 'Kritis'} = ${panicData.criticalValue || panicData.value} oleh ${currentDoctorName}`,
        clinicianNotes: clinicianNotes.trim()
      });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan konfirmasi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Alert */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/30 animate-bounce">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-400">🚨 INTERUPSI NILAI KRITIS LABORATORIUM (PANIC VALUE)</h2>
              <p className="text-xs text-slate-400">Protokol Keselamatan Pasien JCI IPSG 2 (TBAK Read-Back Mandatory)</p>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleAcknowledge} className="p-6 space-y-5">
          {/* Critical Value Metric Box */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Parameter Pemeriksaan:</span>
              <p className="text-base font-bold text-slate-100">{panicData.testName || 'Kalium Darah (Serum K+)'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pasien: <span className="text-slate-200 font-semibold">{panicData.patientName || 'Pasien Aktif'}</span> (MRN: {panicData.patientMrn || '-'})</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-rose-400 font-bold uppercase">Nilai Kritis:</span>
              <p className="text-2xl font-black text-rose-400 font-mono animate-pulse">{panicData.criticalValue || panicData.value || '7.2 mEq/L'}</p>
              <span className="text-[11px] text-slate-400">Batas Normal: {panicData.normalRange || '3.5 - 5.0 mEq/L'}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-amber-400" /> Analis Pelapor:</span>
              <span className="text-slate-200 font-medium">{panicData.reportedBy || 'Analis Laboratorium Sentral'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Waktu Hasil Kritis Terbit:</span>
              <span className="text-amber-300 font-mono">{panicData.timestamp || new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Instruksi / Tindakan Cito Dokter (Opsional)
            </label>
            <input
              type="text"
              value={clinicianNotes}
              onChange={(e) => setClinicianNotes(e.target.value)}
              placeholder="Contoh: Stop infus KCl, berikan Ca Glukonas 10% 1 amp IV..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* TBAK Read-Back Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-amber-950/20 rounded-xl border border-amber-800/40 cursor-pointer hover:bg-amber-950/30 transition-colors">
            <input
              type="checkbox"
              checked={readBackConfirmed}
              onChange={(e) => setReadBackConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-200">
              <strong>Konfirmasi TBAK (Tulis, Baca, Konfirmasi):</strong> Saya ({currentDoctorName}) telah menerima, membaca ulang, dan mengonfirmasi hasil nilai kritis ini untuk penanganan cito pasien.
            </span>
          </label>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-900 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Action */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || !readBackConfirmed}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Menyimpan Konfirmasi TBAK...' : 'Konfirmasi Penerimaan Nilai Kritis (TBAK)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
