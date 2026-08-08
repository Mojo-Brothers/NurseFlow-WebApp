/**
 * PharmacyIntegrationsReportsWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Pharmacy Integration Hub (Inventory, Billing, BPJS), Reports, & Audit Trail System
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Layers, DollarSign, FileText, ShieldCheck, Download, 
  RefreshCw, CheckCircle2, ArrowRight, Building, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PharmacyIntegrationsReportsWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState('INTEGRATIONS'); // INTEGRATIONS, REPORTS, AUDIT

  const handleExportReport = (name) => {
    toast.success(`Export ${name} (Format Excel / PDF) berhasil diproses!`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                CROSS-MODULE INTEGRATION HUB
              </span>
              <span className="text-[10px] font-bold text-slate-400">Inventory, Billing, Procurement, &amp; BPJS</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Integrasi Terpusat, Laporan Farmasi, &amp; Log Audit JCI
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('INTEGRATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'INTEGRATIONS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Integrasi Sistem
          </button>
          <button 
            onClick={() => setActiveSubTab('REPORTS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'REPORTS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Laporan Farmasi
          </button>
          <button 
            onClick={() => setActiveSubTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'AUDIT' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Audit Trail JCI
          </button>
        </div>
      </div>

      {/* INTEGRATIONS CARDS */}
      {activeSubTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">1. Integrasi Central Inventory</h4>
            <p className="text-xs text-slate-500 font-medium">Dispensing obat otomatis mengurangi stok fisik gudang berbasis nomor batch &amp; prinsip FEFO.</p>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block">
              STATUS: TERKONEKSI (SSOT)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">2. Integrasi Billing &amp; BPJS</h4>
            <p className="text-xs text-slate-500 font-medium">Tagihan obat otomatis masuk ke Billing Pasien &amp; Klaim E-Klaim BPJS INA-CBGs tanpa double entry.</p>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block">
              STATUS: TERKONEKSI (SSOT)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <ShoppingCart size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">3. Integrasi Procurement</h4>
            <p className="text-xs text-slate-500 font-medium">Peringatan stok kritis obat otomatis men-trigger Purchase Requisition (PR) ke bagian Pengadaan.</p>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block">
              STATUS: TERKONEKSI (SSOT)
            </span>
          </div>
        </div>
      )}

      {/* REPORTS PANEL */}
      {activeSubTab === 'REPORTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Laporan Volume E-Resep & Turnaround Time', desc: 'Analisis kecepatan verifikasi & dispensing obat' },
            { title: 'Laporan Konsumsi Obat & HPP Farmasi', desc: 'Rincian pemakaian obat per unit & billing pasien' },
            { title: 'Laporan Register Narkotika & Psikotropika', desc: 'Buku register resmi Dinas Kesehatan & BPOM' },
            { title: 'Laporan Antibiotic Stewardship (PPRA)', desc: 'Evaluasi penggunaan antibiotik & de-eskalasi' },
            { title: 'Laporan Intervensi Apoteker & Safety', desc: 'Rekapitulasi intervensi klinis apoteker ke DPJP' },
            { title: 'Laporan MESO (ADR) & Medication Errors', desc: 'Laporan keselamatan obat siap kirim ke BPOM' }
          ].map((rep, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <FileText className="text-[#007399] mb-3" size={24} />
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{rep.title}</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{rep.desc}</p>
              </div>
              <button 
                onClick={() => handleExportReport(rep.title)}
                className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Laporan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT PANEL */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2 mb-3">
            <ShieldCheck className="text-[#007399]" size={18} />
            Immutable Pharmacy Audit Log System (JCI Audit Ready)
          </h3>
          <p className="text-xs text-slate-500 font-medium">Seluruh aktivitas peresepan, verifikasi apoteker, dispensing, rekonsiliasi, saksi narkotika, dan intervensi dicatat secara immutable lengkap dengan Timestamp, User ID, Role, &amp; IP Device.</p>
        </div>
      )}

    </div>
  );
}
