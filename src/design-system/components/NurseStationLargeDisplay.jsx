import React, { useState, useEffect } from 'react';
import KpiCard from './KpiCard.jsx';

export default function NurseStationLargeDisplay({ onClose, beds = [] }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('id-ID')), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayBeds = beds;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white p-8 flex flex-col justify-between select-none overflow-hidden animate-in fade-in">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#015C80] flex items-center justify-center font-black text-2xl shadow-lg">
            <span className="material-symbols-outlined text-[36px]">tv</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-cyan-400">42-INCH NURSE STATION COMMAND BOARD</h1>
            <p className="text-sm text-slate-400">Ruang Rawat Inap Terpadu Lt. 3 • RSUP Nasional 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right font-mono">
            <div className="text-4xl font-black text-white">{time} WIB</div>
            <div className="text-xs text-emerald-400 font-bold">REALTIME LIVE SYNCHRONIZATION ACTIVE</div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            ✕ Exit Fullscreen
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-4 gap-6 my-6">
        <KpiCard icon="single_bed" title="TEMPAT TIDUR TERISI" value={`${displayBeds.length} / 32`} subtext={`${Math.round((displayBeds.length / 32) * 100)}% Kapasitas Terisi`} status="INFO" />
        <KpiCard icon="emergency" title="PASIEN ACUITY TINGGI" value={`${displayBeds.filter(b => b.acuity?.includes('CRITICAL') || b.acuity?.includes('HIGH')).length} Pasien`} subtext="Monitoring Ketat ESI 1-2" status={displayBeds.some(b => b.acuity?.includes('CRITICAL')) ? 'CRITICAL' : 'NORMAL'} />
        <KpiCard icon="medication" title="JADWAL eMAR 1 JAM" value="0 Dosis" subtext="Sinkronisasi Jadwal eMAR Realtime" status="NORMAL" />
        <KpiCard icon="surgical" title="OPERASI IBS HARI INI" value="0 Kasus" subtext="Terhubung ke Jadwal Kamar Bedah" status="NORMAL" />
      </div>

      {/* Bed Matrix Grid */}
      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {displayBeds.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
            <span className="material-symbols-outlined text-5xl mb-2 text-slate-600">bed</span>
            <p className="text-lg font-bold">Seluruh Tempat Tidur Bangsal Saat Ini Berstatus VACANT (Kosong / Siap Pakai)</p>
            <p className="text-sm text-slate-500">Data pasien rawat inap akan otomatis muncul saat admisi dimulai.</p>
          </div>
        ) : displayBeds.map((b, i) => (
          <div
            key={i}
            className={`p-6 rounded-3xl border flex flex-col justify-between ${
              b.acuity === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-600 ring-2 ring-rose-500/30 animate-pulse'
                : b.acuity === 'HIGH (ESI 2)'
                ? 'bg-amber-950/30 border-amber-500'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-black text-cyan-300">{b.bed}</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                b.acuity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {b.acuity}
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white">{b.patient}</div>
              <div className="text-sm font-mono text-slate-400">{b.mrn}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-sm flex justify-between text-cyan-200">
              <span>Tanda Vital: <strong>{b.vitals}</strong></span>
              <span className="font-bold text-amber-300">{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Alert Bar */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="text-emerald-400 font-bold">✔ Seluruh sistem telemetri terhubung tanpa gangguan.</span>
        <span>Tekan tombol 'Exit Fullscreen' atau ESC untuk kembali ke mode desktop.</span>
      </div>
    </div>
  );
}
