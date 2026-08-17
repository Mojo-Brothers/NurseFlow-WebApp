import React, { useState, useEffect } from 'react';

export default function OperationalCockpitLiveTelemetry() {
  const [telemetry, setTelemetry] = useState({
    // Pilar 1: Patient Safety (5 Indikator)
    safety: {
      medicationErrors: 0,
      duplicateMrn: 0,
      codeBlueResponseMin: 1.8,
      doorToBalloonMin: 46.0,
      panicValueResponseMin: 3.1,
      status: 'OPTIMAL'
    },
    // Pilar 2: Operations & Capacity (4 Indikator)
    operations: {
      edWaitingTimeMin: 18,
      edActive: 14,
      edEsi1: 2,
      bor: 84.0,
      availableBeds: 16,
      totalBeds: 100,
      icuAvailableBeds: 2,
      icuTotal: 12,
      orUtilization: 75.0,
      orActiveCases: 3,
      status: 'OPTIMAL'
    },
    // Pilar 3: System & Interoperability (3 Indikator)
    system: {
      uptime: 99.999,
      replicationLagSec: 0.12,
      bpjsSuccessRate: 98.7,
      unbilledOrders: 0,
      satusehatSyncRate: 99.8,
      outboxBacklog: 0,
      status: 'OPTIMAL'
    }
  });

  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 10000); // 10s live pulse
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl space-y-6">
      {/* Header Cockpit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <span className="material-symbols-outlined text-2xl">monitoring</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Hospital Command Center — 30-Second Situational Awareness Cockpit
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                12 ESSENTIAL METRICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Konsolidasi real-time 12 indikator vital untuk menjawab 3 pertanyaan eksekutif direktur dalam 30 detik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sync Pulse: {lastRefreshed.toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      {/* 3-Question Instant Executive Evaluator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex items-start gap-3 p-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-xl">health_and_safety</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">1. Pasien Berisiko Hari Ini?</p>
            <p className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span>AMAN & TERKENDALI</span>
              <span className="text-[10px] text-slate-300 font-normal">(0 Med Error / 2 ESI-1 On Track)</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 border-t md:border-t-0 md:border-l border-slate-800">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
            <span className="material-symbols-outlined text-xl">speed</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">2. Unit Mengalami Overload?</p>
            <p className="text-xs font-black text-teal-400 flex items-center gap-1.5 mt-0.5">
              <span>KAPASITAS OPTIMAL</span>
              <span className="text-[10px] text-slate-300 font-normal">(BOR 84% / ICU 2 Bed Ready)</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 border-t md:border-t-0 md:border-l border-slate-800">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-xl">cloud_done</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">3. Sistem Berjalan Baik?</p>
            <p className="text-xs font-black text-blue-400 flex items-center gap-1.5 mt-0.5">
              <span>PRISTINE 99.999%</span>
              <span className="text-[10px] text-slate-300 font-normal">(BPJS 98.7% / SATUSEHAT 99.8%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3 Domain Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DOMAIN 1: PATIENT SAFETY (5 Indikator) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified_user</span> 1. Patient Safety
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
              ZERO TOLERANCE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">Medication Error</p>
              <p className="text-lg font-black text-emerald-400">{telemetry.safety.medicationErrors} <span className="text-[10px] text-slate-400 font-normal">Kasus</span></p>
              <p className="text-[9px] text-slate-500">Target: 0 Kasus</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">Duplicate MRN</p>
              <p className="text-lg font-black text-emerald-400">{telemetry.safety.duplicateMrn} <span className="text-[10px] text-slate-400 font-normal">Duplikasi</span></p>
              <p className="text-[9px] text-slate-500">Target: 0 Kasus</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">Code Blue Response</p>
              <p className="text-lg font-black text-cyan-400">{telemetry.safety.codeBlueResponseMin} <span className="text-[10px] text-slate-400 font-normal">Menit</span></p>
              <p className="text-[9px] text-emerald-400">Target: &lt; 3.0m (JCI)</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">Door-to-Balloon (D2B)</p>
              <p className="text-lg font-black text-amber-300">{telemetry.safety.doorToBalloonMin} <span className="text-[10px] text-slate-400 font-normal">Menit</span></p>
              <p className="text-[9px] text-emerald-400">Target: &lt; 90m (AHA)</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">Panic Value Read-Back</p>
              <p className="text-xs font-black text-rose-400">{telemetry.safety.panicValueResponseMin} Menit <span className="text-[9px] text-slate-400 font-normal">(Target &lt; 5.0m)</span></p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              JCI IPSG-2 COMPLIANT
            </span>
          </div>
        </div>

        {/* DOMAIN 2: OPERATIONS & CAPACITY (4 Indikator) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">hotel</span> 2. Hospital Operations
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-bold">
              BARBER-JOHNSON
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">ED Waiting Time</p>
              <p className="text-lg font-black text-teal-300">{telemetry.operations.edWaitingTimeMin} <span className="text-[10px] text-slate-400 font-normal">Menit</span></p>
              <p className="text-[9px] text-slate-400">Aktif: {telemetry.operations.edActive} (ESI-1: {telemetry.operations.edEsi1})</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">Bed Occupancy (BOR)</p>
              <p className="text-lg font-black text-teal-400">{telemetry.operations.bor}%</p>
              <p className="text-[9px] text-emerald-300">Kosong: {telemetry.operations.availableBeds} Bed</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">ICU Capacity</p>
              <p className="text-lg font-black text-purple-400">{telemetry.operations.icuAvailableBeds} <span className="text-[10px] text-slate-400 font-normal">Bed Ready</span></p>
              <p className="text-[9px] text-purple-300">Ventilator: 2 Unit Ready</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">OR Kamar Bedah</p>
              <p className="text-lg font-black text-cyan-400">{telemetry.operations.orUtilization}%</p>
              <p className="text-[9px] text-slate-400">{telemetry.operations.orActiveCases} Operasi Berjalan</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">Distribusi Kapasitas Bed</p>
              <p className="text-xs font-bold text-slate-200">Total 100 Bed (84 Terisi / 16 Kosong)</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              OPTIMAL (60–85%)
            </span>
          </div>
        </div>

        {/* DOMAIN 3: SYSTEM & REVENUE HEALTH (3 Indikator) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">cloud_sync</span> 3. System & Interoperability
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
              HIGH AVAILABILITY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">System Uptime</p>
              <p className="text-lg font-black text-emerald-400">{telemetry.system.uptime}%</p>
              <p className="text-[9px] text-indigo-300">Repl Lag: {telemetry.system.replicationLagSec}s</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400">BPJS V-Claim 2.0</p>
              <p className="text-lg font-black text-emerald-400">{telemetry.system.bpjsSuccessRate}%</p>
              <p className="text-[9px] text-slate-400">Unbilled: {telemetry.system.unbilledOrders}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">SATUSEHAT Sync Rate:</span>
              <strong className="text-blue-400 font-mono font-bold">{telemetry.system.satusehatSyncRate}%</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Outbox Queue Backlog:</span>
              <strong className="text-emerald-300 font-mono font-bold">{telemetry.system.outboxBacklog} Item (Pristine)</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">Status Cluster Database</p>
              <p className="text-xs font-bold text-emerald-400">PostgreSQL 16 HA Sync Active</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              HEALTHY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
