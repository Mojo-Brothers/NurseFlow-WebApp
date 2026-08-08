/**
 * MedicationReconciliationWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Medication Reconciliation Engine (Admission, Ward Transfer, & Discharge)
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, RefreshCw, ArrowRight, Plus, 
  User, Building, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MedicationReconciliationWorkspace() {
  const [reconciliationType, setReconciliationType] = useState('ADMISSION'); // ADMISSION, TRANSFER, DISCHARGE

  // Mock Home Meds vs Hospital Meds Reconciliation Data
  const RECONCILED_MEDS = [
    { id: 'REC-001', name: 'Amlodipine 10mg Tablet', source: 'OBAT RUMAH PASIEN', homeDose: '10mg 1x Sehari', hospitalDose: '10mg 1x Sehari', status: 'CONTINUE', reconciledBy: 'Apt. Budi Santoso, S.Farm', date: '2026-08-05 08:30' },
    { id: 'REC-002', name: 'Metformin 500mg Tablet', source: 'OBAT RUMAH PASIEN', homeDose: '500mg 2x Sehari', hospitalDose: 'Dihentikan selama rawat inap (Puasa/Insulin)', status: 'STOP', reconciledBy: 'Apt. Budi Santoso, S.Farm', date: '2026-08-05 08:30' },
    { id: 'REC-003', name: 'Paracetamol 500mg Tablet', source: 'RESEP RAWAT INAP BARU', homeDose: 'N/A', hospitalDose: '500mg 3x Sehari (PRN)', status: 'NEW', reconciledBy: 'dr. Budi Santoso, Sp.PD', date: '2026-08-05 09:00' }
  ];

  const handleSaveReconciliation = () => {
    toast.success(`Formulir Rekonsiliasi Obat [${reconciliationType}] berhasil disahkan & disimpan ke Rekam Medis EMR Pasien!`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-600 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                PATIENT SAFETY CONTINUITY
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI ACC.4 &amp; Permenkes RI</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Rekonsiliasi Obat Pasien (Admission, Transfer, &amp; Discharge)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setReconciliationType('ADMISSION')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${reconciliationType === 'ADMISSION' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Admisi 24 Jam Pertama
          </button>
          <button 
            onClick={() => setReconciliationType('TRANSFER')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${reconciliationType === 'TRANSFER' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Transfer Bangsal / ICU
          </button>
          <button 
            onClick={() => setReconciliationType('DISCHARGE')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${reconciliationType === 'DISCHARGE' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Resep Pulang (Discharge)
          </button>
        </div>
      </div>

      {/* RECONCILIATION FORM TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-[#007399]" size={18} />
            Daftar Komparasi Obat Sebelum Admisi vs Medikasi Bangsal ({RECONCILED_MEDS.length})
          </h3>
          <button 
            onClick={handleSaveReconciliation}
            className="px-5 py-2.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm"
          >
            Sahkan Rekonsiliasi Obat
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Nama Obat &amp; Sumber</th>
                <th className="py-3.5 px-4">Aturan Minum Rumah (Pra-Admisi)</th>
                <th className="py-3.5 px-4">Instruksi Medis Bangsal</th>
                <th className="py-3.5 px-4 text-center">Keputusan Rekonsiliasi</th>
                <th className="py-3.5 px-4 text-center">Apoteker / DPJP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {RECONCILED_MEDS.map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{rec.name}</span>
                    <span className="text-[9px] text-slate-400 block">{rec.source}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {rec.homeDose}
                  </td>
                  <td className="py-3.5 px-4 text-[#007399]">
                    {rec.hospitalDose}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {rec.status === 'CONTINUE' && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        LANJUTKAN (CONTINUE)
                      </span>
                    )}
                    {rec.status === 'STOP' && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20">
                        HENTIKAN (STOP)
                      </span>
                    )}
                    {rec.status === 'NEW' && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                        OBAT BARU (NEW)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                    {rec.reconciledBy}
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
