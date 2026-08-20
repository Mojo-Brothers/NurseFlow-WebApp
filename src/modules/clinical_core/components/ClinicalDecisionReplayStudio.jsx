/**
 * NurseFlow Enterprise HIS 2026 — Clinical Decision Replay Studio
 * Interactive Time-Scrubbing Forensic Studio (Anti-Hindsight Point-in-Time Reconstruction)
 */

import React, { useState, useEffect } from 'react';

export default function ClinicalDecisionReplayStudio({
  patient = { id: 'PT-01', name: 'Ny. Siti Aminah', mrn: '00-88-21-44' },
  timelineEvents = [],
  onTimeChange = () => {},
  onExportAudit = () => {},
  onClose = () => {}
}) {
  const [currentIndex, setCurrentIndex] = useState(timelineEvents.length > 0 ? timelineEvents.length - 1 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 20x

  const currentEvent = timelineEvents[currentIndex] || { timestamp: new Date().toISOString(), payload: {} };
  const p = currentEvent.payload || {};

  // Auto-playback loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= timelineEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timelineEvents.length]);

  // Notify parent on index change
  useEffect(() => {
    if (timelineEvents[currentIndex]) {
      onTimeChange(timelineEvents[currentIndex]);
    }
  }, [currentIndex, timelineEvents]);

  // Keyboard controls (Space = Play/Pause, ArrowLeft/Right = Step)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(timelineEvents.length - 1, prev + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineEvents.length]);

  return (
    <div 
      className="rounded-xl border-2 border-indigo-600 bg-slate-950 p-6 text-white shadow-2xl"
      data-testid="clinical-decision-replay-studio"
      role="region"
      aria-label="Clinical Decision Replay Studio"
    >
      {/* ─── Header Replay Studio ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              ⏱️ CLINICAL DECISION REPLAY STUDIO (FORENSIC TIME-MACHINE)
            </h2>
            <span className="rounded bg-indigo-900/80 px-2 py-0.5 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
              Anti-Hindsight Point-in-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pasien: <strong>{patient.name}</strong> ({patient.mrn}) | Event {currentIndex + 1} dari {timelineEvents.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportAudit}
            className="rounded bg-teal-700 hover:bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow transition"
          >
            📑 Ekspor Berkas Medikolegal
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
          >
            ✕ Tutup
          </button>
        </div>
      </div>

      {/* ─── Point-in-Time Vital Signs & System Snapshot ─── */}
      <div className="my-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tekanan Darah / MAP</span>
          <h4 className="text-base font-mono font-black text-white mt-1">
            {p.map ? `${p.map} mmHg` : (p.sbp ? `${p.sbp}/${p.dbp}` : '-')}
          </h4>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Heart Rate (HR)</span>
          <h4 className="text-base font-mono font-black text-teal-400 mt-1">
            {p.hr ? `${p.hr} bpm` : '-'}
          </h4>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Respiration Rate</span>
          <h4 className="text-base font-mono font-black text-amber-400 mt-1">
            {p.rr ? `${p.rr} x/m` : '-'}
          </h4>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Saturasi SpO2</span>
          <h4 className="text-base font-mono font-black text-cyan-400 mt-1">
            {p.spo2 ? `${p.spo2}%` : '-'}
          </h4>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Skor NEWS2</span>
          <h4 className="text-base font-mono font-black text-red-400 mt-1">
            {p.news2 !== undefined ? p.news2 : 0}
          </h4>
        </div>

        <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Status Trajektori</span>
          <h4 className="text-xs font-bold text-indigo-300 mt-1.5 truncate">
            {p.velocityScorePerHour ? `${p.velocityScorePerHour > 0 ? '+' : ''}${p.velocityScorePerHour}/h` : 'STABIL'}
          </h4>
        </div>
      </div>

      {/* ─── Timeline Slider (Time Scrubbing) ─── */}
      <div className="my-4 rounded-lg bg-slate-900 p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
          <span>Waktu Rekonstruksi: <strong className="text-indigo-400">{currentEvent.timestamp}</strong></span>
          <span className="text-slate-500">Hash: {currentEvent.tamperProofHash?.slice(0, 16)}...</span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, timelineEvents.length - 1)}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          aria-label="Time Scrubbing Slider"
        />

        {/* Kontrol Navigasi Playback */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-bold"
              title="Event Sebelumnya (Panah Kiri)"
            >
              ◀ Prev
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`rounded px-4 py-1 text-xs font-black shadow transition ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              title="Play / Pause (Spasi)"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play Replay'}
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(timelineEvents.length - 1, prev + 1))}
              className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-bold"
              title="Event Berikutnya (Panah Kanan)"
            >
              Next ▶
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Kecepatan:</span>
            {[1, 5, 20].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`rounded px-2 py-0.5 text-xs font-bold transition ${playbackSpeed === spd ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Penjelasan Fakta Pada Titik Waktu Tersebut ─── */}
      <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 text-xs">
        <span className="font-bold text-slate-300 uppercase block mb-1">
          📋 Deskripsi Fakta Sistem pada Titik Ini:
        </span>
        <p className="text-slate-300 font-mono">
          Event: <strong className="text-teal-300">{currentEvent.eventType}</strong> | Aktor: <strong className="text-indigo-300">{currentEvent.actor || 'SYSTEM'}</strong>
        </p>
      </div>
    </div>
  );
}
