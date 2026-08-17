import React, { useState } from 'react';
import { useOrdersStore } from '../store/orders.store.js';

export default function RadiologyViewerWorkspace() {
  const { radOrders, releaseRadiologyReport } = useOrdersStore();
  const [selectedRad, setSelectedRad] = useState(radOrders[0] || null);
  const [reportNotes, setReportNotes] = useState('');

  const handleReleaseReport = async () => {
    if (!selectedRad) return;

    try {
      await releaseRadiologyReport({
        radOrderId: selectedRad.id,
        reportText: reportNotes || undefined,
        radiologistName: 'dr. Sp.Rad (Spesialis Radiologi)'
      });
      alert('Ekspertise Radiologi Berhasil Dirilis & Disahkan! Tagihan otomatis tercatat di Billing Ledger.');
    } catch (err) {
      alert(`Gagal Merilis Ekspertise: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── DICOM Web Viewer Simulator ─── */}
      <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              DICOM PS 3.10 PACS VIEWER
            </span>
            <h4 className="text-sm font-headline font-black text-white mt-1">
              {selectedRad?.examination_name || 'Pemeriksaan Radiologi'}
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-400">Study UID: {selectedRad?.dicom_study_uid?.slice(-12)}</span>
        </div>

        {/* Diagnostic Screen Simulation */}
        <div className="w-full h-72 rounded-2xl bg-black border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500">
            MODALITY: {selectedRad?.modality} &bull; KV: 120 &bull; mA: 250 &bull; THICKNESS: 1.0mm
          </div>

          <span className="material-symbols-outlined text-slate-700 text-[64px] mb-2 animate-pulse">
            medical_information
          </span>
          <p className="text-xs text-slate-400 font-mono text-center max-w-sm">
            [SIMULASI CITRA DICOM TERVALIDASI PACS]<br />
            Seri Potongan Aksial / Koronal Tervisualisasi Siap Ekspertise
          </p>

          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-teal-400">
            LOSSLESS COMPRESSION &bull; 100% INTEGRITY
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
          <span>Window: WL 40 / WW 350</span>
          <span>Zoom: 100% &bull; Invert: Normal</span>
        </div>
      </div>

      {/* ─── Form Ekspertise Radiolog ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <h4 className="text-sm font-headline font-black text-on-surface uppercase">
            Ekspertise Radiologi Terstruktur
          </h4>
          <span className="text-[10px] font-mono font-bold text-teal-600">JCI GLD Ready</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Pilih Order Radiologi</label>
            <select
              value={selectedRad?.id}
              onChange={(e) => {
                const found = radOrders.find(r => r.id === e.target.value);
                if (found) setSelectedRad(found);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              {radOrders.map(r => (
                <option key={r.id} value={r.id}>[{r.modality}] {r.examination_name} ({r.result_status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Hasil Ekspertise Radiolog *</label>
            <textarea
              rows={7}
              value={reportNotes || selectedRad?.radiologist_report || ''}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Deskripsi temuan radiologis, cor/pulmo/tulang, kesimpulan ekspertise..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
            />
          </div>

          <button
            onClick={handleReleaseReport}
            className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Sahkan & Rilis Ekspertise (Emit SERVICE_CHARGED)</span>
          </button>
        </div>
      </div>

    </div>
  );
}
