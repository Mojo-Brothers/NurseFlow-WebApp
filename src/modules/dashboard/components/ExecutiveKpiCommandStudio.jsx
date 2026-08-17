import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function ExecutiveKpiCommandStudio() {
  const kpi = executiveCommandCenterService.getExecutiveKpis();

  return (
    <div className="space-y-6">
      {/* 4 Hospital Master KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Net Death Rate (NDR)</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{kpi.ndr} ‰</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar Kemenkes: &lt; 25 ‰
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Gross Death Rate (GDR)</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{kpi.gdr} ‰</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar Kemenkes: &lt; 45 ‰
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Kepuasan Pasien (Survei)</span>
          <p className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400 mt-1">{kpi.patientSatisfactionScore}%</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 inline-block">
            Target Mutu &gt; 90%
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Sinkronisasi SATUSEHAT</span>
          <p className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">{kpi.satusehatSyncRate}%</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 inline-block">
            Kemenkes DTO Gateway
          </span>
        </div>
      </div>

      {/* Staffing & Digital Adoption Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Rasio Perawat : Pasien (Rawat Inap)</span>
            <p className="text-[11px] text-slate-500">Standar JCI General Ward</p>
          </div>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{kpi.nurseToPatientRatioGeneral}</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Rasio Perawat : Pasien (ICU/ICCU)</span>
            <p className="text-[11px] text-slate-500">Standar Perawatan Intensif 1:1</p>
          </div>
          <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{kpi.nurseToPatientRatioIcu}</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Tingkat Adopsi RME Tanpa Kertas</span>
            <p className="text-[11px] text-slate-500">Permenkes 24/2022 Full Paperless</p>
          </div>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{kpi.eRmeAdoptionRate}%</span>
        </div>
      </div>
    </div>
  );
}
