import React, { useState } from 'react';
import { criticalCareService } from '../../../../server/services/criticalCare.service.js';
import toast from 'react-hot-toast';

export default function IcuAcuityWorkspacePage() {
  const [assessments, setAssessments] = useState(() => Array.from(criticalCareService.assessments.values()));
  const [activeTab, setActiveTab] = useState('SOFA'); // 'SOFA' | 'NEWS2' | 'FLUID_BALANCE' | 'HISTORY'

  // SOFA Form State
  const [pao2Fio2, setPao2Fio2] = useState(350);
  const [platelets, setPlatelets] = useState(180000);
  const [bilirubin, setBilirubin] = useState(1.0);
  const [mapVal, setMapVal] = useState(75);
  const [onVasopressors, setOnVasopressors] = useState(false);
  const [gcs, setGcs] = useState(15);
  const [creatinine, setCreatinine] = useState(0.9);

  // NEWS2 Form State
  const [rr, setRr] = useState(16);
  const [spo2, setSpo2] = useState(98);
  const [onO2, setOnO2] = useState(false);
  const [sbp, setSbp] = useState(120);
  const [hr, setHr] = useState(72);
  const [cns, setCns] = useState('ALERT');
  const [temp, setTemp] = useState(36.8);

  const handleCalculateSofa = (e) => {
    e.preventDefault();
    try {
      const rawInputs = {
        pao2Fio2Ratio: parseFloat(pao2Fio2),
        platelets: parseFloat(platelets),
        bilirubin: parseFloat(bilirubin),
        meanArterialPressure: parseFloat(mapVal),
        onVasopressors,
        gcs: parseInt(gcs),
        creatinine: parseFloat(creatinine)
      };

      const record = criticalCareService.recordIcuAcuityAssessment({
        patientId: 'PAT-ICU-01',
        episodeId: 'EP-ICU-001',
        encounterId: 'ENC-ICU-001',
        scoringSystem: 'SOFA',
        algorithmVersion: 'v1.0',
        rawScoringInputs: rawInputs,
        assessedById: 'DOC-INTENSIVIST-01',
        assessedByName: 'dr. Sp.An-KIC David'
      });

      setAssessments(Array.from(criticalCareService.assessments.values()));

      if (record.escalationTriggered) {
        toast.error(`⚠️ SOFA SCORE: ${record.calculatedScore} — ${record.riskStratification}. Konsultasi Intensivis segera!`, { duration: 5000 });
      } else {
        toast.success(`SOFA Score: ${record.calculatedScore} (${record.riskStratification}) berhasil disimpan!`);
      }
    } catch (err) {
      toast.error(`Kalkulasi gagal: ${err.message}`);
    }
  };

  const handleCalculateNews2 = (e) => {
    e.preventDefault();
    try {
      const rawInputs = {
        respirationRate: parseInt(rr),
        spo2: parseInt(spo2),
        onSupplementalOxygen: onO2,
        systolicBp: parseInt(sbp),
        heartRate: parseInt(hr),
        consciousness: cns,
        temperature: parseFloat(temp)
      };

      const record = criticalCareService.recordIcuAcuityAssessment({
        patientId: 'PAT-ICU-01',
        episodeId: 'EP-ICU-001',
        encounterId: 'ENC-ICU-001',
        scoringSystem: 'NEWS2',
        algorithmVersion: 'v1.0',
        rawScoringInputs: rawInputs,
        assessedById: 'NURSE-ICU-01',
        assessedByName: 'Ns. Maya, S.Kep'
      });

      setAssessments(Array.from(criticalCareService.assessments.values()));

      if (record.escalationTriggered) {
        toast.error(`🚨 NEWS2 SCORE: ${record.calculatedScore} — ${record.riskStratification}!`, { duration: 5000 });
      } else {
        toast.success(`NEWS2 Score: ${record.calculatedScore} (${record.riskStratification}) berhasil disimpan!`);
      }
    } catch (err) {
      toast.error(`Kalkulasi gagal: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
              <span className="material-symbols-outlined text-[24px]">monitor_heart</span>
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ICU & Critical Care Clinical Acuity Engine
              </h1>
              <p className="text-xs text-slate-500">
                Sepsis-3 (SOFA), National Early Warning Score 2 (NEWS2) & Fluid Balance
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'SOFA', label: 'SOFA Score (Sepsis)', icon: 'vital_signs' },
            { id: 'NEWS2', label: 'NEWS2 Warning', icon: 'warning' },
            { id: 'HISTORY', label: 'Riwayat Serial Audit', icon: 'history' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: SOFA Form */}
      {activeTab === 'SOFA' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">calculate</span>
              Kalkulator SOFA (Sequential Organ Failure Assessment)
            </h2>

            <form onSubmit={handleCalculateSofa} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Respirasi: PaO2/FiO2 (mmHg)</label>
                  <input
                    type="number"
                    value={pao2Fio2}
                    onChange={e => setPao2Fio2(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Koagulasi: Trombosit (/uL)</label>
                  <input
                    type="number"
                    value={platelets}
                    onChange={e => setPlatelets(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Hepar: Bilirubin Total (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bilirubin}
                    onChange={e => setBilirubin(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Kardiovaskular: MAP (mmHg)</label>
                  <input
                    type="number"
                    value={mapVal}
                    onChange={e => setMapVal(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="vaso"
                  checked={onVasopressors}
                  onChange={e => setOnVasopressors(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="vaso" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Pasien dalam Terapi Vasopresor (Norepinefrin / Epinefrin / Dopamin)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Neurologi: Glasgow Coma Scale (GCS)</label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={gcs}
                    onChange={e => setGcs(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Renal: Serum Kreatinin (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={creatinine}
                    onChange={e => setCreatinine(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                📊 Hitung & Simpan Snapshot SOFA
              </button>
            </form>
          </div>

          {/* Guidelines info */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">menu_book</span>
              Pedoman Klinis Sepsis-3 & Interpretasi SOFA
            </h2>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="font-black text-purple-700 dark:text-purple-300 block mb-1">Definisi Sepsis-3 (JAMA 2016):</span>
                Peningkatan skor SOFA ≥ 2 poin dari baseline mengindikasikan disfungsi organ yang mengancam jiwa akibat disregulasi respon tubuh terhadap infeksi.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-black text-slate-900 dark:text-white block mb-1">Stratifikasi Risiko Mortalitas:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>SOFA 0 - 6: Mortalitas Rendah (&lt;10%)</li>
                  <li>SOFA 7 - 11: Disfungsi Organ Sedang-Berat (Mortalitas 15-40%)</li>
                  <li>SOFA ≥ 12: Sindrom Disfungsi Multi-Organ / MODS Kritis (Mortalitas &gt;80%)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: NEWS2 Form */}
      {activeTab === 'NEWS2' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 max-w-2xl">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">warning</span>
            National Early Warning Score 2 (NEWS2)
          </h2>

          <form onSubmit={handleCalculateNews2} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Frekuensi Napas (/menit)</label>
                <input
                  type="number"
                  value={rr}
                  onChange={e => setRr(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Saturasi O2 SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="o2"
                checked={onO2}
                onChange={e => setOnO2(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="o2" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Pasien Memerlukan Oksigen Tambahan (Nasal Cannula / Mask)
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tekanan Darah Sistolik</label>
                <input
                  type="number"
                  value={sbp}
                  onChange={e => setSbp(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Denyut Jantung (bpm)</label>
                <input
                  type="number"
                  value={hr}
                  onChange={e => setHr(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Suhu Tubuh (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={e => setTemp(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              ⚠️ Hitung & Simpan NEWS2 Score
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: History & Audit Snapshots */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">history</span>
            Riwayat Serial Asesmen Kritis Terfinalisasi ({assessments.length})
          </h2>

          <div className="space-y-3">
            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada asesmen kritis tersimpan.</p>
            ) : (
              assessments.map(a => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-black text-xs">
                        {a.scoringSystem} {a.algorithmVersion}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">Skor: {a.calculatedScore}</span>
                      <span className="text-xs font-bold text-slate-500">({a.riskStratification})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dinilai oleh: <span className="font-bold text-slate-700 dark:text-slate-300">{a.assessedByName}</span> • Waktu: {new Date(a.assessedAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      🔒 100% REPRODUCIBLE SNAPSHOT
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
