import React, { useState } from 'react';
import { forensicAuditEcosystemService } from '../../../../../server/services/forensicAuditEcosystem.service.js';
import toast from 'react-hot-toast';

export default function HighRiskAccessDetectorStudio() {
  const [alerts, setAlerts] = useState(forensicAuditEcosystemService.getHighRiskAlerts());

  const handleResolveAlert = (id) => {
    const al = alerts.find(a => a.id === id);
    if (al) {
      al.status = 'RESOLVED';
      setAlerts([...alerts]);
      toast.success('Peringatan anomali telah diselesaikan dan diarsipkan.');
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Detektor Anomali & Akses Berisiko Tinggi (ISO 27001 ISMS)
          </h3>
          <p className="text-[11px] text-slate-500">
            Sistem heuristik pengawasan otomatis terhadap pola akses mencurigakan, pengunduhan massal, akses luar jam kerja, dan pelanggaran integritas data.
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full font-bold text-xs">
          {alerts.filter(a => a.status === 'UNRESOLVED').length} Anomali Aktif
        </span>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity} SEVERITY
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{alert.ruleName}</span>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(alert.timestamp).toLocaleTimeString('id-ID')} • {alert.actor}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {alert.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-bold text-slate-400 font-mono">Audit Ref: {alert.audit_log_id}</span>
              {alert.status === 'UNRESOLVED' ? (
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="px-3 py-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Tandai Ditinjau & Aman
                </button>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Telah Diinvestigasi
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
