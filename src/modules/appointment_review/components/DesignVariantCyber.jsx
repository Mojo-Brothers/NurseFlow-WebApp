import React from 'react';

const CYBER_SLOTS = [
  { time: '16:00', booked: true, name: 'ACHMAD SAPUTRA', rm: '00487358', channel: 'PRIMAYAAPP', phone: '089613814964', aiRisk: 'LOW' },
  { time: '16:05', booked: true, name: 'GINDO SIMANJUNTAK', rm: '00327636', channel: 'rahajeng', phone: '089637773930', aiRisk: 'HIGH' },
  { time: '16:10', booked: false, type: 'W' },
  { time: '16:15', booked: false, type: 'A' },
  { time: '16:20', booked: false, type: 'E' },
  { time: '16:25', booked: false, type: 'W' },
  { time: '16:30', booked: false, type: 'A' },
  { time: '16:35', booked: false, type: 'E' }
];

export default function DesignVariantCyber() {
  return (
    <div className="space-y-4">
      {/* Variant Info Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg border border-purple-500/30 flex items-center justify-between">
        <div>
          <span className="font-extrabold text-sm uppercase tracking-wider text-purple-300">Varian 2: Cyber-Glassmorphism & AI Aura</span>
          <p className="text-xs text-purple-200 mt-0.5">Antarmuka futuristik dengan efek kaca transparan, aura deteksi risiko AI (No-Show Risk), dan animasi indikator neon.</p>
        </div>
        <span className="px-3 py-1 bg-purple-600/50 backdrop-blur-md text-purple-200 rounded-full text-xs font-bold border border-purple-400/30">Aesthetics: Futuristic</span>
      </div>

      {/* Futuristic Floating Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-indigo-500/20 text-white flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="material-symbols-outlined text-white">auto_awesome</span>
          </div>
          <div>
            <div className="font-black text-sm text-white">dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA</div>
            <div className="text-xs text-purple-300 font-mono">POLI JANTUNG DAN PEMBULUH DARAH • 07-08-2026</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> AI Predictive Active
          </span>
        </div>
      </div>

      {/* Grid Rows with Neon Glow */}
      <div className="space-y-2.5">
        {CYBER_SLOTS.map((s, i) => (
          <div 
            key={s.time}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 flex items-center justify-between gap-4 ${
              s.booked 
                ? s.aiRisk === 'HIGH' 
                  ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500' 
                  : 'bg-indigo-950/20 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-400' 
                : 'bg-slate-900/40 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40'
            }`}
          >
            {/* Slot Info */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 font-mono">#{i + 1}</span>
              <span className="text-base font-black text-white font-mono bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                {s.time}
              </span>
              
              {s.booked ? (
                <div>
                  <div className="text-xs font-mono text-purple-300 font-bold">RM: {s.rm}</div>
                  <div className="text-sm font-black text-white">{s.name}</div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Slot Kosong</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Available</span>
                </div>
              )}
            </div>

            {/* AI Risk / Status & Action */}
            <div className="flex items-center gap-4">
              {s.booked && (
                <div className="text-right">
                  {s.aiRisk === 'HIGH' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/20 border border-red-500/40 px-2.5 py-1 rounded-lg animate-pulse">
                      ⚠️ High No-Show Risk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                      ✓ Confirmed Arrival
                    </span>
                  )}
                </div>
              )}

              {s.booked ? (
                <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                  Edit Booking
                </button>
              ) : (
                <button className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider">
                  Reserve Slot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
