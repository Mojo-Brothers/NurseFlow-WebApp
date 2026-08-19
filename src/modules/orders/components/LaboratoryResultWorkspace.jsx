import React from 'react';
import toast from 'react-hot-toast';
import { useOrdersStore } from '../store/orders.store.js';

export default function LaboratoryResultWorkspace() {
  const { labOrders, releaseLabResult } = useOrdersStore();

  const handleRelease = async (labId) => {
    try {
      const res = await releaseLabResult({
        labOrderId: labId,
        validatorName: 'dr. Sp.PK (Dokter Patologi Klinik)'
      });
      toast.success(`🧪 Hasil Laboratorium Berhasil Divalidasi & Dirilis!\nInstrumen: ${res.analyzer_instrument}\nTagihan otomatis masuk ke Billing Ledger.`, { duration: 4000 });
    } catch (err) {
      toast.error(`Gagal Merilis Hasil: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Validasi & Pelaporan Hasil Laboratorium (LIS Results Release)
          </h4>
          <p className="text-[11px] text-on-surface-variant">Deteksi otomatis Nilai Kritis (Panic Value) dan penerbitan SERVICE_CHARGED ke Billing.</p>
        </div>
      </div>

      <div className="space-y-4">
        {labOrders.map(lab => {
          const isReleased = lab.result_status === 'RELEASED';

          return (
            <div
              key={lab.id}
              className={`p-6 rounded-3xl border transition-all ${
                lab.is_critical_panic
                  ? 'bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-surface-container-high border-outline-variant/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                      LOINC: {lab.loinc_code}
                    </span>
                    {lab.is_critical_panic && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                        🚨 NILAI KRITIS / PANIC VALUE
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-on-surface mt-1.5">{lab.test_name}</h4>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Rujukan: {lab.reference_range} &bull; Spesimen: {lab.specimen_type}
                  </p>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${isReleased ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                  {lab.result_status}
                </span>
              </div>

              {isReleased ? (
                <div className="my-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1.5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Hasil Pemeriksaan Auto-Analyzer:</span>
                  <div className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">
                    {lab.result_value}
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    Instrumen: {lab.analyzer_instrument} &bull; Divalidasi: {lab.validated_at}
                  </p>
                </div>
              ) : (
                <div className="my-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-center text-xs text-on-surface-variant">
                  Spesimen siap dijalankan pada instrumen hematologi / kimia klinik.
                </div>
              )}

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-on-surface-variant">
                  Tarif: Rp {lab.unit_price.toLocaleString('id-ID')}
                </span>

                {!isReleased && (
                  <button
                    onClick={() => handleRelease(lab.id)}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">science</span>
                    <span>Jalankan Analyzer & Rilis Hasil (Emit SERVICE_CHARGED)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
