/**
 * PharmacySafetyInterventionWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Pharmacist Interventions, ADR MESO, Medication Errors, & Substitutions Engine
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, FileText, CheckCircle2, User, 
  Search, Plus, Activity, ArrowRight, RefreshCw, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PharmacySafetyInterventionWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState('INTERVENTIONS'); // INTERVENTIONS, ADR_MESO, ERRORS, SUBSTITUTIONS

  // Mock Interventions Data
  const INTERVENTIONS = [
    { id: 'INT-001', patient: 'Bpk. Hendra Wijaya', mrn: 'MRN-882049', medication: 'Meropenem 1g Injeksi', problemType: 'DOSAGE_OUT_OF_RANGE', description: 'Dosis 1g/8 jam terlalu tinggi untuk eGFR 30 mL/min', recommendation: 'Penyesuaian dosis menjadi 500mg/12 jam', outcome: 'ACCEPTED', doctor: 'dr. Budi Santoso, Sp.PD', pharmacist: 'Apt. Rina Pratama, S.Farm', date: '2026-08-05 10:30' },
    { id: 'INT-002', patient: 'Ibu Ratna Sari', mrn: 'MRN-553102', medication: 'Paracetamol 500mg Tablet', problemType: 'DRUG_INTERACTION', description: 'Interaksi minor dengan Warfarin Oral', recommendation: 'Monitoring rutin INR pasien', outcome: 'ACCEPTED', doctor: 'dr. Maya Indah, Sp.An', pharmacist: 'Apt. Budi Santoso, S.Farm', date: '2026-08-05 11:15' }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                CLINICAL SAFETY &amp; QUALITY ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI QPS &amp; Permenkes RI</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Intervensi Apoteker, Pelaporan MESO (ADR), &amp; Medication Error Reporting
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('INTERVENTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'INTERVENTIONS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Intervensi Apoteker
          </button>
          <button 
            onClick={() => setActiveSubTab('ADR_MESO')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'ADR_MESO' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Pelaporan MESO (ADR)
          </button>
          <button 
            onClick={() => setActiveSubTab('ERRORS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'ERRORS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Medication Error RCA
          </button>
        </div>
      </div>

      {/* INTERVENTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-[#007399]" size={18} />
            Catatan Intervensi Farmasi Klinis Ke DPJP ({INTERVENTIONS.length})
          </h3>
          <button 
            onClick={() => toast.success('Modal Catat Intervensi Apoteker Baru dibuka!')}
            className="px-4 py-2 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm"
          >
            + Catat Intervensi Apoteker
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode &amp; Pasien</th>
                <th className="py-3.5 px-4">Medikasi &amp; Masalah</th>
                <th className="py-3.5 px-4">Rekomendasi Apoteker</th>
                <th className="py-3.5 px-4 text-center">Respon DPJP</th>
                <th className="py-3.5 px-4 text-center">Apoteker Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {INTERVENTIONS.map((int, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono text-[#007399] font-black block">{int.id}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{int.patient}</span>
                    <span className="text-[9px] font-mono text-slate-400 block">{int.mrn}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{int.medication}</span>
                    <span className="text-[9px] font-bold text-amber-600 block">{int.problemType}: {int.description}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#007399]">
                    {int.recommendation}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {int.outcome} BY {int.doctor}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                    {int.pharmacist}
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
