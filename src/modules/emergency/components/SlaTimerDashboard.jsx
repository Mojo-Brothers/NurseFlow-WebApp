import React from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';

export default function SlaTimerDashboard() {
  const { slaTimers, pmkpStats, recordFirstPhysicianContact } = useEmergencyStore();

  return (
    <div className="space-y-6">
      
      {/* ─── PMKP Response Time Indicator Card ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Kepatuhan Waktu Tanggap (PMKP)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-black text-teal-600">{pmkpStats.compliancePercent}%</span>
            <span className="text-xs text-on-surface-variant font-bold">Target &ge; 90%</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">Standar Akreditasi KARS 2024 & JCI.</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Total Pasien Triase Terlayani</span>
          <span className="text-3xl font-headline font-black text-on-surface">{pmkpStats.totalCases}</span>
          <p className="text-[11px] text-on-surface-variant">Terhitung sejak stopwatch triase dimulai.</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Pelanggaran SLA (Overdue)</span>
          <span className="text-3xl font-headline font-black text-rose-600">{pmkpStats.breachedCases}</span>
          <p className="text-[11px] text-rose-500">Pasien yang waktu tanggapnya melebihi target ATS.</p>
        </div>
      </div>

      {/* ─── Live Stopwatch Countdown Matrix ─── */}
      <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <h4 className="text-sm font-headline font-black text-on-surface uppercase">Pemantau Stopwatch Waktu Tanggap Dokter IGD (Live SLA Timers)</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {slaTimers.map(timer => {
            const isRed = timer.triage_level === 'P1_RESUSCITATION';
            const isOrange = timer.triage_level === 'P2_EMERGENT';
            const minutesLeft = Math.floor(timer.remaining_seconds / 60);
            const secondsLeft = timer.remaining_seconds % 60;

            return (
              <div
                key={timer.id}
                className={`p-5 rounded-3xl border transition-all ${
                  timer.is_overdue
                    ? 'bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                    : 'bg-surface-container border-outline-variant/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isRed ? 'bg-rose-600 text-white' : isOrange ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {timer.triage_level}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                    Target: {timer.target_response_minutes}m
                  </span>
                </div>

                <h4 className="text-sm font-black text-on-surface">{timer.patient_name}</h4>
                <p className="text-[11px] text-on-surface-variant font-mono">Encounter: {timer.encounter_id}</p>

                <div className="my-3 p-3 rounded-2xl bg-surface-container-highest border border-outline-variant/20 text-center">
                  <span className="text-[9px] text-on-surface-variant uppercase font-bold block">Sisa Waktu Respon Dokter:</span>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${timer.is_overdue ? 'text-rose-600 animate-pulse' : 'text-teal-600'}`}>
                    {timer.is_overdue ? `OVERDUE (+${Math.floor(timer.elapsed_seconds / 60)}m)` : `${minutesLeft}m ${secondsLeft}s`}
                  </div>
                </div>

                {timer.status === 'RUNNING' || timer.status === 'BREACHED' ? (
                  <button
                    onClick={() => recordFirstPhysicianContact(timer.encounter_id, 'dr. Jaga Emergensi')}
                    className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    <span>Dokter Kontak Pasien (Hentikan Timer)</span>
                  </button>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center">
                    ✓ Respon Selesai ({timer.elapsed_seconds}s)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
