import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function EmergencyCommandStudio() {
  const ed = executiveCommandCenterService.getEmergencyMetrics();

  return (
    <div className="space-y-6">
      {/* 4 Core Emergency Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Rata-Rata Waktu Tunggu</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{ed.avgWaitingTimeMinutes} Menit</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar: &lt; 60 Menit
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Door-to-Doctor Time</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{ed.doorToDoctorMinutes} Menit</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar: &lt; 30 Menit
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Door-to-Admission</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{ed.doorToAdmissionMinutes} Menit</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 inline-block">
            SLA Admisi Inpatient
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">LWBS (Pulang Tanpa Dilayani)</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{ed.leftWithoutBeingSeenRate}%</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Standar JCI: &lt; 2%
          </span>
        </div>
      </div>

      {/* Triase ESI / ATS Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Triage Severity Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Distribusi Triase Kegawatan Pasien IGD (ESI / ATS 5-Tier)
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="font-bold text-rose-800 dark:text-rose-200">P1 Resusitasi (Merah - Immediate 0m)</span>
              <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm">{ed.triageDistribution.P1_RESUSCITATION} Pasien</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-amber-800 dark:text-amber-200">P2 Emergent (Oranye - &lt;10m)</span>
              <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">{ed.triageDistribution.P2_EMERGENT} Pasien</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800">
              <span className="font-bold text-yellow-800 dark:text-yellow-200">P3 Urgent (Kuning - &lt;30m)</span>
              <span className="font-mono font-black text-yellow-700 dark:text-yellow-300 text-sm">{ed.triageDistribution.P3_URGENT} Pasien</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold text-emerald-800 dark:text-emerald-200">P4 Semi-Urgent (Hijau - &lt;60m)</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">{ed.triageDistribution.P4_SEMI_URGENT} Pasien</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200">P5 Non-Urgent (Putih - &lt;120m)</span>
              <span className="font-mono font-black text-slate-700 dark:text-slate-300 text-sm">{ed.triageDistribution.P5_NON_URGENT} Pasien</span>
            </div>
          </div>
        </div>

        {/* Boarding Overstay & Ambulans Monitor */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Indikator Kepadatan IGD & Pasien Boarding
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Memonitor pasien yang tertahan di IGD lebih dari 6 jam akibat menunggu ketersediaan tempat tidur rawat inap (ED Boarding Overstay).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Boarding &gt; 6 Jam</span>
              <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {ed.patientsBoardingOver6Hours} Pasien
              </p>
              <span className="text-[10px] text-slate-400">Dalam antrean bed</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ambulans Masuk</span>
              <p className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                +{ed.ambulanceIncoming} Unit
              </p>
              <span className="text-[10px] text-slate-400">ETA ~5 Menit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
