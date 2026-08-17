import React, { useState } from 'react';
import { casemixRevenueCycleEngineService } from '../../../../server/services/casemixRevenueCycleEngine.service.js';
import KpiCard from '../../../design-system/components/KpiCard.jsx';

export default function RevenueCycleAnalyticsStudio() {
  const [summary] = useState(() => casemixRevenueCycleEngineService.getHospitalFinancialSummary());

  const formatIdr = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">query_stats</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Hospital Revenue Cycle & Financial Health Analytics</h3>
            <p className="text-xs text-slate-400">
              Analisis Margin Klaim INA-CBG vs Biaya Riil Pelayanan & Recovery Rate Rumah Sakit
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 font-mono">
          Periode: Agustus 2026
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="account_balance_wallet"
          title="TOTAL REIMBURSEMENT INA-CBG"
          value={formatIdr(summary.totalReimbursementIdr)}
          subtext={`${summary.totalCasesCount} Kasus Casemix Terproses`}
          status="NORMAL"
        />

        <KpiCard
          icon="receipt_long"
          title="TOTAL BIAYA RIIL RUMAH SAKIT"
          value={formatIdr(summary.totalRealCostsIdr)}
          subtext="Itemized 7 Departemen Pelayanan"
          status="INFO"
        />

        <KpiCard
          icon="trending_up"
          title="MARGIN SURPLUS FINANSIAL"
          value={`+${formatIdr(summary.totalMarginIdr)}`}
          subtext={`Efisiensi Biaya +${summary.marginPercentage}%`}
          status="NORMAL"
          trend={`+${summary.marginPercentage}%`}
        />

        <KpiCard
          icon="warning"
          title="DISPUTE KLAIM PENDING"
          value={`${summary.activeDisputesCount} Berkas`}
          subtext="Memerlukan Klarifikasi Medis"
          status={summary.activeDisputesCount > 0 ? 'WARNING' : 'NORMAL'}
        />
      </div>

      {/* Departmental Cost Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
        <span className="font-black text-slate-900 dark:text-white">Kontribusi Biaya Riil per Departemen:</span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Kamar Bedah (IBS)</div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatIdr(4500000)}</div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Ruang Rawat & ICU</div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatIdr(2400000)}</div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Farmasi & Obat FEFO</div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatIdr(1250000)}</div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Darah (BDRS)</div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatIdr(1050000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
