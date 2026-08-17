import React, { useState } from 'react';
import { casemixRevenueCycleEngineService } from '../../../../server/services/casemixRevenueCycleEngine.service.js';
import toast from 'react-hot-toast';

export default function InaCbgGroupingStudio({ selectedCase }) {
  const [hospitalClass, setHospitalClass] = useState('B');
  const [groupingResult, setGroupingResult] = useState(() => {
    if (selectedCase) {
      try {
        return casemixRevenueCycleEngineService.performInaCbgGrouping({
          caseId: selectedCase.id,
          hospitalClass: 'B'
        });
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleRunGrouping = () => {
    if (!selectedCase) {
      toast.error('Pilih kasus dari antrean terlebih dahulu!');
      return;
    }

    try {
      const res = casemixRevenueCycleEngineService.performInaCbgGrouping({
        caseId: selectedCase.id,
        hospitalClass
      });
      setGroupingResult(res);
      toast.success(`INA-CBG Grouping Berhasil! Kode CBG: ${res.cbgCode}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatIdr = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">calculate</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">INA-CBG 6.0 Grouper & Dynamic Tariff Engine</h3>
            <p className="text-xs text-slate-400">
              Perhitungan Tarif Paket Berbasis ICD-10, ICD-9 & Analisis Margin Biaya Riil RS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-600 dark:text-slate-400">Kelas RS:</label>
          <select
            value={hospitalClass}
            onChange={(e) => setHospitalClass(e.target.value)}
            className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs"
          >
            <option value="A">RSUP Kelas A (1.15x)</option>
            <option value="B">RSUD Kelas B (1.00x)</option>
            <option value="C">RS Kelas C (0.88x)</option>
            <option value="D">RS Kelas D (0.76x)</option>
          </select>

          <button
            onClick={handleRunGrouping}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Jalankan Grouper
          </button>
        </div>
      </div>

      {selectedCase ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Clinical Coding Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-black text-slate-900 dark:text-white">Input Data Rekam Medis (Koding Klinis):</span>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">Pasien & No. SEP:</label>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedCase.patientName} ({selectedCase.patientMrn})
              </div>
              <div className="font-mono text-[#015C80] dark:text-cyan-400 text-xs font-black">
                SEP: {selectedCase.sepNumber}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">Diagnosis Utama (Primary ICD-10):</label>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-[#015C80] dark:text-cyan-400 mr-2">{selectedCase.primaryIcd10.code}</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedCase.primaryIcd10.description}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">Prosedur / Tindakan (ICD-9-CM):</label>
              <div className="space-y-1">
                {selectedCase.icd9Procedures.map((p, i) => (
                  <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
                    <span className="font-mono font-bold text-indigo-600 mr-2">{p.code}</span>
                    <span className="text-slate-700 dark:text-slate-300">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Grouping Result & Financial Margin Analysis */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 pb-2">
                <span className="font-black text-indigo-900 dark:text-indigo-300">Hasil Grouping & Tarif Klaim BPJS</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-black text-[11px]">
                  {groupingResult ? groupingResult.cbgCode : 'BELUM DI-GROUP'}
                </span>
              </div>

              {groupingResult ? (
                <div className="mt-3 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {groupingResult.cbgDescription}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tarif Klaim INA-CBG</div>
                      <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatIdr(groupingResult.tariffFinalIdr)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Biaya Riil Rumah Sakit</div>
                      <div className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                        {formatIdr(groupingResult.realHospitalCostIdr)}
                      </div>
                    </div>
                  </div>

                  {/* Profit / Loss Margin */}
                  <div className={`p-3 rounded-xl border font-mono flex items-center justify-between ${
                    groupingResult.marginProfitLossIdr >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span className="font-bold">Margin Surplus / Defisit RS:</span>
                    <span className="font-black text-sm">
                      {groupingResult.marginProfitLossIdr >= 0 ? '+' : ''}{formatIdr(groupingResult.marginProfitLossIdr)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Tekan 'Jalankan Grouper' untuk menghasilkan kode INA-CBG dan kalkulasi margin biaya riil.
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-400 text-right">
              Versi Grouper: INA-CBG 6.0 (Permenkes No. 3/2023)
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400">
          Pilih salah satu kasus rekam medis dari tab 'Daftar Klaim' untuk memulai simulasi grouping INA-CBG.
        </div>
      )}
    </div>
  );
}
