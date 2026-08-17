import React, { useState } from 'react';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { nursingCareEngineService } from '../services/nursingCareEngine.service.js';
import toast from 'react-hot-toast';

export default function NursingCommandCenter({ onSelectPatientTab }) {
  const { setLiveContext } = useEncounterStore();
  const [selectedWard, setSelectedWard] = useState('MELATI'); // 'MELATI' | 'MAWAR' | 'ICU'

  // Sample Inpatient Beds
  const [beds, setBeds] = useState([
    {
      bedId: 'BED-MEL-01',
      bedNumber: 'Melati 01',
      ward: 'Bangsal Melati',
      acuity: 'PARTIAL_CARE',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza, S.Pd',
      mrn: 'MRN-2026-001001',
      diagnosis: 'DHF Grade II',
      dpjp: 'dr. Surya Johnson, Sp.PD',
      dueEmarCount: 2,
      fallRisk: 'HIGH_RISK', // Gelang Kuning
      fluidStatus: 'NORMAL',
      vitalsDue: false,
      lastVitals: 'TD 110/70 • HR 84 • Suhu 37.8°C'
    },
    {
      bedId: 'BED-MEL-02',
      bedNumber: 'Melati 02',
      ward: 'Bangsal Melati',
      acuity: 'TOTAL_CARE',
      patientId: 'P-1002',
      patientName: 'Tn. Bambang Pamungkas',
      mrn: 'MRN-2026-001002',
      diagnosis: 'Post Apendektomi H+1',
      dpjp: 'dr. Budi Santoso, Sp.B',
      dueEmarCount: 1,
      fallRisk: 'HIGH_RISK',
      fluidStatus: 'DEFICIT_RISK',
      vitalsDue: true, // Overdue
      lastVitals: 'TD 130/80 • HR 90 • Suhu 38.2°C'
    },
    {
      bedId: 'BED-MEL-03',
      bedNumber: 'Melati 03',
      ward: 'Bangsal Melati',
      acuity: 'MINIMAL_CARE',
      patientId: 'P-1004',
      patientName: 'Ny. Dewi Lestari',
      mrn: 'MRN-2026-001004',
      diagnosis: 'Dispepsia Fungsional',
      dpjp: 'dr. Surya Johnson, Sp.PD',
      dueEmarCount: 0,
      fallRisk: 'LOW_RISK',
      fluidStatus: 'NORMAL',
      vitalsDue: false,
      lastVitals: 'TD 120/80 • HR 76 • Suhu 36.6°C'
    },
    {
      bedId: 'BED-MEL-04',
      bedNumber: 'Melati 04',
      ward: 'Bangsal Melati',
      acuity: 'TOTAL_CARE',
      patientId: 'P-1003',
      patientName: 'Tn. Hendra (Mr. X)',
      mrn: 'MRX-2026-A1',
      diagnosis: 'Syok Sepsis ec Pneumonia Berat',
      dpjp: 'dr. Surya Johnson, Sp.PD',
      dueEmarCount: 3,
      fallRisk: 'HIGH_RISK',
      fluidStatus: 'OVERLOAD_RISK',
      vitalsDue: true,
      lastVitals: 'TD 85/50 • HR 122 • SpO2 91%'
    }
  ]);

  // ISBAR Handover Modal State
  const [isbarModalOpen, setIsbarModalOpen] = useState(false);
  const [selectedPatientForIsbar, setSelectedPatientForIsbar] = useState(null);
  const [situationText, setSituationText] = useState('Pasien mengeluh demam turun naik dan pusing ringan.');
  const [backgroundText, setBackgroundText] = useState('Rawat inap hari ke-2, riwayat DHF dengan petekie.');
  const [assessmentText, setAssessmentText] = useState('Tanda vital stabil, trombosit 85.000 /uL, balance cairan +250ml.');
  const [recommendationText, setRecommendationText] = useState('Lanjutkan rehidrasi RL 2ml/kgBB/jam, evaluasi DL ulang jam 18:00.');

  const handleSelectBedPatient = (bed, targetTab = 'EMAR') => {
    setLiveContext(bed.patientId, null);
    toast.success(`Konteks Pasien Aktif: ${bed.patientName} (${bed.bedNumber})`);
    if (onSelectPatientTab) {
      onSelectPatientTab(targetTab);
    }
  };

  const handleOpenIsbar = (bed) => {
    setSelectedPatientForIsbar(bed);
    setIsbarModalOpen(true);
  };

  const handleSaveIsbar = (e) => {
    e.preventDefault();
    const isbarReport = nursingCareEngineService.generateIsbarReport({
      patientName: selectedPatientForIsbar.patientName,
      mrn: selectedPatientForIsbar.mrn,
      wardName: selectedPatientForIsbar.ward,
      bedNumber: selectedPatientForIsbar.bedNumber,
      primaryDoctor: selectedPatientForIsbar.dpjp,
      situation: situationText,
      background: backgroundText,
      assessment: assessmentText,
      recommendation: recommendationText,
      handoverNursePrimary: 'Ns. Ratna Sari, S.Kep (Shift Pagi)',
      handoverNurseSecondary: 'Ns. Maya Dewi, S.Kep (Shift Siang)'
    });

    toast.success(`Timbang Terima / Handover ISBAR untuk ${selectedPatientForIsbar.patientName} Berhasil Disimpan & Ditandatangani!`);
    setIsbarModalOpen(false);
  };

  return (
    <div className="p-4 space-y-5">
      {/* 4 LIVE NURSING METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Jadwal Obat Belum Diberikan</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">6 <span className="text-xs font-normal">Dosis</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">eMAR Shift Pagi (07:00 - 14:00)</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">medication</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Monitoring TTV Terlambat</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">2 <span className="text-xs font-normal">Pasien</span></div>
            <div className="text-[10px] text-rose-500 font-bold mt-0.5">Melebihi Interval 4 Jam</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-600/20 text-rose-600 flex items-center justify-center font-black animate-pulse">
            <span className="material-symbols-outlined text-[24px]">vital_signs</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Pasien Risiko Jatuh Tinggi</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">3 <span className="text-xs font-normal">Gelang Kuning</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Morse Fall Scale &ge; 45</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-600/20 text-amber-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Imbalance Cairan Kritis</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">2 <span className="text-xs font-normal">Pasien</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Perlu Monitoring Diuresis</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">water_damage</span>
          </div>
        </div>
      </div>

      {/* WARD BED ALLOCATION GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[22px]">bed</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Denah Keterisian Tempat Tidur Rawat Inap (Ward Grid)</h3>
              <p className="text-xs text-slate-400">Bangsal Melati (Kelas 1 & 2 Dewasa) • 4 Terisi / 6 Kapasitas</p>
            </div>
          </div>

          {/* Ward Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWard('MELATI')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                selectedWard === 'MELATI' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Bangsal Melati
            </button>
            <button
              onClick={() => setSelectedWard('MAWAR')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                selectedWard === 'MAWAR' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Bangsal Mawar
            </button>
            <button
              onClick={() => setSelectedWard('ICU')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                selectedWard === 'ICU' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              ICU Intensif
            </button>
          </div>
        </div>

        {/* Bed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {beds.map(bed => (
            <div
              key={bed.bedId}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300">
                    {bed.bedNumber}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    bed.acuity === 'TOTAL_CARE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                    bed.acuity === 'PARTIAL_CARE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {bed.acuity.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{bed.patientName}</h4>
                  <div className="text-[10px] font-mono text-slate-400">{bed.mrn}</div>
                  <div className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 mt-1 line-clamp-1">{bed.diagnosis}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">DPJP: {bed.dpjp}</div>
                </div>

                {/* Patient Safety Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {bed.fallRisk === 'HIGH_RISK' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">warning</span>
                      Jatuh Tinggi
                    </span>
                  )}
                  {bed.vitalsDue && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black animate-pulse">
                      TTV Terlambat
                    </span>
                  )}
                  {bed.dueEmarCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                      {bed.dueEmarCount} Obat Due
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {bed.lastVitals}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => handleSelectBedPatient(bed, 'EMAR')}
                  className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[13px]">vaccines</span>
                  eMAR
                </button>
                <button
                  onClick={() => handleOpenIsbar(bed)}
                  className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">handshake</span>
                  ISBAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ISBAR SHIFT HANDOVER MODAL */}
      {isbarModalOpen && selectedPatientForIsbar && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSaveIsbar} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-[24px]">handshake</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Timbang Terima / Handover Antar Shift (ISBAR)</h3>
                  <p className="text-xs text-slate-500 font-mono">Pasien: {selectedPatientForIsbar.patientName} ({selectedPatientForIsbar.bedNumber})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsbarModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider">S - Situation (Kondisi Terkini)</label>
                <input
                  type="text"
                  value={situationText}
                  onChange={(e) => setSituationText(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider">B - Background (Riwayat & Diagnosis)</label>
                <input
                  type="text"
                  value={backgroundText}
                  onChange={(e) => setBackgroundText(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider">A - Assessment (Hasil Observasi & TTV)</label>
                <input
                  type="text"
                  value={assessmentText}
                  onChange={(e) => setAssessmentText(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider">R - Recommendation (Instruksi Lanjutan)</label>
                <input
                  type="text"
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsbarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Tanda Tangani Timbang Terima (ISBAR)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
