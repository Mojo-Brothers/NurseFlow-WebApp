/**
 * NurseFlow Enterprise HIS 2026 — Medicolegal Audit Export Modal
 * Legal Evidence Document Exporter with Cryptographic Merkle Root Verification
 */

import React, { useState } from 'react';

export default function MedicolegalAuditExportModal({
  isOpen = false,
  patient = { id: 'PT-01', name: 'Ny. Siti Aminah', mrn: '00-88-21-44' },
  transcript = null,
  onExportPdf = () => {},
  onExportJson = () => {},
  onClose = () => {}
}) {
  const [copyStatus, setCopyStatus] = useState('');

  if (!isOpen || !transcript) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transcript.certifiedMerkleRoot);
    setCopyStatus('Hash tersalin ke clipboard!');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicolegal-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 id="medicolegal-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              📜 CHRONOLOGICAL CLINICAL EVIDENCE EXPORT (AUDIT & LEGAL REVIEW)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pasien: {patient.name} ({patient.mrn}) | Standar: Permenkes No. 24/2022
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        {/* ─── Legal Disclaimer & Strict Objective Facts Note ─── */}
        <div className="my-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
          <strong>⚠️ CATATAN MEDIKOLEGAL MUTLAK:</strong> Laporan ini memuat fakta kronologis sistem secara deterministik. Sistem tidak memuat spekulasi kontrafaktual terkait hasil akhir klinis pasien.
        </div>

        {/* ─── Chronological Facts List ─── */}
        <div className="my-4 space-y-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs">
          {transcript.chronologicalFacts?.map((fact, idx) => (
            <div key={idx} className="border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{fact.seq}. {fact.timestamp}</span>
                <span className="truncate max-w-[120px]">{fact.sha256?.slice(0, 10)}...</span>
              </div>
              <p className="mt-0.5 text-slate-800 dark:text-slate-200 font-medium">
                {fact.fact}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Cryptographically Verifiable Integrity Record ─── */}
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-xs flex items-center justify-between gap-2">
          <div className="truncate">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Cryptographically Verifiable Integrity Record (SHA-256):</span>
            <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400 truncate block">
              {transcript.cryptographicallyVerifiableIntegrityRecord || transcript.certifiedMerkleRoot}
            </span>
          </div>
          <button
            onClick={handleCopyHash}
            className="rounded bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 shrink-0"
          >
            Salin Hash
          </button>
        </div>
        {copyStatus && <p className="text-[11px] text-emerald-600 font-bold mt-1">{copyStatus}</p>}

        {/* ─── Export Actions ─── */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            onClick={onExportJson}
            className="rounded bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 text-xs shadow"
          >
            Export FHIR JSON
          </button>
          <button
            onClick={onExportPdf}
            className="rounded bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 text-xs shadow"
          >
            Unduh Berkas PDF Audit
          </button>
        </div>
      </div>
    </div>
  );
}
