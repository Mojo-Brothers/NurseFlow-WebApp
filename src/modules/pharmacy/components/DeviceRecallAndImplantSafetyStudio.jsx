import React, { useState } from 'react';
import { implantRecallEngineService } from '../../../../server/services/implantRecallEngine.service.js';
import toast from 'react-hot-toast';

export default function DeviceRecallAndImplantSafetyStudio() {
  const [recalls, setRecalls] = useState(() => implantRecallEngineService.getAllRecalls());
  const [manufacturer, setManufacturer] = useState('DePuy Synthes Medical');
  const [deviceModel, setDeviceModel] = useState('Distal Radius Locking Plate 3.5mm');
  const [lotNumber, setLotNumber] = useState('LOT-8823');
  const [recallReason, setRecallReason] = useState('Potensi kelemahan mikrostruktural pada ulir sekrup pengunci batch 2026');
  const [activeRecall, setActiveRecall] = useState(null);

  const handleInitiateRecall = (e) => {
    e.preventDefault();
    try {
      const newRecall = implantRecallEngineService.initiateRecall({
        manufacturer,
        deviceModel,
        lotNumberRecalled: lotNumber,
        recallReason
      });

      setRecalls(implantRecallEngineService.getAllRecalls());
      setActiveRecall(newRecall);
      toast.error(`Peringatan Recall Diterbitkan! Ditemukan ${newRecall.affectedPatientsCount} pasien terdampak.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleNotifyPatients = (recallId) => {
    try {
      const updated = implantRecallEngineService.notifyAllAffectedPatients(recallId);
      setRecalls([...implantRecallEngineService.getAllRecalls()]);
      setActiveRecall(updated);
      toast.success('Seluruh pasien terdampak telah dikirimi notifikasi jadwal revisi klinis!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Medical Device, Implant & Drug Recall Center</h3>
            <p className="text-xs text-slate-400">
              Penelusuran Pasien Terdampak Penarikan Batch Implan / Obat Secara Real-Time
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 font-mono">
          FDA / Kemenkes Vigilance
        </span>
      </div>

      {/* Grid: 1. Initiate Recall Form vs 2. Active Investigation Studio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form */}
        <form onSubmit={handleInitiateRecall} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="font-black text-slate-900 dark:text-white">Inisiasi Penarikan Batch (Recall Alert):</span>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Produsen / Pabrik Farmasi:</label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Nama Alat / Implan / Obat:</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Nomor Batch / Lot Ditarik:</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Alasan Penarikan (Recall Reason):</label>
            <textarea
              rows={3}
              value={recallReason}
              onChange={(e) => setRecallReason(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            Lacak Pasien & Terbitkan Recall
          </button>
        </form>

        {/* Investigation & Affected Patients */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2">
            <span className="font-black text-rose-900 dark:text-rose-300">Daftar Pasien Terdampak Recall</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold">
              {activeRecall ? `${activeRecall.affectedPatientsCount} Pasien` : 'Siap Melacak'}
            </span>
          </div>

          {activeRecall ? (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <div>ID Recall: <strong className="font-mono">{activeRecall.id}</strong></div>
                <div>Lot: <strong className="font-mono text-rose-600">{activeRecall.lotNumberRecalled}</strong> ({activeRecall.manufacturer})</div>
                <div>Status: <strong className="font-mono">{activeRecall.status}</strong></div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeRecall.affectedPatients.map((p, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-[11px] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">MRN: {p.patientMrn}</div>
                      <div className="text-slate-400 text-[10px]">SN: {p.serialNumber} • Operator: {p.implantedBy}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {p.notificationStatus}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleNotifyPatients(activeRecall.id)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                Kirim Notifikasi Tindak Lanjut Klinis ke Seluruh Pasien
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Masukkan nomor lot implan di sebelah kiri untuk melacak seluruh pasien penerima batch secara instan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
