import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function ClinicalSafetyCommandStudio() {
  const safety = executiveCommandCenterService.getClinicalSafetyMetrics();

  return (
    <div className="space-y-6">
      {/* 4 Core Patient Safety Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Insiden Obat High-Alert</span>
          <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {safety.highAlertMedicationIncidents} Kasus
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Target Zero-Harm (JCI MMU)
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Eskalasi Nilai Kritis Lab</span>
          <p className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400 mt-1">
            {safety.criticalLabPanicEscalations} Hasil
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 inline-block">
            Respon SLA 100% (&lt;15 Menit)
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Reaksi Transfusi Darah</span>
          <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {safety.transfusionAdverseReactions} Kasus
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Verifikasi 2-Ners Bedside
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Infeksi Rumah Sakit (HAI)</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {safety.hospitalAcquiredInfectionRate}%
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar JCI: &lt; 0.5%
          </span>
        </div>
      </div>

      {/* JCI Quality & Patient Safety Scorecard */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-teal-500/20 text-teal-400">
            <span className="material-symbols-outlined text-3xl">verified</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              JCI Clinical Quality & Patient Safety Index (QPS)
            </span>
            <p className="text-3xl font-black font-mono text-teal-400 mt-0.5">{safety.jciPatientSafetyScore}%</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Tingkat kepatuhan terhadap 6 Sasaran Keselamatan Pasien (SKP / IPSG) Rumah Sakit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="px-3 py-1.5 rounded-xl bg-teal-900/50 text-teal-300 border border-teal-700">
            Readmission 30-Hari: {safety.readmissionRate30Days}%
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            Komplikasi Pasca-Bedah: {safety.postoperativeComplicationRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
