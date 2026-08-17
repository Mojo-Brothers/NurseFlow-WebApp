import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';
import toast from 'react-hot-toast';

export default function ExecutiveAlertCenter() {
  const alerts = executiveCommandCenterService.evaluateExecutiveAlerts();

  const handleExecuteCommand = (actionLabel) => {
    toast.success(`Perintah Eksekutif Dijalankan: "${actionLabel}". Instruksi telah diteruskan ke kepala instalasi terkait.`);
  };

  const getAlertStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
      case 'WARNING':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
      default:
        return 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-100';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Pusat Peringatan & Pengambilan Keputusan Eksekutif (Command Action Center)
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Evaluasi Heuristik Realtime
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${getAlertStyle(alert.level)}`}
          >
            <div className="flex items-start gap-3 flex-1">
              <span className="material-symbols-outlined text-2xl mt-0.5 shrink-0">
                {alert.level === 'CRITICAL' ? 'emergency' : alert.level === 'WARNING' ? 'warning' : 'verified'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">{alert.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-black/10 dark:bg-white/10 uppercase font-black">
                    {alert.category}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-1 leading-relaxed">{alert.message}</p>
              </div>
            </div>

            {alert.actionLabel && (
              <button
                onClick={() => handleExecuteCommand(alert.actionLabel)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-98"
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
