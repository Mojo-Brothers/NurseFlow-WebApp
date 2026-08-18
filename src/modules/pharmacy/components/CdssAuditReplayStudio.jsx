import React, { useState, useEffect } from 'react';
import { cdssReplayEngineService } from '../../../../server/services/cdssReplayEngine.service.js';

export default function CdssAuditReplayStudio({ encounterId = 'ENC-TEST-001' }) {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [replayReport, setReplayReport] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);

  const loadAuditHistory = async () => {
    try {
      const records = await cdssReplayEngineService.getAuditTrailForEncounter(encounterId);
      setExecutions(records || []);
    } catch (e) {
      console.error('Failed to load CDSS audit history:', e);
    }
  };

  useEffect(() => {
    loadAuditHistory();
  }, [encounterId]);

  const handleExecuteReplay = async (execId) => {
    setIsReplaying(true);
    try {
      const report = await cdssReplayEngineService.replayExecution(execId);
      setReplayReport(report);
    } catch (err) {
      alert('Gagal mengeksekusi replay CDSS: ' + err.message);
    } finally {
      setIsReplaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <span className="material-symbols-outlined text-[26px]">history_edu</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                CDSS Audit Trail & Medicolegal Replay Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase">
                DETERMINISTIC JCI REPLAY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Rekonstruksi Keputusan Keselamatan Klinis Historis Berbasis Snapshot & Versi Aturan
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Execution History */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Riwayat Snapshot Evaluasi CDSS ({executions.length})
          </h3>
          {executions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Belum ada data eksekusi CDSS untuk encounter ini.
            </div>
          ) : (
            executions.map((e) => (
              <div
                key={e.id}
                onClick={() => { setSelectedExecution(e); handleExecuteReplay(e.id); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedExecution?.id === e.id
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {e.medicationId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    e.evaluationResult === 'HARD_STOPPED'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : e.evaluationResult === 'WARNING_OVERRIDDEN'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {e.evaluationResult}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono">
                  Waktu: {new Date(e.executedAt).toLocaleString('id-ID')}
                </div>
                {e.overrideJustification && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    Justifikasi: "{e.overrideJustification}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Replay Comparison Cockpit */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Hasil Komparasi Replay Medikolegal
          </h3>
          {replayReport ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Status Determinisme Replay:
                  </h4>
                  <p className="text-xs text-slate-500">
                    Eksekusi Ulang Mesin Aturan Menggunakan Snapshot Historis
                  </p>
                </div>
                {replayReport.isDeterministicMatch ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    100% MATCH (SAH HUKUM)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-700 text-xs font-black">
                    MISMATCH
                  </span>
                )}
              </div>

              {/* Snapshot Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Snapshot Output Asli</span>
                  <pre className="text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(replayReport.originalOutputSnapshot, null, 2)}
                  </pre>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Hasil Evaluasi Replay Baru</span>
                  <pre className="text-[11px] text-emerald-700 dark:text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(replayReport.replayedResult.alerts, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              Pilih salah satu snapshot eksekusi di sebelah kiri untuk memverifikasi replay.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
