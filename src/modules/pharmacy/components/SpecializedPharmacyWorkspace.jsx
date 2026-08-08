/**
 * SpecializedPharmacyWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Emergency, ICU, OR Pharmacy, IV Admixture, Compounding, Chemotherapy, & TDM
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Scissors, HeartPulse, ShieldAlert, Sparkles, Activity, 
  Search, CheckCircle2, User, FileText, Clock, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SpecializedPharmacyWorkspace() {
  const [activeUnit, setActiveUnit] = useState('IV_ADMIXTURE'); // IV_ADMIXTURE, COMPOUNDING, CHEMO, ICU_OR

  // Mock Specialized Orders Data
  const SPECIALIZED_ORDERS = [
    { id: 'STE-001', patient: 'Bpk. Hendra Wijaya', unit: 'ICU (INTENSIVE CARE UNIT)', type: 'IV ADMIXTURE STERIL', medication: 'Norepinephrine 4mg dalam Dextrose 5% 50ml', rate: '0.1 mcg/kg/min', beyondUseTime: '2026-08-06 08:00 (24 Jam)', preparedBy: 'Apt. Rina Pratama, S.Farm', checkedBy: 'Apt. Budi Santoso, S.Farm', status: 'PREPARED_STERILE' },
    { id: 'STE-002', patient: 'Anak Aisyah (3 Thn)', unit: 'POLI ANAK', type: 'COMPOUNDING RACIKAN', medication: 'Pulveres Racikan Batuk Pilek (Paracetamol 120mg + CTm 1mg + GG 50mg)', rate: '3 x 1 Bungkus Sehari', beyondUseTime: '2026-08-20 (14 Hari)', preparedBy: 'Staf Asisten Apoteker', checkedBy: 'Apt. Budi Santoso, S.Farm', status: 'PREPARED_RACIKAN' },
    { id: 'STE-003', patient: 'Ibu Ratna Sari', unit: 'ONKOLOGI SITOSTATIKA', type: 'CHEMOTHERAPY PROTOCOL', medication: 'Paclitaxel 175mg/m2 + Carboplatin AUC 5 (Kemoterapi Siklus 3)', rate: 'Infus Kontinyu 3 Jam', beyondUseTime: '2026-08-05 18:00 (12 Jam)', preparedBy: 'Apt. Spesialis Kemoterapi', checkedBy: 'Apt. Head Chemotherapy', status: 'DOUBLE_CHECKED' }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
            <Sparkles size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                STERILE COMPOUNDING &amp; SPECIALIZED UNITS
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI MMU.5 &amp; USP 797/800 Cleanroom</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              IV Admixture Steril, Racikan Compounding, Kemoterapi, &amp; Depo Khusus (ICU/OK/UGD)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveUnit('IV_ADMIXTURE')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeUnit === 'IV_ADMIXTURE' ? 'bg-[#007399] text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
          >
            IV Admixture Steril
          </button>
          <button 
            onClick={() => setActiveUnit('COMPOUNDING')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeUnit === 'COMPOUNDING' ? 'bg-[#007399] text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
          >
            Sediaan Racikan (Pulveres)
          </button>
          <button 
            onClick={() => setActiveUnit('CHEMO')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeUnit === 'CHEMO' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
          >
            Sitostatika Kemoterapi
          </button>
        </div>
      </div>

      {/* SPECIALIZED WORKSPACE TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="text-[#007399]" size={18} />
            Daftar Preparasi Sediaan Khusus &amp; Steril Cleanroom ({SPECIALIZED_ORDERS.length})
          </h3>
          <button 
            onClick={() => toast.success('Formulir Preparasi IV Admixture / Kemoterapi Baru dibuka!')}
            className="px-4 py-2 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm"
          >
            + Buat Form Preparasi Steril
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode &amp; Pasien</th>
                <th className="py-3.5 px-4">Unit Layanan</th>
                <th className="py-3.5 px-4">Sediaan &amp; Komposisi Custom</th>
                <th className="py-3.5 px-4 text-center">Beyond Use Date (BUD)</th>
                <th className="py-3.5 px-4 text-center">Petugas Cleanroom</th>
                <th className="py-3.5 px-4 text-center">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {SPECIALIZED_ORDERS.map((ord, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono text-[#007399] font-black block">{ord.id}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{ord.patient}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-black block">{ord.unit}</span>
                    <span className="text-[9px] text-[#007399] block font-mono">{ord.type}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{ord.medication}</span>
                    <span className="text-[9px] text-slate-400 block">Laju Infus/Aturan: {ord.rate}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-amber-600">
                    {ord.beyondUseTime}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                    <span className="block text-[10px]">{ord.preparedBy}</span>
                    <span className="block text-[9px] text-slate-400">Verifikator: {ord.checkedBy}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
