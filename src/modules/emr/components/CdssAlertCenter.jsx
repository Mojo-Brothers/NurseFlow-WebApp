import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';

export default function CdssAlertCenter() {
  const { cdssAlerts, evaluatePrescriptionSafeguards, selectedPatientId } = useEmrStore();

  const [testDrug, setTestDrug] = useState('Cefadroxil 500mg');
  const [testEgfr, setTestEgfr] = useState(25);

  const handleTestScreening = async () => {
    const res = await evaluatePrescriptionSafeguards({
      encounterId: 'ENC-2026-001',
      patientId: selectedPatientId,
      prescribedDrugName: testDrug,
      prescribedDrugCode: 'MED-TEST',
      patientEgfr: Number(testEgfr),
      activeMedications: ['Amlodipine 10mg', 'Paracetamol 500mg']
    });

    if (res.hasAlerts) {
      alert(`⚠️ CDSS MENDETEKSI ${res.alerts.length} POTENSI RISIKO KLINIS!\nPeriksa panel CDSS untuk rincian rekomendasi keselamatan pasien.`);
    } else {
      alert('✓ Skrining CDSS Aman: Tidak ditemukan kontraindikasi alergi, ginjal, atau interaksi obat mayor.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── CDSS Interactive Simulator Bar ─── */}
      <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div>
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">
              Uji Skrining Resep Klinis (Live CDSS Prescribing Guard)
            </h4>
            <p className="text-xs text-on-surface-variant">Uji coba simulasi pencegahan kesalahan peresepan obat berbasis alergi & fungsi organ.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Simulasi Obat yang Diresepkan</label>
            <input
              type="text"
              value={testDrug}
              onChange={(e) => setTestDrug(e.target.value)}
              placeholder="Contoh: Cefadroxil / Metformin / Simvastatin"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">eGFR Pasien (mL/min/1.73m2)</label>
            <input
              type="number"
              value={testEgfr}
              onChange={(e) => setTestEgfr(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestScreening}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Jalankan Skrining CDSS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Alerts Stream ─── */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Log Peringatan Keselamatan Klinis CDSS ({cdssAlerts.length})
        </h4>

        {cdssAlerts.length > 0 ? (
          <div className="space-y-3">
            {cdssAlerts.map(alt => {
              const isBlock = alt.severity === 'CRITICAL_BLOCK';

              return (
                <div
                  key={alt.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isBlock
                      ? 'bg-rose-500/15 border-rose-600 shadow-xl ring-2 ring-rose-500/30'
                      : 'bg-amber-500/15 border-amber-600 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-600 text-[24px]">crisis_alert</span>
                      <h4 className="text-sm font-headline font-black text-on-surface">{alt.title}</h4>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${isBlock ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>
                      {alt.severity}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface my-2 font-medium">{alt.message}</p>

                  <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 text-xs">
                    <span className="text-[10px] font-bold text-primary block uppercase">Rekomendasi Klinis Sistem:</span>
                    <strong className="text-teal-600 dark:text-teal-400">{alt.recommendation}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-surface-container-high border border-outline-variant/30 text-center space-y-2">
            <span className="material-symbols-outlined text-teal-600 text-[36px]">check_circle</span>
            <h4 className="text-sm font-black text-on-surface">Tidak Ada Peringatan CDSS Aktif</h4>
            <p className="text-xs text-on-surface-variant">Seluruh riwayat alergi dan kondisi organ pasien aman untuk peresepan saat ini.</p>
          </div>
        )}
      </div>

    </div>
  );
}
