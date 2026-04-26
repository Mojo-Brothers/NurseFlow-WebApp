import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAuditLogs } from '../../../core/services/audit.service.js';
import { useTranslation } from 'react-i18next';

export default function AuditTrailModal({ patient, onClose }) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (patient?.id) {
      fetchLogs();
    }
  }, [patient]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getAuditLogs(patient.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase block mb-1">
              JCI Compliance Module
            </span>
            <h2 className="text-2xl font-black tracking-tight text-on-surface">
              Riwayat Audit Pasien
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="patient-mini-card mb-6 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black opacity-40 uppercase">Pasien</span>
            <span className="text-lg font-black">{patient?.name}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-black opacity-40 uppercase">MRN</span>
            <span className="text-sm font-mono font-bold text-primary">{patient?.mrn}</span>
          </div>
        </div>

        <div className="audit-timeline max-h-[400px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="py-12 text-center opacity-40">Memuat log audit...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">history</span>
              <p className="text-sm opacity-40">Belum ada riwayat perubahan data.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {logs.map((log) => (
                <div key={log.id} className="audit-item flex gap-4 p-4 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-primary">
                        {log.action === 'CREATE' ? 'add_circle' : 
                         log.action === 'UPDATE' ? 'edit' : 
                         log.action === 'DELETE' ? 'delete' : 'visibility'}
                      </span>
                    </div>
                    <div className="w-px h-full bg-outline-variant/30 mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-on-surface uppercase tracking-wider">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-bold opacity-40">
                        {log.timestamp ? format(log.timestamp.toDate(), 'dd MMM yyyy, HH:mm') : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-2">
                      {log.reason || 'Akses rutin data pasien'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] opacity-40">person</span>
                      <span className="text-[10px] font-bold opacity-60 uppercase">{log.user}</span>
                    </div>
                    
                    {log.delta && Object.keys(log.delta).length > 0 && (
                      <div className="mt-3 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                        <span className="text-[9px] font-black opacity-30 uppercase block mb-1">Perubahan</span>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(log.delta).map(([key, val]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-[9px] font-bold opacity-50 uppercase">{key}</span>
                              <span className="text-[10px] font-mono truncate">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="btn-primary px-8">
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
}
