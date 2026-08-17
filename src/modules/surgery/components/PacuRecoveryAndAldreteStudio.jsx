import React, { useState } from 'react';
import { operatingTheatreEngineService } from '../services/operatingTheatreEngine.service.js';
import toast from 'react-hot-toast';

export default function PacuRecoveryAndAldreteStudio({ activeCase }) {
  const currentCase = activeCase || {
    id: 'CASE-SURG-001',
    bookingNumber: 'SURG-2026-0817-001',
    patientName: 'Tn. Hendra (Mr. X)',
    patientMrn: 'MRX-2026-A1',
    procedureName: 'Laparotomi Eksplorasi & Apendektomi Cito'
  };

  const [activity, setActivity] = useState(2);
  const [respiration, setRespiration] = useState(2);
  const [circulation, setCirculation] = useState(2);
  const [consciousness, setConsciousness] = useState(1);
  const [o2Saturation, setO2Saturation] = useState(2);
  const [assessorName, setAssessorName] = useState('Ns. Ratna, S.Kep (PACU Recovery)');
  const [isSaved, setIsSaved] = useState(false);

  const totalScore = Number(activity) + Number(respiration) + Number(circulation) + Number(consciousness) + Number(o2Saturation);
  const isEligible = totalScore >= 8;

  const handleSaveScore = (e) => {
    e.preventDefault();
    try {
      operatingTheatreEngineService.calculateAldreteScore({
        caseId: currentCase.id,
        activity,
        respiration,
        circulation,
        consciousness,
        o2Saturation,
        assessedBy: assessorName
      });

      setIsSaved(true);
      if (isEligible) {
        toast.success(`Skor Aldrete ${totalScore}/10: Pasien Layak Pindah ke Ruang Rawat Inap!`);
      } else {
        toast('Skor Aldrete belum mencukupi (≥8). Lanjutkan observasi PACU.', { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSaveScore} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">bedtime</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">PACU Recovery & Aldrete Score Assessment</h3>
            <p className="text-xs text-slate-400">
              Evaluasi Pemulihan Pasca-Anestesi Ruang Pulih Sadar (PACU) • Kasus: {currentCase.bookingNumber}
            </p>
          </div>
        </div>

        {/* Live Total Score Pill */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold ${
          isEligible
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          <span className="text-base font-black font-mono">{totalScore} / 10</span>
          <span className="text-[11px]">{isEligible ? 'LAYAK PINDAH RUANGAN' : 'OBSERVASI PACU'}</span>
        </div>
      </div>

      {/* Aldrete 5 Parameters */}
      <div className="space-y-3">
        {/* 1. Activity */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full sm:w-1/2">
            <span className="font-black text-slate-900 dark:text-white">1. Aktivitas Motorik (Motor Activity)</span>
            <p className="text-slate-400 text-[11px]">Kemampuan menggerakkan anggota gerak secara sadar</p>
          </div>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value={2}>2 - Mampu gerak 4 ekstremitas</option>
            <option value={1}>1 - Mampu gerak 2 ekstremitas</option>
            <option value={0}>0 - Tidak mampu gerak anggota tubuh</option>
          </select>
        </div>

        {/* 2. Respiration */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full sm:w-1/2">
            <span className="font-black text-slate-900 dark:text-white">2. Respirasi / Pernapasan</span>
            <p className="text-slate-400 text-[11px]">Kecukupan ventilasi dan upaya napas spontan</p>
          </div>
          <select
            value={respiration}
            onChange={(e) => setRespiration(Number(e.target.value))}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value={2}>2 - Bernapas dalam & mampu batuk bebas</option>
            <option value={1}>1 - Napas dangkal, terbatas atau sesak</option>
            <option value={0}>0 - Apneu / Membutuhkan bantuan ventilator</option>
          </select>
        </div>

        {/* 3. Circulation */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full sm:w-1/2">
            <span className="font-black text-slate-900 dark:text-white">3. Sirkulasi / Tekanan Darah</span>
            <p className="text-slate-400 text-[11px]">Deviasi Tekanan Darah Sistolik terhadap nilai pra-bedah</p>
          </div>
          <select
            value={circulation}
            onChange={(e) => setCirculation(Number(e.target.value))}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value={2}>2 - TD sistolik berbeda &lt; 20% dari pre-op</option>
            <option value={1}>1 - TD sistolik berbeda 20% - 50% dari pre-op</option>
            <option value={0}>0 - TD sistolik berbeda &gt; 50% dari pre-op</option>
          </select>
        </div>

        {/* 4. Consciousness */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full sm:w-1/2">
            <span className="font-black text-slate-900 dark:text-white">4. Tingkat Kesadaran (Consciousness)</span>
            <p className="text-slate-400 text-[11px]">Responsibilitas kognitif dan orientasi pasien</p>
          </div>
          <select
            value={consciousness}
            onChange={(e) => setConsciousness(Number(e.target.value))}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value={2}>2 - Sadar penuh & orientasi baik</option>
            <option value={1}>1 - Bangun jika dipanggil nama</option>
            <option value={0}>0 - Tidak ada respons rangsang</option>
          </select>
        </div>

        {/* 5. Oxygen Saturation */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full sm:w-1/2">
            <span className="font-black text-slate-900 dark:text-white">5. Saturasi Oksigen (SpO2)</span>
            <p className="text-slate-400 text-[11px]">Kadar oksigenasi darah perifer</p>
          </div>
          <select
            value={o2Saturation}
            onChange={(e) => setO2Saturation(Number(e.target.value))}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value={2}>2 - SpO2 &gt; 92% pada udara ruangan</option>
            <option value={1}>1 - Membutuhkan O2 kanul utk SpO2 &gt; 90%</option>
            <option value={0}>0 - SpO2 &lt; 90% meski dengan oksigen</option>
          </select>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-700 dark:text-slate-300">Penilai PACU:</label>
          <input
            type="text"
            value={assessorName}
            onChange={(e) => setAssessorName(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          Simpan Skor Aldrete & Validasi Transfer Ruangan
        </button>
      </div>
    </form>
  );
}
