import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function CapacityCommandStudio() {
  const cap = executiveCommandCenterService.getCapacityMetrics();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Core Barber-Johnson Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">BOR (Tingkat Hunian)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(cap.borStatus)}`}>
              {cap.borStatus}
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{cap.bor}%</p>
          <p className="text-[11px] text-slate-500 font-medium">Standar Kemenkes: 60 - 85%</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">ALOS (Lama Rawat)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(cap.alosStatus)}`}>
              {cap.alosStatus}
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{cap.alos} Hari</p>
          <p className="text-[11px] text-slate-500 font-medium">Standar Kemenkes: 3 - 6 Hari</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">TOI (Tenggang Kosong)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(cap.toiStatus)}`}>
              {cap.toiStatus}
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{cap.toi} Hari</p>
          <p className="text-[11px] text-slate-500 font-medium">Standar Kemenkes: 1 - 3 Hari</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">BTO (Perputaran Bed)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(cap.btoStatus)}`}>
              {cap.btoStatus}
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{cap.bto} Kali</p>
          <p className="text-[11px] text-slate-500 font-medium">Standar: 40 - 50 Kali / Tahun</p>
        </div>
      </div>

      {/* Inpatient & ICU Capacity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Inpatient Bed Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-base">hotel</span>
            Okupansi Ruang Rawat Inap
          </h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {cap.occupiedBeds} / {cap.totalBeds}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Tempat Tidur Terisi</span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {cap.availableBeds} Kosong (Siap Pakai)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${cap.bor}%` }}></div>
          </div>
        </div>

        {/* ICU Capacity Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">vital_signs</span>
            Intensive Care Unit (ICU/ICCU)
          </h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {cap.icu.occupied} / {cap.icu.total}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Okupansi ICU ({cap.icu.bor}%)</span>
            </div>
            <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
              {cap.icu.available} Bed Tersisa
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cap.icu.bor}%` }}></div>
          </div>
        </div>

        {/* Isolation Bed Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 text-base">masks</span>
            Ruang Isolasi Tekanan Negatif
          </h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {cap.isolation.occupied} / {cap.isolation.total}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Okupansi Isolasi ({cap.isolation.bor}%)</span>
            </div>
            <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
              {cap.isolation.available} Bed Tersisa
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${cap.isolation.bor}%` }}></div>
          </div>
        </div>
      </div>

      {/* Patient Flow Dynamics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Admisi Hari Ini (Masuk)</span>
          <span className="text-lg font-black font-mono text-teal-600 dark:text-teal-400">+{cap.todayAdmissions} Pasien</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Pemulangan Hari Ini (Discharge)</span>
          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">-{cap.todayDischarges} Pasien</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Transfer Dalam Antrean</span>
          <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{cap.transferPending} Pasien</span>
        </div>
      </div>
    </div>
  );
}
