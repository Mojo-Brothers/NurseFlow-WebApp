/**
 * MedicationMasterWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Medication Master, Formulary Management, & Clinical Protocols
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Pill, FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  Search, Filter, Plus, Tag, Layers, Thermometer, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MedicationMasterWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState('MASTER'); // MASTER, FORMULARY, PROTOCOLS
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Medication Catalog Data
  const MEDICATIONS = [
    { code: 'OBAT-PAR-001', genericName: 'Paracetamol', brandName: 'Sanmol / Pyrexin', form: 'Tablet 500mg', route: 'PO (Oral)', class: 'Analgesik & Antipiretik', formulary: 'FORMULARIUM_RS_BPJS', highAlert: false, lasa: false, maxDose: '4000 mg / Hari', status: 'ACTIVE' },
    { code: 'OBAT-AMX-500', genericName: 'Amoxicillin', brandName: 'Amoxsan 500mg', form: 'Kaplet 500mg', route: 'PO (Oral)', class: 'Antibiotik Penisilin', formulary: 'FORMULARIUM_RS_BPJS', highAlert: false, lasa: false, maxDose: '3000 mg / Hari', status: 'ACTIVE' },
    { code: 'OBAT-INS-001', genericName: 'Insulin Glargine', brandName: 'Lantus SoloStar', form: 'Pen 100 IU/ml', route: 'SC (Subkutan)', class: 'Antidiabetes Insulin', formulary: 'RESTRICTED_SPECIALIST', highAlert: true, lasa: true, maxDose: 'Dosis Individual (Weight-Based)', status: 'ACTIVE' },
    { code: 'OBAT-FNT-001', genericName: 'Fentanyl', brandName: 'Fentanyl Inj', form: 'Ampul 0.05mg/ml', route: 'IV (Intravena)', class: 'Analgesik Opioid (Narkotika)', formulary: 'RESTRICTED_SPECIALIST', highAlert: true, lasa: false, maxDose: 'STAT Protocol OK', status: 'ACTIVE' }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
            <Pill size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                AUTHORITATIVE MEDICATION CATALOG
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI MMU.1 &amp; BPOM Registrasi</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Medication Master, Formularium RS, &amp; Protokol Dosis Klinis
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('MASTER')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'MASTER' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Medication Master
          </button>
          <button 
            onClick={() => setActiveSubTab('FORMULARY')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'FORMULARY' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Formularium RS / BPJS
          </button>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Cari Generik, Brand, Kode Obat, Kelas Terapi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <button 
          onClick={() => toast.success('Modal Tambah Sediaan Obat Master Baru dibuka!')}
          className="px-4 py-2.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Tambah Master Obat Baru</span>
        </button>
      </div>

      {/* CATALOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Pill className="text-[#007399]" size={18} />
            Katalog Sediaan Farmasi Terdaftar ({MEDICATIONS.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode &amp; Nama Generik</th>
                <th className="py-3.5 px-4">Brand / Dagang</th>
                <th className="py-3.5 px-4">Bentuk &amp; Rute</th>
                <th className="py-3.5 px-4">Kelas Terapi</th>
                <th className="py-3.5 px-4 text-center">Status Formularium</th>
                <th className="py-3.5 px-4 text-center">Safety Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {MEDICATIONS.map((med, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono text-[#007399] font-black block">{med.code}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{med.genericName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {med.brandName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800 dark:text-slate-100 block">{med.form}</span>
                    <span className="text-[9px] text-slate-400 block">Rute: {med.route}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                    {med.class}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {med.formulary}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center space-x-1">
                    {med.highAlert && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500 text-white">HIGH ALERT</span>
                    )}
                    {med.lasa && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500 text-white">LASA</span>
                    )}
                    {!med.highAlert && !med.lasa && <span className="text-[10px] text-slate-400 font-normal">Standard</span>}
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
