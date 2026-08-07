import React from 'react';
import { Activity, Dna, Cpu, Sparkles } from 'lucide-react';

/**
 * OceanicTealLoadingSpinner - 3 Variasi Animasi Proses Loading Berbasis Warna Resmi Oceanic Teal (#007399)
 * 
 * Variant 1: 'ecg' / 'v1' -> Oceanic ECG Heartbeat & Pulse Wave (Clinical Vital Pulse)
 * Variant 2: 'helix' / 'v2' -> Oceanic DNA Helix & Molecular Spinner (Biometric & Science)
 * Variant 3: 'hud' / 'v3' -> Oceanic Command Center HUD Matrix Loader (High-Tech Scanner)
 */
export default function OceanicTealLoadingSpinner({ 
  variant = 'v1', 
  label = 'Memproses Data Rekam Medis NurseFlow HIS...', 
  progress = null,
  size = 'md' 
}) {
  const isFull = size === 'full';
  
  return (
    <div className={`flex flex-col items-center justify-center text-center font-sans transition-all duration-300 ${
      isFull 
        ? 'fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-lg min-h-screen w-screen p-4 m-0 top-0 left-0 right-0 bottom-0' 
        : 'w-full min-h-[300px] py-10 px-4 my-auto'
    }`}>
      <div className="bg-slate-950/95 border-2 border-[#007399]/60 p-8 rounded-[2rem] shadow-[0_0_60px_rgba(0,115,153,0.4)] max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200 mx-auto my-auto flex flex-col items-center justify-center">
        
        {/* VARIANT 1: OCEANIC ECG HEARTBEAT & PULSE WAVE */}
        {(variant === 'v1' || variant === 'ecg') && (
          <div className="flex flex-col items-center space-y-5">
            {/* ECG Pulse Box */}
            <div className="relative w-28 h-28 rounded-3xl bg-[#007399]/10 border-2 border-[#007399]/40 flex items-center justify-center overflow-hidden shadow-inner group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,115,153,0.25)_0%,transparent_70%)] animate-pulse" />
              
              {/* Spinning Ring */}
              <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-cyan-400/40 animate-[spin_10s_linear_infinite]" />

              {/* Glowing Heartbeat Icon */}
              <div className="relative z-10 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-bounce">
                <Activity size={44} className="text-cyan-300 stroke-[2.5]" />
              </div>

              {/* Animated ECG Wave Bar */}
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-[#007399]/30 overflow-hidden">
                <div className="h-full bg-cyan-400 animate-[shimmer_1.5s_infinite] shadow-[0_0_8px_rgba(6,182,212,1)]" />
              </div>
            </div>

            {/* Title & Progress */}
            <div>
              <span className="px-3 py-1 rounded-full bg-[#007399]/20 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-widest border border-cyan-500/30 flex items-center gap-1.5 mx-auto w-fit">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> V1: VITAL ECG PULSE
              </span>
              <p className="text-sm font-black text-white mt-2.5">{label}</p>
              {progress !== null && (
                <div className="text-xs font-mono font-bold text-cyan-400 mt-1">
                  Progress Status: [{progress}%]
                </div>
              )}
            </div>

            {/* Custom ECG Wave SVG Line */}
            <div className="w-full h-8 relative overflow-hidden bg-slate-900/80 rounded-xl border border-[#007399]/30 flex items-center justify-center">
              <svg className="w-full h-full text-cyan-400 stroke-current" viewBox="0 0 100 20">
                <path 
                  d="M0,10 L30,10 L35,2 L40,18 L45,5 L50,10 L100,10" 
                  fill="none" 
                  strokeWidth="2"
                  className="animate-[dash_1.5s_linear_infinite]"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
              </svg>
            </div>
          </div>
        )}

        {/* VARIANT 2: OCEANIC DNA HELIX & MOLECULAR SPINNER */}
        {(variant === 'v2' || variant === 'helix') && (
          <div className="flex flex-col items-center space-y-5">
            {/* Molecular Dual Ring Spinner */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer Counter-Clockwise Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-t-[#007399] border-r-transparent border-b-[#007399]/40 border-l-transparent animate-[spin_2s_linear_infinite]" />
              
              {/* Inner Clockwise Ring */}
              <div className="absolute inset-3 rounded-full border-4 border-t-cyan-300 border-r-transparent border-b-cyan-500/30 border-l-transparent animate-[spin_1.2s_linear_infinite_reverse]" />
              
              {/* Center Stethoscope / DNA Badge */}
              <div className="w-14 h-14 rounded-full bg-[#007399] text-white flex items-center justify-center shadow-lg shadow-[#007399]/50 animate-pulse">
                <Dna size={28} className="text-cyan-200" />
              </div>

              {/* Glowing Orbiting Dots */}
              <div className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,1)] top-0 left-1/2 -translate-x-1/2 animate-ping" />
            </div>

            {/* Title & Progress */}
            <div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-widest border border-cyan-400/40 flex items-center gap-1.5 mx-auto w-fit">
                <Sparkles size={11} className="text-cyan-400" /> V2: BIOMETRIC DNA HELIX
              </span>
              <p className="text-sm font-black text-white mt-2.5">{label}</p>
              {progress !== null && (
                <div className="text-xs font-mono font-bold text-cyan-300 mt-1">
                  Processing: {progress}% Complete
                </div>
              )}
            </div>

            {/* Pill Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-900 border border-[#007399]/40 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#007399] via-cyan-400 to-teal-300 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${progress !== null ? progress : 65}%` }}
              />
            </div>
          </div>
        )}

        {/* VARIANT 3: OCEANIC COMMAND CENTER HUD MATRIX LOADER */}
        {(variant === 'v3' || variant === 'hud') && (
          <div className="flex flex-col items-center space-y-5 font-mono">
            {/* HUD Target Scanner */}
            <div className="relative w-28 h-28 rounded-full border-2 border-[#007399]/50 p-2 flex items-center justify-center bg-[#02131b]">
              {/* Radar Sweep Arc */}
              <div className="absolute inset-1 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
              
              {/* Inner Dashed Radar Ring */}
              <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/40 animate-[spin_6s_linear_infinite_reverse]" />
              
              {/* Center Command CPU Badge */}
              <div className="w-12 h-12 rounded-2xl bg-[#007399]/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,115,153,0.5)]">
                <Cpu size={24} className="animate-pulse" />
              </div>

              {/* Crosshair Dots */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
            </div>

            {/* Title & Terminal Log */}
            <div>
              <span className="px-3 py-1 rounded-full bg-[#007399]/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest border border-cyan-400/50 flex items-center gap-1.5 mx-auto w-fit">
                ⚡ V3: COMMAND HUD 2026
              </span>
              <p className="text-xs font-bold text-cyan-200 mt-2.5 uppercase tracking-tight">{label}</p>
              <div className="text-[10px] text-cyan-400/80 font-mono mt-1 bg-slate-900 px-3 py-1 rounded-lg border border-[#007399]/40">
                STATUS: RUNNING_VALIDATION_HASH... {progress !== null ? `${progress}%` : ''}
              </div>
            </div>

            {/* Segmented Terminal Progress Bar */}
            <div className="w-full flex gap-1 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
                const isFilled = progress ? (step * 10) <= progress : step <= 7;
                return (
                  <div 
                    key={step} 
                    className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                      isFilled 
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
