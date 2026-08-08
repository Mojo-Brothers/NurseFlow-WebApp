/**
 * QuarantineRecallWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Quarantine, Damaged Stock, & Batch Recall Reverse Traceability Workspace
 * Answers JCI Safety Questions: "Where is this batch now?" & "Which patients received this batch?"
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, AlertOctagon, User, Search, MapPin, 
  FileText, CheckCircle2, Lock, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuarantineRecallWorkspace({ items = [] }) {
  const [recallBatchQuery, setRecallBatchQuery] = useState('BTC-2026-1544');
  const [activeTab, setActiveTab] = useState('RECALL_TRACE'); // RECALL_TRACE, QUARANTINE_LIST, DAMAGE_LIST

  // Mock Reverse Traceability Data
  const RECALL_PATIENT_HISTORY = [
    { patientId: 'P-10029', name: 'Bpk. Hendra Wijaya', mrn: 'MRN-882049', encounterId: 'ENC-2026-0801-094', procedure: 'Rawat Inap - Pneumonia', date: '2026-08-02 10:15', qtyUsed: 10, unit: 'Tablet', doctor: 'dr. Budi Santoso, Sp.PD' },
    { patientId: 'P-10034', name: 'Ibu Ratna Sari', mrn: 'MRN-553102', encounterId: 'ENC-2026-0803-112', procedure: 'UGD Resusitasi', date: '2026-08-03 14:20', qtyUsed: 5, unit: 'Tablet', doctor: 'dr. Maya Indah, Sp.An' }
  ];

  const RECALL_CURRENT_LOCATIONS = [
    { location: 'Gudang Logistik Medik Sentral', rack: 'RACK-A01-02', availableQty: 288, unit: 'Tablet', status: 'BLOCKED_RECALL' },
    { location: 'Depo Satelit UGD', rack: 'TROLI-UGD-01', availableQty: 50, unit: 'Tablet', status: 'BLOCKED_RECALL' }
  ];

  const handleExecuteRecall = () => {
    toast.error(`BATCH RECALL DIBERLAKUKAN! Seluruh stok Batch ${recallBatchQuery} di 2 gudang telah diblokir secara terpusat! Notifikasi keamanan dikirim ke DPJP.`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* WORKSPACE HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
            <AlertOctagon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                JCI PATIENT SAFETY PROTOCOL
              </span>
              <span className="text-[10px] font-bold text-slate-400">Reverse Traceability Engine</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Quarantine, Damaged Stock, &amp; Batch Recall Traceability
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('RECALL_TRACE')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'RECALL_TRACE' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
          >
            Batch Recall Traceability
          </button>
          <button 
            onClick={() => setActiveTab('QUARANTINE_LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'QUARANTINE_LIST' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
          >
            Stok Karantina
          </button>
        </div>
      </div>

      {/* RECALL TRACEABILITY ENGINE */}
      {activeTab === 'RECALL_TRACE' && (
        <div className="space-y-6">

          {/* SEARCH RECALL BATCH BAR */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <span className="text-xs font-black uppercase text-slate-500 shrink-0">LAKUKAN RECALL BATCH:</span>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Masukkan Nomor Batch Pabrikan (misal: BTC-2026-1544)..."
                  value={recallBatchQuery}
                  onChange={e => setRecallBatchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:border-rose-500"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteRecall}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Lock size={16} />
              <span>Eksekusi Recall &amp; Blokir Total Batch</span>
            </button>
          </div>

          {/* TWO PANELS: 1. CURRENT LOCATIONS | 2. PATIENT USAGE HISTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PANEL 1: WHERE IS THIS BATCH NOW? */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="text-rose-500" size={18} />
                  1. Keberadaan Fisik Batch Ini Saat Ini (Where is it?)
                </h3>
                <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  {RECALL_CURRENT_LOCATIONS.length} Lokasi Ditemukan
                </span>
              </div>

              <div className="space-y-3">
                {RECALL_CURRENT_LOCATIONS.map((loc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-black text-rose-700 block uppercase">{loc.location}</span>
                      <span className="text-[9px] font-mono text-slate-500 block">Posisi Rak: {loc.rack}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-rose-700 block font-mono">{loc.availableQty} {loc.unit}</span>
                      <span className="text-[9px] font-black text-red-600 uppercase block">STATUS: DIBLOKIR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL 2: WHICH PATIENTS RECEIVED THIS BATCH? */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                  <User className="text-indigo-500" size={18} />
                  2. Pasien yang Pernah Menggunakan Batch Ini (Who received it?)
                </h3>
                <span className="text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  {RECALL_PATIENT_HISTORY.length} Pasien Terlacak
                </span>
              </div>

              <div className="space-y-3">
                {RECALL_PATIENT_HISTORY.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 dark:text-slate-100">{p.name} ({p.mrn})</span>
                      <span className="text-[9px] font-mono text-indigo-600 font-black">{p.date}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Prosedur: {p.procedure} • DPJP: {p.doctor}</div>
                    <div className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">Penggunaan: {p.qtyUsed} {p.unit}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* QUARANTINE LIST */}
      {activeTab === 'QUARANTINE_LIST' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-purple-600 uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert size={18} />
            Daftar Stok Karantina Aktif (Quarantine Inventory)
          </h3>
          <p className="text-xs text-slate-500 font-medium">Barang yang diisolasi akibat kerosakan fisik, penyimpangan suhu, atau masalah kualitas.</p>
        </div>
      )}

    </div>
  );
}
