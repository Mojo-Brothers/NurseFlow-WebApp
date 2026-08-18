import React, { useState, useEffect } from 'react';
import { hospitalFormularyService } from '../../../../server/services/hospitalFormulary.service.js';

export default function HospitalFormularyManagementStudio() {
  const [formularyList, setFormularyList] = useState([]);
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadFormulary = async () => {
    setIsLoading(true);
    try {
      const list = await hospitalFormularyService.getFormulary({
        tier: selectedTier === 'ALL' ? '' : selectedTier
      });
      setFormularyList(list || []);
    } catch (e) {
      console.error('Failed to load formulary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFormulary();
  }, [selectedTier]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/30">
            <span className="material-symbols-outlined text-[26px]">local_pharmacy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Hospital Formulary & Antibiotic Stewardship Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-black uppercase">
                JCI MMU.1 & KFT GOVERNANCE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kebijakan Restriksi Antibiotik Cadangan (Reserve), Tingkat Otorisasi Resep & Batas Hari Penggunaan
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'ALL', label: 'Semua Formularium' },
          { id: 'RESTRICTED_ANTIBIOTIC', label: '🔒 Restricted Antibiotic' },
          { id: 'FORMULARIUM_RS', label: '🟢 Formularium RS' },
          { id: 'GENERIK_NASIONAL', label: 'Generik Nasional (Fornas)' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedTier(f.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTier === f.id
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30 font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Formulary Table View */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/70 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Nama Obat & Sediaan</th>
              <th className="py-3.5 px-4">Klasifikasi Tier</th>
              <th className="py-3.5 px-4">Otorisasi Khusus</th>
              <th className="py-3.5 px-4">Max Hari</th>
              <th className="py-3.5 px-4">Panduan Stewardship Farmasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {formularyList.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-black text-slate-900 dark:text-white">{entry.drug?.genericName || entry.drugId}</div>
                  <div className="text-[11px] text-slate-400">{entry.drug?.brandName} • ATC: {entry.drug?.atcCode}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    entry.formularyTier === 'RESTRICTED_ANTIBIOTIC'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}>
                    {entry.formularyTier}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {entry.approvalLevelRequired}
                  </span>
                  {entry.requiresPharmacistApproval && (
                    <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                      Wajib Telaah Apoteker Klinis
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold">
                  {entry.maxPrescribingDays} Hari
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs">
                  {entry.clinicalStewardshipGuideline || 'Sesuai Pedoman Praktik Klinis (PPK) RS.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
