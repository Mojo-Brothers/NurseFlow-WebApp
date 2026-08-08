/**
 * ControlledDrugsWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Controlled Substances, Narcotics, & Psychotropics Double-Sign Witness Engine
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, FileText, CheckCircle2, 
  AlertTriangle, Key, Trash2, Plus, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ControlledDrugsWorkspace() {
  const [witnessEmail, setWitnessEmail] = useState('');
  const [isWitnessModalOpen, setIsWitnessModalOpen] = useState(false);

  // Mock Controlled Drugs Balance Data
  const CONTROLLED_ITEMS = [
    { code: 'OBAT-FNT-001', name: 'Fentanyl Injeksi 0.05mg/ml Ampul', category: 'NARKOTIKA GOLONGAN II', batchNo: 'BTC-NARC-2026-01', location: 'Brankas Terkunci Farmasi Utam', initialQty: 50, currentQty: 30, unit: 'Ampul', witnessRequired: true },
    { code: 'OBAT-MDZ-002', name: 'Midazolam Injeksi 5mg/ml Ampul', category: 'PSIKOTROPIKA GOLONGAN IV', batchNo: 'BTC-PSYK-2026-04', location: 'Brankas Terkunci Depo OK', initialQty: 40, currentQty: 25, unit: 'Ampul', witnessRequired: true },
    { code: 'OBAT-MOR-003', name: 'Morphine Sulfate 10mg/ml Ampul', category: 'NARKOTIKA GOLONGAN II', batchNo: 'BTC-NARC-2026-09', location: 'Brankas Terkunci ICU', initialQty: 20, currentQty: 12, unit: 'Ampul', witnessRequired: true }
  ];

  const handleVerifyWitness = (e) => {
    e.preventDefault();
    if (!witnessEmail) {
      toast.error('Email saksi apoteker/perawat kedua wajib diisi!');
      return;
    }
    toast.success(`VERIFIKASI SAKSI GANDA (2FA) SUKSES! Saksi [${witnessEmail}] berhasil mencatat verifikasi transaksi Narkotika!`);
    setIsWitnessModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
            <Lock size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                CONTROLLED SUBSTANCES REGULATORY ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">Undang-Undang Narkotika &amp; JCI MMU.3</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Pengelolaan &amp; Rekonsiliasi Narkotika &amp; Psikotropika (Double Sign Witness)
            </h2>
          </div>
        </div>

        <button 
          onClick={() => setIsWitnessModalOpen(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Key size={16} />
          <span>Verifikasi Saksi Ganda (Double Sign)</span>
        </button>
      </div>

      {/* CONTROLLED DRUGS BALANCES TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-purple-600" size={18} />
            Buku Register Stok Terkunci Narkotika &amp; Psikotropika ({CONTROLLED_ITEMS.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode &amp; Nama Sediaan</th>
                <th className="py-3.5 px-4">Golongan Regulatari</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Lokasi Brankas Terkunci</th>
                <th className="py-3.5 px-4 text-center">Stok Awal</th>
                <th className="py-3.5 px-4 text-center">Stok Akhir</th>
                <th className="py-3.5 px-4 text-center">Aturan Saksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {CONTROLLED_ITEMS.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono text-purple-600 font-black block">{item.code}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{item.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-purple-700">
                    {item.category}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {item.batchNo}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {item.location}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {item.initialQty} {item.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-purple-600">
                    {item.currentQty} {item.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      WAJIB 2 SAKSI
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOUBLE SIGN WITNESS MODAL */}
      {isWitnessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">Saksi Ganda (Double Sign)</h3>
                <p className="text-xs text-slate-500 font-medium">Verifikasi Saksi Ke-2 untuk Pengeluaran Narkotika</p>
              </div>
            </div>

            <form onSubmit={handleVerifyWitness} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">EMAIL / USER ID SAKSI KE-2 (APOTEKER / PERAWAT AWAT) *</label>
                <input 
                  type="email"
                  required
                  placeholder="Contoh: ns.ratna@nurseflow.id"
                  value={witnessEmail}
                  onChange={e => setWitnessEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWitnessModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-black uppercase">Batal</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-xl font-black uppercase">Verifikasi Saksi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
