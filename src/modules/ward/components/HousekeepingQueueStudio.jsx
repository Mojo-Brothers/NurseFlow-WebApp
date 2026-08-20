import React, { useState } from 'react';
import toast from 'react-hot-toast';

const INITIAL_QUEUE = [
  { id: 'TASK-HK-01', bedCode: 'PAV-103', wardName: 'Paviliun Melati', state: 'DISCHARGED_DIRTY', dischargedAt: '10 Mnt lalu' },
  { id: 'TASK-HK-02', bedCode: 'ICU-02', wardName: 'ICU Isolasi', state: 'CLEANING_IN_PROGRESS', dischargedAt: '25 Mnt lalu' }
];

export default function HousekeepingQueueStudio() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);

  const handleStartCleaning = (bedCode) => {
    try {
      setQueue(prev => prev.map(q => q.bedCode === bedCode ? { ...q, state: 'CLEANING_IN_PROGRESS' } : q));
      toast.success(`Pembersihan Bed ${bedCode} dimulai.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCompleteCleaning = (bedCode) => {
    try {
      setQueue(prev => prev.filter(q => q.bedCode !== bedCode));
      toast.success(`Bed ${bedCode} selesai dibersihkan dan siap pakai (AVAILABLE)!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Antrean Pembersihan & Sanitasi Tempat Tidur (Housekeeping)
          </h3>
          <p className="text-[11px] text-slate-500">
            Daftar tempat tidur kotor (DIRTY) setelah pemulangan pasien yang memerlukan disinfeksi sebelum siap digunakan kembali.
          </p>
        </div>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full font-bold text-xs">
          {queue.length} Bed Dalam Antrean
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queue.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{item.bed_code}</span>
                <p className="text-xs text-slate-500">{item.ward_name}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                item.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : item.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <p>Dilaporkan: <strong className="text-slate-800 dark:text-slate-200">{new Date(item.reported_at).toLocaleTimeString()}</strong></p>
              {item.housekeeper_name && <p>Petugas: <strong className="text-slate-800 dark:text-slate-200">{item.housekeeper_name}</strong></p>}
            </div>

            <div className="pt-1">
              {item.status === 'PENDING_CLEANING' ? (
                <button
                  onClick={() => handleStartCleaning(item.bed_code)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Mulai Disinfeksi
                </button>
              ) : item.status === 'IN_PROGRESS' ? (
                <button
                  onClick={() => handleCompleteCleaning(item.bed_code)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Tandai Selesai & Siap Pakai
                </button>
              ) : (
                <span className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center">
                  Telah Siap Pakai
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
