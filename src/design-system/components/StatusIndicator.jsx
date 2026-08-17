import React from 'react';

export default function StatusIndicator({
  type = 'NORMAL', // 'CRITICAL' | 'WARNING' | 'NORMAL' | 'INFO' | 'COMPLETED'
  label,
  pulse = false
}) {
  const getStyles = () => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'WARNING':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'INFO':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'COMPLETED':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      case 'NORMAL':
      default:
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-mono font-bold text-[10px] tracking-wide uppercase ${getStyles()} ${pulse ? 'animate-pulse' : ''}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{label}</span>
    </span>
  );
}
