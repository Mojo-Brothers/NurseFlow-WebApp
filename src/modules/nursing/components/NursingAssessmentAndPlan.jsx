import React, { useState } from 'react';
import { nursingCareEngineService } from '../services/nursingCareEngine.service.js';
import toast from 'react-hot-toast';

export default function NursingAssessmentAndPlan({ activePatient }) {
  if (!activePatient) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        Pilih pasien rawat inap terlebih dahulu untuk membuka lembar pengkajian keperawatan & SDKI/SIKI.
      </div>
    );
  }

  const patient = activePatient;

  // Morse Fall Scale State
  const [historyOfFalling, setHistoryOfFalling] = useState(false);
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState(true);
  const [ambulatoryAid, setAmbulatoryAid] = useState('CRUTCHES_CANE'); // 'NONE' | 'CRUTCHES_CANE' | 'FURNITURE'
  const [ivTherapyOrHeparin, setIvTherapyOrHeparin] = useState(true);
  const [gaitStatus, setGaitStatus] = useState('WEAK'); // 'NORMAL' | 'WEAK' | 'IMPAIRED'
  const [mentalStatus, setMentalStatus] = useState('ORIENTED'); // 'ORIENTED' | 'OVERESTIMATES'

  // SDKI / SIKI / SLKI State
  const [selectedSdki, setSelectedSdki] = useState('D.0001');
  const [slkiGoal, setSlkiGoal] = useState('Bersihan jalan napas meningkat, sputum berkurang dalam 3x24 jam');
  const [sikiList, setSikiList] = useState([
    'I.01011 Manajemen Jalan Napas (Fisioterapi dada, Batuk efektif)',
    'I.01014 Pemantauan Respirasi (Frekuensi, kedalaman, saturasi SpO2)'
  ]);

  // Evaluate Morse Fall Scale in real-time
  const morseResult = nursingCareEngineService.calculateMorseFallScale({
    historyOfFalling,
    secondaryDiagnosis,
    ambulatoryAid,
    ivTherapyOrHeparin,
    gaitStatus,
    mentalStatus
  });

  const handleSaveCarePlan = (e) => {
    e.preventDefault();
    toast.success('Rencana Asuhan Keperawatan (SDKI / SIKI) Berhasil Disimpan!');
  };

  return (
    <div className="p-4 space-y-6">
      {/* SECTION 1: MORSE FALL SCALE & JCI IPSG 6 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[24px]">assist_walker</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Skrining Risiko Jatuh Dewasa (Morse Fall Scale - JCI IPSG 6)
              </h3>
              <p className="text-xs text-slate-400">Pengkajian berkala per shift atau saat terjadi perubahan kondisi klinis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400">Skor Morse</div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">{morseResult.totalScore} Poin</div>
            </div>
            {morseResult.requiresYellowWristband ? (
              <span className="px-3 py-1.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                GELANG KUNING (Risiko Tinggi)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold text-xs">
                {morseResult.riskLevel}
              </span>
            )}
          </div>
        </div>

        {/* Morse Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Riwayat Jatuh (3 Bulan Terakhir)</span>
            <input
              type="checkbox"
              checked={historyOfFalling}
              onChange={(e) => setHistoryOfFalling(e.target.checked)}
              className="w-5 h-5 rounded accent-amber-600"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Diagnosis Medis Sekunder &gt; 1</span>
            <input
              type="checkbox"
              checked={secondaryDiagnosis}
              onChange={(e) => setSecondaryDiagnosis(e.target.checked)}
              className="w-5 h-5 rounded accent-amber-600"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Terpasang Infus / Heparin Lock</span>
            <input
              type="checkbox"
              checked={ivTherapyOrHeparin}
              onChange={(e) => setIvTherapyOrHeparin(e.target.checked)}
              className="w-5 h-5 rounded accent-amber-600"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Alat Bantu Berjalan</span>
            <select
              value={ambulatoryAid}
              onChange={(e) => setAmbulatoryAid(e.target.value)}
              className="w-full p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
            >
              <option value="NONE">Tidak Ada / Bedrest (0 Poin)</option>
              <option value="CRUTCHES_CANE">Kruk / Tongkat Walker (+15 Poin)</option>
              <option value="FURNITURE">Berpegangan Meja / Dinding (+30 Poin)</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Gaya Berjalan / Berpindah</span>
            <select
              value={gaitStatus}
              onChange={(e) => setGaitStatus(e.target.value)}
              className="w-full p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
            >
              <option value="NORMAL">Normal / Tidak Terganggu (0 Poin)</option>
              <option value="WEAK">Lemah / Langkah Pendek (+10 Poin)</option>
              <option value="IMPAIRED">Terganggu / Goyang Hilang Keseimbangan (+20 Poin)</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Status Mental</span>
            <select
              value={mentalStatus}
              onChange={(e) => setMentalStatus(e.target.value)}
              className="w-full p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
            >
              <option value="ORIENTED">Orientasi Baik (0 Poin)</option>
              <option value="OVERESTIMATES">Lupa Keterbatasan / Meremehkan (+15 Poin)</option>
            </select>
          </div>
        </div>

        {/* Recommended Nursing Fall Interventions */}
        {morseResult.recommendedInterventions.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              Intervensi Pencegahan Jatuh Wajib (JCI IPSG 6):
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
              {morseResult.recommendedInterventions.map((intv, idx) => (
                <li key={idx}>{intv}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 2: STANDAR ASUHAN KEPERAWATAN (SDKI, SLKI, SIKI) */}
      <form onSubmit={handleSaveCarePlan} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">menu_book</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Standar Diagnosis, Luaran & Intervensi Keperawatan Indonesia (3S - PPNI)
            </h3>
            <p className="text-xs text-slate-400">Penyusunan Rencana Asuhan Keperawatan Terstandar (PPNI / JCI)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* SDKI (Diagnosa) */}
          <div className="space-y-1.5">
            <label className="font-black text-slate-700 dark:text-slate-300">1. Diagnosa Keperawatan (SDKI)</label>
            <select
              value={selectedSdki}
              onChange={(e) => setSelectedSdki(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
            >
              <option value="D.0001">D.0001 Bersihan Jalan Napas Tidak Efektif</option>
              <option value="D.0005">D.0005 Pola Napas Tidak Efektif</option>
              <option value="D.0023">D.0023 Hipovolemia b.d Kehilangan Cairan Aktif</option>
              <option value="D.0077">D.0077 Nyeri Akut b.d Agen Pencedera Fisiologis</option>
              <option value="D.0130">D.0130 Hipertermia b.d Proses Penyakit (Infeksi)</option>
              <option value="D.0143">D.0143 Risiko Jatuh</option>
            </select>
          </div>

          {/* SLKI (Luaran) */}
          <div className="space-y-1.5">
            <label className="font-black text-slate-700 dark:text-slate-300">2. Luaran Keperawatan (SLKI)</label>
            <input
              type="text"
              value={slkiGoal}
              onChange={(e) => setSlkiGoal(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          {/* SIKI (Intervensi) */}
          <div className="space-y-1.5">
            <label className="font-black text-slate-700 dark:text-slate-300">3. Intervensi Keperawatan (SIKI)</label>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-1">
              {sikiList.map((siki, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{siki}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            Simpan Rencana Asuhan Keperawatan
          </button>
        </div>
      </form>
    </div>
  );
}
