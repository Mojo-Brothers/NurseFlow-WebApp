import React, { useState } from 'react';
import { casemixRevenueCycleEngineService, DISPUTE_REASONS } from '../../../../server/services/casemixRevenueCycleEngine.service.js';
import toast from 'react-hot-toast';

export default function BpjsDisputeManagementStudio() {
  const [disputes, setDisputes] = useState(() => casemixRevenueCycleEngineService.getAllDisputes());
  const [selectedDispute, setSelectedDispute] = useState(disputes[0] || null);
  const [clarificationText, setClarificationText] = useState('');

  const handleSimulateDispute = () => {
    try {
      const disp = casemixRevenueCycleEngineService.raiseBpjsDispute({
        submissionId: 'SUB-SAMPLE-01',
        disputeCode: DISPUTE_REASONS.MISSING_SURGICAL_REPORT,
        verifierNote: 'Klaim K-1-14-I (Apendektomi) pending verifikasi: Laporan operasi belum melampirkan foto jaringan patologi anatomi.'
      });
      setDisputes([...casemixRevenueCycleEngineService.getAllDisputes()]);
      setSelectedDispute(disp);
      toast.error('⚠️ Peringatan Dispute BPJS Diterima! Klaim masuk ke daftar pending klarifikasi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResolveDispute = (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      casemixRevenueCycleEngineService.resolveBpjsDispute({
        disputeId: selectedDispute.id,
        clarificationNote: clarificationText || 'Dokumen laporan operasi dan hasil PA terlampir lengkap.',
        isAccepted: true
      });

      setDisputes([...casemixRevenueCycleEngineService.getAllDisputes()]);
      toast.success(`Dispute SEP ${selectedDispute.sepNumber} Berhasil Diselesaikan & Klaim Disahkan BPJS!`);
      setSelectedDispute(null);
      setClarificationText('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">BPJS Dispute Management & Resolusi Pending Klaim</h3>
            <p className="text-xs text-slate-400">
              Pelacakan Berkas Pending Verifikator BPJS & Klarifikasi Koding Medis Berita Acara
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSimulateDispute}
          className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 cursor-pointer"
        >
          + Simulasi Dispute Baru dari Verifikator BPJS
        </button>
      </div>

      {/* Grid: Dispute List vs Resolution Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dispute Cases */}
        <div className="space-y-2">
          <span className="font-black text-slate-900 dark:text-white">Daftar Berkas Dispute Terbuka:</span>

          {disputes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400">
              Tidak ada klaim BPJS yang mengalami dispute saat ini.
            </div>
          ) : (
            disputes.map(d => (
              <div
                key={d.id}
                onClick={() => setSelectedDispute(d)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedDispute?.id === d.id
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#015C80] dark:text-cyan-400">SEP: {d.sepNumber}</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                    d.disputeStatus === 'OPEN'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {d.disputeStatus}
                  </span>
                </div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Alasan: <span className="text-amber-700 dark:text-amber-300">{d.disputeCode}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{d.bpjsVerifierNote}</p>
              </div>
            ))
          )}
        </div>

        {/* Resolution Panel */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          {selectedDispute ? (
            <form onSubmit={handleResolveDispute} className="space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-black text-slate-900 dark:text-white">Form Tanggapan & Klarifikasi RS:</span>
                <p className="text-[11px] text-slate-400">SEP: {selectedDispute.sepNumber}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-[11px]">
                <strong>Catatan Verifikator BPJS:</strong> {selectedDispute.bpjsVerifierNote}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Justifikasi Medis / Penjelasan Koding:</label>
                <textarea
                  rows={4}
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                  placeholder="Ketik justifikasi klinis DPJP, lampiran nomor berkas rekam medis elektronik, atau perbaikan kode CBG..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Kirim Klarifikasi & Sahkan Rekonsiliasi Klaim
              </button>
            </form>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Pilih kasus dispute di sebelah kiri untuk melihat rincian catatan verifikator BPJS dan mengajukan berita acara sanggahan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
