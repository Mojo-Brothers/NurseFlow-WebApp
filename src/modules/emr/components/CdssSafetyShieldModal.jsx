import React, { useState } from 'react';

export default function CdssSafetyShieldModal({
  evaluationResult,
  onProceedWithOverride,
  onCancel,
  onSelectAlternative
}) {
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!evaluationResult || evaluationResult.isSafeToExecute && evaluationResult.alerts?.length === 0) {
    return null;
  }

  const { alerts, isSafeToExecute, proposedDrug } = evaluationResult;
  const fatalAlerts = alerts.filter(a => a.isHardStop);
  const warningAlerts = alerts.filter(a => !a.isHardStop);

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) {
      alert('Alasan justifikasi klinis DPJP wajib diisi untuk mengabaikan peringatan keselamatan JCI.');
      return;
    }
    setIsSubmitting(true);
    onProceedWithOverride(overrideReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-md ${
            !isSafeToExecute
              ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
              : 'bg-amber-500 text-white shadow-amber-500/30'
          }`}>
            <span className="material-symbols-outlined text-[28px]">
              {!isSafeToExecute ? 'gpp_bad' : 'warning'}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {!isSafeToExecute ? '🛑 PERESEPAN DITOLAK (HARD STOP)' : '⚠️ PERINGATAN KESELAMATAN KLINIS (CDSS)'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                !isSafeToExecute ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                JCI IPSG 3 BARRIER
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Obat Target: <span className="font-bold text-slate-900 dark:text-white">{proposedDrug?.genericName}</span> ({proposedDrug?.brandName})
            </p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex flex-col gap-3">
          {alerts.map((a, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                a.isHardStop
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  {a.isHardStop ? 'cancel' : 'priority_high'}
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider">{a.title}</h4>
              </div>
              <p className="text-xs font-medium pl-7">{a.message}</p>
              {a.clinicalRecommendation && (
                <div className="mt-1 pl-7 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50 p-2.5 rounded-xl">
                  💡 Rekomendasi: {a.clinicalRecommendation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        {!isSafeToExecute ? (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batalkan Peresepan Ini
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Justifikasi Klinis DPJP (Wajib untuk Override):
              </label>
              <textarea
                rows={2}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Contoh: Indikasi STEMI akut dengan pemantauan ketat INR & proteksi lambung PPI..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batalkan
              </button>
              <button
                disabled={isSubmitting || !overrideReason.trim()}
                onClick={handleConfirmOverride}
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                Konfirmasi Override & Lanjutkan Resep
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
