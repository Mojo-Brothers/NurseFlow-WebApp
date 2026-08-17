import React, { useState } from 'react';
import { forensicAuditEcosystemService } from '../../../../../server/services/forensicAuditEcosystem.service.js';

export default function AuditLedgerExplorerStudio() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const queryResult = forensicAuditEcosystemService.queryLedger({
    search,
    action: actionFilter,
    moduleName: moduleFilter
  });

  const handleInspectSnapshot = (logId) => {
    const snap = forensicAuditEcosystemService.getSnapshotForLog(logId);
    setSelectedSnapshot(snap);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari user, MRN pasien, entitas, atau alasan mutasi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Aksi Mutasi</option>
            <option value="CREATE">CREATE (Pencatatan)</option>
            <option value="UPDATE">UPDATE (Perubahan)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
            <option value="BREAK_THE_GLASS">BREAK_THE_GLASS (Akses Darurat)</option>
            <option value="EXPORT">EXPORT (Unduh Data)</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Modul SIMRS</option>
            <option value="EMR">EMR / SOAP CPPT</option>
            <option value="PHARMACY">Farmasi & eMAR</option>
            <option value="LABORATORY">Laboratorium (LIS)</option>
            <option value="EMERGENCY">IGD / Emergensi</option>
            <option value="BILLING">Billing & Casemix</option>
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500 font-mono">
          Total Log: <strong>{queryResult.total}</strong>
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-3 px-3.5">Waktu & Hash ID</th>
                <th className="py-3 px-3.5">Pelaksana (Nakes / Role)</th>
                <th className="py-3 px-3.5">Modul & Aksi</th>
                <th className="py-3 px-3.5">Pasien & MRN</th>
                <th className="py-3 px-3.5">Justifikasi Klinis / Alasan</th>
                <th className="py-3 px-3.5 text-center">Snapshot Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {queryResult.logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-slate-900 dark:text-white font-bold text-[11px]">
                      {new Date(log.performed_at).toLocaleTimeString('id-ID')}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">{log.signature_hash.substring(0, 16)}...</p>
                  </td>

                  <td className="py-3 px-3.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{log.performed_by}</p>
                    <p className="text-[10px] text-slate-400">{log.user_role}</p>
                  </td>

                  <td className="py-3 px-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                      log.action === 'BREAK_THE_GLASS' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300' :
                      log.action === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                      log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{log.module_name}</p>
                  </td>

                  <td className="py-3 px-3.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{log.patient_name || '-'}</p>
                    <p className="font-mono text-[10px] text-slate-400">{log.patient_mrn || '-'}</p>
                  </td>

                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {log.reason || '-'}
                  </td>

                  <td className="py-3 px-3.5 text-center">
                    {log.has_snapshot ? (
                      <button
                        onClick={() => handleInspectSnapshot(log.id)}
                        className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-lg text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                      >
                        Lihat Diff
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Delta Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400">difference</span>
                <h3 className="font-bold text-sm">Inspeksi Delta Snapshot Forensik</h3>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-rose-600 block mb-2">BEFORE (Data Sebelum Mutasi):</span>
                  <pre className="text-[11px] text-slate-700 dark:text-slate-300 overflow-auto max-h-60">
                    {JSON.stringify(selectedSnapshot.before_snapshot, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-2">AFTER (Data Sesudah Mutasi):</span>
                  <pre className="text-[11px] text-slate-700 dark:text-slate-300 overflow-auto max-h-60">
                    {JSON.stringify(selectedSnapshot.after_snapshot, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-[11px] text-teal-800 dark:text-teal-300">
                Atribut Terdampak: <strong>{selectedSnapshot.diff_summary?.changedKeys?.join(', ') || 'Seluruh Payload'}</strong>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Inspektor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
