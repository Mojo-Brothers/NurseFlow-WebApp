import React, { useState } from 'react';
import { casemixRevenueCycleEngineService } from '../../../../server/services/casemixRevenueCycleEngine.service.js';
import toast from 'react-hot-toast';

export default function CasemixClaimsQueueStudio({ onSelectCase }) {
  const [cases, setCases] = useState(() => casemixRevenueCycleEngineService.getAllCases());
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredCases = filterStatus === 'ALL'
    ? cases
    : cases.filter(c => c.caseStatus === filterStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY_FOR_GROUPING':
        return <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">SIAP GROUPING</span>;
      case 'VERIFIED_INTERNAL':
        return <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">TERVERIFIKASI RS</span>;
      case 'SUBMITTED_BPJS':
        return <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">DIAJUKAN KE BPJS</span>;
      case 'APPROVED_PAID':
        return <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">LUNAS DIBAYAR</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] animate-pulse">DISPUTE BPJS ⚠️</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold text-[10px]">{status}</span>;
    }
  };

  const handleQuickSubmit = (caseId, sepNumber) => {
    try {
      casemixRevenueCycleEngineService.submitBpjsClaim({ caseId, sepNumber });
      setCases([...casemixRevenueCycleEngineService.getAllCases()]);
      toast.success(`Klaim SEP ${sepNumber} Berhasil Diajukan ke BPJS V-Claim 2.0!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header & Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#015C80]/10 text-[#015C80] dark:text-cyan-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Antrean Klaim Casemix & Verifikasi Berkas</h3>
            <p className="text-xs text-slate-400">
              Validasi Resume Medis, ICD-10/ICD-9 & Status Pengajuan BPJS V-Claim
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
          {['ALL', 'READY_FOR_GROUPING', 'VERIFIED_INTERNAL', 'SUBMITTED_BPJS', 'DISPUTED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-white dark:bg-slate-900 text-[#015C80] dark:text-cyan-400 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Cases */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono text-[11px]">
              <th className="py-2.5 px-3">NO. SEP & PASIEN</th>
              <th className="py-2.5 px-3">DIAGNOSIS UTAMA (ICD-10)</th>
              <th className="py-2.5 px-3">PROSEDUR (ICD-9)</th>
              <th className="py-2.5 px-3">LOS</th>
              <th className="py-2.5 px-3">STATUS CASEMIX</th>
              <th className="py-2.5 px-3 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredCases.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-mono font-bold text-[#015C80] dark:text-cyan-400">{c.sepNumber}</div>
                  <div className="font-black text-slate-900 dark:text-white">{c.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.patientMrn}</div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{c.primaryIcd10.code}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{c.primaryIcd10.description}</div>
                </td>
                <td className="py-3 px-3">
                  {c.icd9Procedures.length > 0 ? (
                    c.icd9Procedures.map((p, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 mr-1">
                        {p.code}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">Non-Bedah</span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {c.lengthOfStayDays} Hari
                </td>
                <td className="py-3 px-3">
                  {getStatusBadge(c.caseStatus)}
                </td>
                <td className="py-3 px-3 text-right space-x-1">
                  <button
                    onClick={() => onSelectCase(c)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                  >
                    Buka Grouper
                  </button>
                  {c.caseStatus === 'VERIFIED_INTERNAL' && (
                    <button
                      onClick={() => handleQuickSubmit(c.id, c.sepNumber)}
                      className="px-3 py-1.5 rounded-xl bg-[#015C80] hover:bg-[#014460] text-white font-bold text-[11px] cursor-pointer"
                    >
                      Kirim V-Claim
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
