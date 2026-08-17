import React, { useState } from 'react';
import { lisPacsEngineService } from '../../../../server/services/lisPacsEngine.service.js';
import toast from 'react-hot-toast';

export default function PanicValueEscalationModal({ panicData, onClose }) {
  if (!panicData) return null;

  const [recipientName, setRecipientName] = useState('Ns. Ratna Sari, S.Kep (Perawat Jaga Bangsal Melati)');
  const [callerAnalystName, setCallerAnalystName] = useState('Analis Budi, S.Tr.Kes');
  const [readBackText, setReadBackText] = useState(`Penerima telah membacakan ulang: Nilai Laktat Darah ${panicData.panicValue} untuk pasien ${panicData.specimen.patientName} (${panicData.specimen.mrn})`);
  const [callNotes, setCallNotes] = useState('Laporan diterima langsung via telepon internal Ext. 204 dan DPJP dr. Surya Johnson telah dihubungi.');

  const handleConfirmReadBack = (e) => {
    e.preventDefault();
    try {
      lisPacsEngineService.confirmPanicValueReadBack({
        alertId: `PANIC-${Date.now()}`,
        reportedToClinicianName: recipientName,
        reportedByAnalystName: callerAnalystName,
        readBackConfirmedText: readBackText,
        notes: callNotes
      });

      toast.success('Pelaporan Nilai Kritis (JCI IPSG 2 Read-Back) Berhasil Diverifikasi & Disimpan!');
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
                Pelaporan Nilai Kritis Wajib (JCI IPSG 2 Read-Back)
              </h3>
              <p className="text-xs text-slate-500">Batas Waktu Pelaporan Maksimal &le; 15 Menit sejak Hasil Keluar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Panic Summary Box */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-400 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 dark:text-rose-300">Parameter Uji: {panicData.panicTestName}</span>
            <span className="font-mono font-black text-rose-600 dark:text-rose-200 text-sm">{panicData.panicValue}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            Pasien: <span className="font-bold">{panicData.specimen.patientName}</span> ({panicData.specimen.mrn})
          </div>
          <div className="text-rose-700 dark:text-rose-300 font-bold">
            Ancaman Klinis: {panicData.threat}
          </div>
        </div>

        {/* Mandatory Read-Back Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Nama Petugas / Dokter Penerima Laporan Telepon</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Konfirmasi Pembacaan Ulang (Read-Back Statement)</label>
            <textarea
              value={readBackText}
              onChange={(e) => setReadBackText(e.target.value)}
              rows={2}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Catatan Komunikasi & Tindak Lanjut Unit</label>
            <input
              type="text"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
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
