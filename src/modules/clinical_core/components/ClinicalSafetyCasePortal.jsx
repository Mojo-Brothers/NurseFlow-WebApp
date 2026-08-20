/**
 * NurseFlow Enterprise HIS 2026 — Clinical Safety Case Portal
 * International Clinical Safety Case Registry (ISO 14971 / DCB 0129 / DCB 0160)
 */

import React, { useState } from 'react';
import { SAFETY_CASE_HAZARDS } from '../services/clinicalDecisionReplay.service.js';

export default function ClinicalSafetyCasePortal({
  safetyCases = [],
  onClose = () => {}
}) {
  const [selectedHazard, setSelectedHazard] = useState(
    safetyCases.length > 0 ? safetyCases[0].hazardId : SAFETY_CASE_HAZARDS.HAZARD_SEPSIS_DETERIORATION
  );

  const activeCase = safetyCases.find(c => c.hazardId === selectedHazard) || safetyCases[0] || {
    hazardId: 'HAZARD_SEPSIS_DETERIORATION',
    title: 'Keterlambatan Deteksi & Respons Syok Sepsis di Bangsal Rawat Inap',
    clinicalRisk: 'Kolaps Kardiorespirasi Mendadak & Mortalitas Tak Terduga',
    safetyControl: 'Monitoring Triad Terpadu (NEWS2 + Slope Trajectory + ADE Watch)',
    detectionMechanism: 'Deteksi Akselerasi Laju Laktat & Penurunan MAP (-4.0 mmHg/jam)',
    mitigationHierarchy: 'Auto-Escalation Waktu (T+0m Perawat -> T+5m Dokter Jaga -> T+10m MET)',
    softwareEvidence: 'Matriks 50 Skenario Deterministik 4B.4–4B.9 Lulus 100%',
    humanOverrideProtocol: 'DPJP 2FA PIN Authorization dengan Alasan Medis Wajib',
    failureMode: 'Sensor Lepas / Data Observasi Kosong (> 4 Jam)',
    residualRiskMitigation: 'Peringatan DATA_DEFICIT Diterbitkan; Asumsi Normal DIBLOKIR TOTAL'
  };

  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      data-testid="clinical-safety-case-portal"
      role="region"
      aria-label="Clinical Safety Case Portal"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🛡️ CLINICAL SAFETY CASE REGISTRY (ISO 14971 / DCB 0129)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dokumentasi Matriks Bahaya, Kontrol Keselamatan & Mitigasi Risiko Klinis
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-xs">✕ Tutup</button>
      </div>

      {/* ─── Hazard Selector ─── */}
      <div className="my-4 flex flex-wrap gap-2">
        {safetyCases.map((sc) => (
          <button
            key={sc.hazardId}
            onClick={() => setSelectedHazard(sc.hazardId)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${selectedHazard === sc.hazardId ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {sc.hazardId.replace('HAZARD_', '')}
          </button>
        ))}
      </div>

      {/* ─── Structured Safety Case Matrix Table ─── */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <th className="p-3 font-bold w-1/3 text-slate-600 dark:text-slate-400">1. Hazard Description</th>
              <td className="p-3 font-semibold text-slate-900 dark:text-white">{activeCase.title}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">2. Clinical Risk</th>
              <td className="p-3 text-red-600 dark:text-red-400 font-bold">{activeCase.clinicalRisk}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">3. Safety Control</th>
              <td className="p-3 text-slate-800 dark:text-slate-200">{activeCase.safetyControl}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">4. Detection Mechanism</th>
              <td className="p-3 text-slate-800 dark:text-slate-200 font-mono">{activeCase.detectionMechanism}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">5. Mitigation Hierarchy</th>
              <td className="p-3 text-slate-800 dark:text-slate-200">{activeCase.mitigationHierarchy}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">6. Software Evidence</th>
              <td className="p-3 text-emerald-600 font-bold">{activeCase.softwareEvidence}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">7. Human Override Protocol</th>
              <td className="p-3 text-slate-800 dark:text-slate-200">{activeCase.humanOverrideProtocol}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">8. Failure Mode</th>
              <td className="p-3 text-amber-600 font-semibold">{activeCase.failureMode}</td>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <th className="p-3 font-bold text-slate-600 dark:text-slate-400">9. Residual Risk Mitigation</th>
              <td className="p-3 text-slate-900 dark:text-white font-bold">{activeCase.residualRiskMitigation}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
