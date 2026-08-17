import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';

export default function AuditTrailWorkspace() {
  const { auditLogs } = useEnterpriseMasterStore();
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  return (
    <div className="space-y-6">
      
      {/* ─── Governance Banner ─── */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[26px]">policy</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                JCI IMMUTABLE AUDIT LOG
              </span>
              <span className="text-[10px] font-bold text-slate-400">Event Sourcing & JSONB Diff</span>
            </div>
            <h3 className="text-lg font-headline font-black">Pusat Jejak Audit & Kepatuhan Medis</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:ring-primary"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SOFT_DELETE">SOFT_DELETE</option>
            <option value="RESTORE">RESTORE</option>
          </select>
        </div>
      </div>

      {/* ─── 2-Column Split: Log Timeline + Visual JSONB Diff ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Timeline Events */}
        <div className="lg:col-span-6 space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs">
              Belum ada mutasi data master yang tercatat dalam audit stream.
            </div>
          ) : (
            filteredLogs.map(log => {
              const isSelected = selectedLog?.id === log.id;
              const isCreate = log.action === 'CREATE';
              const isUpdate = log.action === 'UPDATE';
              const isDelete = log.action === 'SOFT_DELETE';
              const isRestore = log.action === 'RESTORE';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-surface-container-highest border-primary/40 shadow-md ring-2 ring-primary/20'
                      : 'bg-surface-container-high border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      isCreate
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : isUpdate
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : isDelete
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-on-surface">
                    {log.action_summary || `${log.action} pada ${log.entity_name}`}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono pt-2 border-t border-outline-variant/20">
                    <span>Aktor: <strong>{log.user_email}</strong></span>
                    <span>{log.diffs?.length || 0} Field Diubah</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Visual Diff Inspector */}
        <div className="lg:col-span-6">
          {selectedLog ? (
            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <h4 className="text-sm font-headline font-black text-on-surface">
                    Visualisasi Perubahan Data (JSONB Diff)
                  </h4>
                  <p className="text-xs text-on-surface-variant font-mono">
                    ID: {selectedLog.id} &bull; Entitas: <strong>{selectedLog.entity_name}</strong>
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  {selectedLog.action}
                </span>
              </div>

              {/* Diffs List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                {selectedLog.diffs && selectedLog.diffs.length > 0 ? (
                  selectedLog.diffs.map((d, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-on-surface">
                        <span className="font-mono text-primary uppercase text-[11px]">{d.field}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                          d.type === 'ADDED' ? 'bg-emerald-500/10 text-emerald-600' : d.type === 'REMOVED' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {d.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-rose-500/5 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          <span className="block text-[9px] font-black uppercase text-rose-500">Nilai Sebelum (Old):</span>
                          <span className="break-words">{typeof d.oldValue === 'object' ? JSON.stringify(d.oldValue) : String(d.oldValue)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <span className="block text-[9px] font-black uppercase text-emerald-500">Nilai Sesudah (New):</span>
                          <span className="break-words">{typeof d.newValue === 'object' ? JSON.stringify(d.newValue) : String(d.newValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-surface-container text-xs text-on-surface-variant text-center">
                    Tidak ada perbedaan field spesifik yang terdeteksi (Inisialisasi dasar).
                  </div>
                )}
              </div>

              {/* Metadata Info */}
              <div className="p-3 rounded-xl bg-surface-container text-[11px] text-on-surface-variant font-mono space-y-1">
                <div>Alamat IP: <strong>{selectedLog.ip_address}</strong></div>
                <div>Perangkat: <strong>{selectedLog.device}</strong></div>
                <div>Waktu Server: <strong>{selectedLog.timestamp}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant rounded-3xl bg-surface-container-high border border-outline-variant/30 text-xs">
              Pilih salah satu event log audit di sebelah kiri untuk melihat perbandingan snapshot *Before vs After*.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
