/**
 * NurseFlow Enterprise HIS 2026 — Patient Safety Command Board
 * Hospital-Wide Acuity Heatmap & Ward Priority Command Center
 */

import React, { useState } from 'react';
import { ALERT_PRIORITY_TIERS } from '../services/clinicalAlertOrchestrator.service.js';

export default function PatientSafetyCommandBoard({
  wards = [],
  activeWard = 'Bangsal Melati',
  currentUser = { id: 'NURSE-01', name: 'Sr. Siti', role: 'WARD_NURSE' },
  onSelectPatient = () => {},
  onOpenHandover = () => {},
  onOpenKpi = () => {}
}) {
  const [filterMyPatientsOnly, setFilterMyPatientsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentWardData = wards.find(w => w.wardName === activeWard) || wards[0] || { wardName: activeWard, patients: [] };
  const allPatients = currentWardData.patients || [];

  const filteredPatients = allPatients.filter(p => {
    if (filterMyPatientsOnly && p.assignedNurseId !== currentUser.id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const mrnMatch = p.mrn?.toLowerCase().includes(q);
      const bedMatch = p.wardOrBedLocation?.toLowerCase().includes(q);
      if (!nameMatch && !mrnMatch && !bedMatch) return false;
    }
    return true;
  });

  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 shadow-lg"
      data-testid="patient-safety-command-board"
      role="region"
      aria-label="Patient Safety Command Board"
    >
      {/* ─── 1. Header Komando & Filter ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🛡️ PATIENT SAFETY COMMAND BOARD — {currentWardData.wardName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring Respons Cepat, Kepatuhan SLA, dan Beban Kerja Staf
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMyPatientsOnly(!filterMyPatientsOnly)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm ${filterMyPatientsOnly ? 'bg-teal-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}
          >
            {filterMyPatientsOnly ? '✓ Pasien Tugas Saya' : 'Semua Pasien Bangsal'}
          </button>
          <button
            onClick={onOpenHandover}
            className="rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
          >
            📋 Shift Handover
          </button>
          <button
            onClick={onOpenKpi}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
          >
            📈 Safety KPIs
          </button>
        </div>
      </div>

      {/* ─── 2. Hospital Acuity Heatmap Strip ─── */}
      <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {wards.map((w, idx) => (
          <div 
            key={idx} 
            className={`rounded-lg border p-3 ${w.wardName === activeWard ? 'border-teal-500 bg-white dark:bg-slate-900 ring-2 ring-teal-500/50' : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50'}`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>{w.wardName}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${w.p1Count > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {w.p1Count > 0 ? `${w.p1Count} P1 CRISIS` : 'STABIL'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Terisi: {w.occupiedBeds || 0}/{w.totalBeds || 30} Bed</span>
              <span>P2: {w.p2Count || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 3. Daftar Pasien Antrean Respons ─── */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          <span>Antrean Pasien Bangsal ({filteredPatients.length} Pasien)</span>
          <input
            type="text"
            placeholder="Cari Pasien / Bed / No RM (Ctrl+K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-xs text-slate-500">
            Tidak ada pasien kritis dalam antrean saat ini.
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isP1 = patient.priorityTier === ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
            const isP2 = patient.priorityTier === ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION;
            const isThreatened = patient.isThreatenedSla;
            const isUnassigned = !patient.assignedNurseId || patient.assignedNurseId === 'UNASSIGNED';

            return (
              <div
                key={patient.id || patient.patientId}
                onClick={() => onSelectPatient(patient)}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 p-3 cursor-pointer transition shadow-sm hover:shadow-md ${isP1 ? 'border-red-600 bg-red-50 dark:bg-red-950/30' : (isP2 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900')} ${isThreatened ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
                    {patient.wardOrBedLocation || patient.bed || 'BED-01'}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {patient.name} ({patient.mrn})
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      NEWS2: <strong className="text-slate-900 dark:text-white">{patient.news2 || 0}</strong> | Laju: <strong className="text-slate-900 dark:text-white">{patient.velocityPerHour ? `${patient.velocityPerHour}/h` : 'Stabil'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {isUnassigned ? (
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      ⚠️ UNASSIGNED NURSE
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      PJ: {patient.assignedNurseName || 'Perawat Primer'}
                    </span>
                  )}

                  <span className={`rounded px-2.5 py-1 text-[11px] font-black uppercase ${isP1 ? 'bg-red-600 text-white' : (isP2 ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white')}`}>
                    {patient.priorityTier?.replace(/_/g, ' ') || 'ROUTINE'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
