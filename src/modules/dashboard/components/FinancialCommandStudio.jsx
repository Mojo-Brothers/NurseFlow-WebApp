import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function FinancialCommandStudio() {
  const fin = executiveCommandCenterService.getFinancialMetrics();

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* 4 Financial Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Pendapatan Hari Ini</span>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(fin.todayRevenue)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Bulan Berjalan: {formatRupiah(fin.monthlyRevenue)}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Klaim BPJS Disetujui</span>
          <p className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400 mt-1">
            {formatRupiah(fin.bpjsClaimsApproved)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Tertagih BPJS V-Claim 2.0</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Klaim Pending / Verifikasi</span>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatRupiah(fin.pendingClaims)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Dalam Proses Casemix Grouper</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Tingkat Penolakan Klaim</span>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {fin.rejectionRate}%
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar: &lt; 3.0% (Optimal)
          </span>
        </div>
      </div>

      {/* Top Revenue Centers Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Kontribusi Pendapatan per Instalasi (Cost / Revenue Centers)
          </h4>

          <div className="space-y-3">
            {fin.topRevenueCenters.map((center, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{center.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(center.revenue)} ({center.share})</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: center.share }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Efficiency Indicators */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Efisiensi Siklus Pendapatan
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">Kecepatan pemrosesan penagihan klaim asuransi.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Rata-Rata Waktu Proses Klaim</span>
              <p className="text-xl font-black font-mono text-slate-900 dark:text-white">{fin.avgClaimProcessingDays} Hari</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ketepatan Koding INA-CBG 6.0</span>
              <p className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">{fin.inaCbgGroupingEfficiency}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
