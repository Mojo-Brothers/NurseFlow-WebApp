import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, X } from 'lucide-react';

/**
 * NurseFlow Enterprise HIS 2026 — JCI MMU 4 / Patient Safety Modal
 * In-Situ CDSS Allergy Hard-Stop Override Dialog
 * 
 * Mandates:
 * - Displays detected lethal/severe allergy conflict
 * - Requires explicit clinical justification (minimum 5 characters)
 * - Captures DPJP electronic authorization
 * - Emits onConfirmOverride({ overrideReason, dpjpName }) or onCancel()
 */
export default function AllergyOverrideModal({
  isOpen,
  allergyError,
  patientName = 'Pasien',
  prescribedItemName = 'Obat Terjadwal',
  onConfirmOverride,
  onCancel,
  dpjpName = 'dr. Budi Santoso, Sp.PD (DPJP)'
}) {
  const [overrideReason, setOverrideReason] = useState('');
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!acknowledgedRisk) {
      setErrorMsg('Anda wajib mencentang persetujuan pemahaman risiko klinis.');
      return;
    }
    if (!overrideReason || overrideReason.trim().length < 5) {
      setErrorMsg('Alasan justifikasi klinis override wajib diisi minimal 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirmOverride({
        overrideReason: overrideReason.trim(),
        dpjpName,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengeksekusi override.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Barrier */}
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/30 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-400">HARD-STOP CDSS: KONTRAINDIKASI ALERGI BERAT</h2>
              <p className="text-xs text-slate-400">Pencegahan Insiden Keselamatan Pasien (JCI IPSG 3 & MMU 4)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-slate-200 font-semibold">
                  Pasien <span className="text-rose-300 font-bold">{patientName}</span> memiliki riwayat alergi terdokumentasi terhadap substansi obat ini.
                </p>
                <p className="text-xs text-rose-300/90 mt-1 font-mono">
                  {allergyError?.message || `Obat yang diresepkan (${prescribedItemName}) berkonflik dengan daftar alergi aktif pasien.`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Justifikasi Klinis DPJP (Wajib Minimal 5 Karakter) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: Manfaat terapi melebihi risiko; premedikasi antihistamin dan kortikosteroid telah diberikan..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Otorisasi Klinisi (DPJP):</span>
            <span className="text-emerald-400 font-medium font-mono">{dpjpName}</span>
          </div>

          <label className="flex items-start gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 cursor-pointer hover:bg-slate-950/60 transition-colors">
            <input
              type="checkbox"
              checked={acknowledgedRisk}
              onChange={(e) => setAcknowledgedRisk(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs text-slate-300">
              Saya memahami risiko reaksi alergi berat/anafilaksis dan menyatakan bahwa keputusan peresepan ini diambil atas pertimbangan darurat medis yang dapat dipertanggungjawabkan (Audit-Logged).
            </span>
          </label>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-900 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Batalkan Peresepan (Aman)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !acknowledgedRisk || overrideReason.trim().length < 5}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Memproses Override...' : 'Otorisasi Override Alergi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
