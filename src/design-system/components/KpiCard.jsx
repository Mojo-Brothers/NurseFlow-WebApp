import React from 'react';

export default function KpiCard({
  icon,
  title,
  value,
  subtext,
  status = 'NORMAL', // 'CRITICAL' | 'WARNING' | 'NORMAL' | 'INFO'
  trend
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
        return 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300';
      case 'WARNING':
        return 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300';
      case 'INFO':
        return 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300';
      case 'NORMAL':
      default:
        return 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-xs transition-all flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{value}</div>
        {subtext && <p className="text-[11px] text-slate-400">{subtext}</p>}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${getStatusColor()}`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
        )}
        {trend && (
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
