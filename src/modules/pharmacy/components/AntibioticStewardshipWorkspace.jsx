/**
 * AntibioticStewardshipWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Antibiotic Stewardship Program (ASP) & Antimicrobial De-escalation Engine
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Stethoscope, Activity, FileText, CheckCircle2, AlertTriangle, 
  RefreshCw, User, ShieldCheck, ArrowRight, Microchip
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AntibioticStewardshipWorkspace() {

  // Mock Antibiotic Stewardship Data
  const ANTIBIOTIC_ORDERS = [
    { id: 'ASP-001', patient: 'Bpk. Hendra Wijaya', mrn: 'MRN-882049', antibiotic: 'Meropenem 1g Injeksi', indication: 'Pneumonia Berat (Empiris)', durationDays: 5, cultureStatus: 'KULTUR TERSEDIA', cultureResult: 'Sputum: Klebsiella pneumoniae (Sensitif Cefepime, Resistens Ampicillin)', deescalationCandidate: true, recommendedAntibiotic: 'Cefepime 1g IV (De-eskalasi Spektrum Sempit)', doctor: 'dr. Budi Santoso, Sp.PD' },
    { id: 'ASP-002', patient: 'Ibu Ratna Sari', mrn: 'MRN-553102', antibiotic: 'Ceftriaxone 1g Injeksi', indication: 'Sepsis Urinary Source', durationDays: 3, cultureStatus: 'MENUNGGU KULTUR', cultureResult: 'Darah: Inkubasi Hari Ke-2', deescalationCandidate: false, recommendedAntibiotic: 'Lanjutkan Ceftriaxone hingga hasil kultur keluar', doctor: 'dr. Maya Indah, Sp.An' }
  ];

  const handleDeescalate = (asp) => {
    toast.success(`REKOMENDASI DE-ESKALASI ANTIBIOTIK DIKIRIM KE DPJP! Mengganti ${asp.antibiotic} ➔ ${asp.recommendedAntibiotic}`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                ANTIMICROBIAL STEWARDSHIP PROGRAM (PPRA)
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI COP.3 &amp; Permenkes RI</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Penatalaksanaan Antibiotik &amp; Evaluasi De-eskalasi Mikrobiologi
            </h2>
          </div>
        </div>
      </div>

      {/* ANTIBIOTIC ORDERS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Stethoscope className="text-indigo-600" size={18} />
            Daftar Pasien Pengguna Antibiotik Spektrum Luas ({ANTIBIOTIC_ORDERS.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Pasien &amp; MRN</th>
                <th className="py-3.5 px-4">Antibiotik Aktif &amp; Indikasi</th>
                <th className="py-3.5 px-4 text-center">Lama Terapi (Hari)</th>
                <th className="py-3.5 px-4">Hasil Kultur Mikrobiologi</th>
                <th className="py-3.5 px-4 text-center">Kandidat De-eskalasi</th>
                <th className="py-3.5 px-4 text-center">Aksi ASP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {ANTIBIOTIC_ORDERS.map((asp, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{asp.patient}</span>
                    <span className="text-[9px] font-mono text-slate-400 block">{asp.mrn} • DPJP: {asp.doctor}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-indigo-600 block">{asp.antibiotic}</span>
                    <span className="text-[9px] text-slate-500 block">Indikasi: {asp.indication}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    Hari Ke-{asp.durationDays}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 block">{asp.cultureStatus}</span>
                    <span className="text-[9px] font-mono text-emerald-600 block">{asp.cultureResult}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {asp.deescalationCandidate ? (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        YA (KANDIDAT DE-ESKALASI)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        BELUM (EMPIRIS)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {asp.deescalationCandidate && (
                      <button 
                        onClick={() => handleDeescalate(asp)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                      >
                        Intervensi De-eskalasi
                      </button>
                    )}
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
