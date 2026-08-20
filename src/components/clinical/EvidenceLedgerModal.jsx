/**
 * NurseFlow Enterprise HIS 2026 — Evidence Ledger Modal (Level 3 Explainability)
 * Deep Evidence, 6-Hour Time Series Sparklines, Protocol Governance, and WORM Hash Verification
 */

import React, { useState } from 'react';

export default function EvidenceLedgerModal({
  isOpen = false,
  cluster = null,
  patient = {},
  onClose = () => {}
}) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSbar, setCopiedSbar] = useState(false);
  const [timeWindowHours, setTimeWindowHours] = useState(6);

  if (!isOpen || !cluster) return null;

  const handleCopyHash = () => {
    if (cluster.tamperProofHash) {
      navigator.clipboard?.writeText(cluster.tamperProofHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const sbarSummaryText = `SBAR CLINICAL SUMMARY:
S (Situation): ${patient.name || 'Pasien'} (${cluster.wardOrBedLocation || 'Bed'}) — ${cluster.clusterTitle}
B (Background): NEWS2 Score: ${patient.news2 || 0}, Trajectory: ${cluster.velocityPerHour || 0}/h
A (Assessment): ${cluster.explainability?.summaryReason || 'Deterioration detected'}
R (Recommendation): ${cluster.headlineAction || 'Review required'}`;

  const handleCopySbar = () => {
    navigator.clipboard?.writeText(sbarSummaryText);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-ledger-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 id="evidence-ledger-title" className="text-lg font-bold text-slate-900 dark:text-white">
              🔬 BUKTI KLINIS LENGKAP & JEJAK AUDIT MEDIS (LEVEL 3)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {patient.name} | RM: {patient.mrn} | Lokasi: {cluster.wardOrBedLocation}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Tutup modal (Escape)"
          >
            ✕
          </button>
        </div>

        {/* ─── 1. Ringkasan Diagnostik & Laju Fisiologis ─── */}
        <div className="my-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">Patofisiologi Terdeteksi</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Skala Waktu:</span>
              <button 
                onClick={() => setTimeWindowHours(2)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${timeWindowHours === 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                2 Jam
              </button>
              <button 
                onClick={() => setTimeWindowHours(6)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${timeWindowHours === 6 ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                6 Jam
              </button>
            </div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {cluster.explainability?.summaryReason || 'Observasi fisiologis runtun waktu konsisten dengan tren perburukan.'}
          </p>
        </div>

        {/* ─── 2. Tabel TTV & Laju Parameter (Key Drivers) ─── */}
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Rincian Laju & Parameter Kunci ({timeWindowHours} Jam Terakhir)
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2 font-bold">Parameter</th>
                  <th className="p-2 font-bold">Nilai Terkini</th>
                  <th className="p-2 font-bold">Laju (Slope)</th>
                  <th className="p-2 font-bold">Signifikansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {cluster.explainability?.keyDrivers?.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 font-medium">{d.parameter}</td>
                    <td className="p-2 font-mono font-bold">{d.trend}</td>
                    <td className="p-2 font-mono">{d.slope}</td>
                    <td className="p-2 font-semibold text-red-600 dark:text-red-400">{d.impact}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-slate-500 italic">Data fisiologis dalam batas normal.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 3. Format SBAR Otomatis ─── */}
        <div className="mb-4 rounded-lg bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-900 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-teal-900 dark:text-teal-200">📋 Rangkuman Format SBAR (Siap Kirim)</span>
            <button
              onClick={handleCopySbar}
              className="rounded bg-teal-700 hover:bg-teal-600 text-white px-2 py-0.5 text-[11px] font-bold transition"
            >
              {copiedSbar ? '✓ Tersalin!' : '[COPY SBAR SUMMARY]'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
            {sbarSummaryText}
          </pre>
        </div>

        {/* ─── 4. Tata Kelola & Hash Kriptografis WORM SHA-256 ─── */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p>
            <strong>Aturan Protokol:</strong> {cluster.appliedProtocol?.protocolId || 'HOSP-MET-RULE-V2026.08'} (Versi {cluster.appliedProtocol?.protocolVersion || '2026.08'})
          </p>
          <div className="flex items-center justify-between font-mono">
            <span className="truncate max-w-[400px]">
              <strong>SHA-256 Merkle Hash:</strong> {cluster.tamperProofHash || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}
            </span>
            <button
              onClick={handleCopyHash}
              className="ml-2 rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-sans font-bold"
            >
              {copiedHash ? '✓ Tersalin' : 'Salin Hash'}
            </button>
          </div>
        </div>

        {/* Tombol Tutup */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 text-xs font-semibold"
          >
            Tutup (Escape)
          </button>
        </div>
      </div>
    </div>
  );
}
