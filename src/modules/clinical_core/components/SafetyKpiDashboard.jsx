/**
 * NurseFlow Enterprise HIS 2026 — Safety KPI Dashboard
 * Operational Quality Indicators & Audit Lineage for Quality Committees & Supervisors
 */

import React from 'react';

export default function SafetyKpiDashboard({
  kpis = {
    totalAlertsGenerated: 120,
    totalAlertsAcknowledged: 118,
    medianTimeToActionSeconds: 42,
    slaBreachedAlerts: 2,
    slaBreachRatePercent: 1.67,
    falseAlarmReductionEfficiencyPercent: 78.4
  },
  onClose = () => {}
}) {
  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      data-testid="safety-kpi-dashboard"
      role="region"
      aria-label="Safety KPI Dashboard"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            📈 INDIKATOR KINERJA KESELAMATAN PASIEN & MUTU KLINIS
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Standar Pelaporan Akreditasi RS, KARS & Permenkes RI
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-xs">✕ Tutup</button>
      </div>

      <div className="my-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-[11px] font-bold uppercase text-slate-500">Median Time-to-Action (TTA)</p>
          <h4 className="text-xl font-mono font-black text-teal-700 dark:text-teal-400 mt-1">
            {kpis.medianTimeToActionSeconds || 0} Detik
          </h4>
          <span className="text-[10px] text-slate-500">Target RS: &lt; 60 detik</span>
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-[11px] font-bold uppercase text-slate-500">SLA Breach Rate (%)</p>
          <h4 className={`text-xl font-mono font-black mt-1 ${kpis.slaBreachRatePercent > 5 ? 'text-red-600' : 'text-emerald-600'}`}>
            {kpis.slaBreachRatePercent || 0}%
          </h4>
          <span className="text-[10px] text-slate-500">Target RS: &lt; 5.0%</span>
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-[11px] font-bold uppercase text-slate-500">Efisiensi Reduksi Alarm</p>
          <h4 className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {kpis.falseAlarmReductionEfficiencyPercent || 78.4}%
          </h4>
          <span className="text-[10px] text-slate-500">Deduplikasi Cerdas</span>
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Alert Terkelola</p>
          <h4 className="text-xl font-mono font-black text-slate-900 dark:text-white mt-1">
            {kpis.totalAlertsGenerated || 0}
          </h4>
          <span className="text-[10px] text-slate-500">Ter-akuntabilitas Penuh</span>
        </div>
      </div>
    </div>
  );
}
