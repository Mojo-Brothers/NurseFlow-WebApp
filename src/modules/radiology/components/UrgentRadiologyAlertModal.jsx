import React, { useState } from 'react';
import { pacsDicomEngineService } from '../services/pacsDicomEngine.service.js';
import toast from 'react-hot-toast';

export default function UrgentRadiologyAlertModal({ alertData, onClose }) {
  if (!alertData) return null;

  const [recipientName, setRecipientName] = useState('dr. Surya Johnson, Sp.PD (DPJP Pasien)');
  const [callerRadiologistName, setCallerRadiologistName] = useState('dr. Hendro Prasetyo, Sp.Rad(K)');
  const [readBackStatement, setReadBackStatement] = useState(
    `dr. Surya Johnson telah membacakan ulang: Ditemukan ${alertData.findingName} pada foto ${alertData.study.studyDescription} pasien ${alertData.study.patientName} (${alertData.study.patientMrn})`
  );
  const [actionPlan, setActionPlan] = useState('Tim medis IGD/ICU segera mempersiapkan tindakan darurat di bedside.');

  const handleConfirmReadBack = (e) => {
    e.preventDefault();
    try {
      pacsDicomEngineService.confirmCriticalFindingReadBack({
        alertId: alertData.alertId,
        reportedToClinicianName: recipientName,
        reportedByRadiologistName: callerRadiologistName,
        readBackConfirmedStatement: readBackStatement
      });

      toast.success('Pelaporan Temuan Kritis Radiologi (JCI IPSG 2 Read-Back) Berhasil Diverifikasi!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <form onSubmit={handleConfirmReadBack} className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black animate-pulse">
              <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
            </div>
            <div>
              <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                Temuan Kritis Radiologi (JCI IPSG 2 Read-Back)
              </h3>
              <p className="text-xs text-slate-500">Wajib Lapor Telepon Cito Maksimal &le; 15 Menit sejak Ekspertise</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Critical Summary Box */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-400 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-rose-800 dark:text-rose-300">{alertData.findingName}</span>
            <span className="font-mono text-rose-600 font-bold">{alertData.study.accessionNumber}</span>
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            Pasien: <span className="font-bold">{alertData.study.patientName}</span> ({alertData.study.patientMrn})
          </div>
          <div className="text-rose-700 dark:text-rose-300 font-bold">
            Ancaman Klinis: {alertData.threat}
          </div>
        </div>

        {/* Read-Back Form Fields */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Nama DPJP / Dokter Penerima Laporan Telepon</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Konfirmasi Pembacaan Ulang (SBAR Read-Back Statement)</label>
            <textarea
              rows={2}
              value={readBackStatement}
              onChange={(e) => setReadBackStatement(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Rencana Tindak Lanjut Unit Klinis</label>
            <input
              type="text"
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-transform active:scale-95 cursor-pointer"
          >
            Konfirmasi Read-Back Selesai
          </button>
        </div>
      </form>
    </div>
  );
}
