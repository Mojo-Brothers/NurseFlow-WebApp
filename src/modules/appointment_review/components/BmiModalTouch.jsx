import React, { useState } from 'react';

export default function BmiModalTouch({ isOpen, onClose, initialBb = 68, initialTb = 170, onSave }) {
  const [bb, setBb] = useState(initialBb);
  const [tb, setTb] = useState(initialTb);

  if (!isOpen) return null;

  const hInM = tb / 100;
  const bmiVal = hInM > 0 ? (bb / (hInM * hInM)).toFixed(1) : '0.0';

  let statusText = 'Normal';
  let badgeColor = 'bg-emerald-500 text-white';
  if (bmiVal < 18.5) {
    statusText = 'Underweight';
    badgeColor = 'bg-amber-500 text-white';
  } else if (bmiVal >= 23 && bmiVal < 25) {
    statusText = 'Overweight';
    badgeColor = 'bg-orange-500 text-white';
  } else if (bmiVal >= 25) {
    statusText = 'Obese';
    badgeColor = 'bg-rose-600 text-white';
  }

  const handleSave = () => {
    if (onSave) onSave(bb, tb);
    onClose();
  };

  const PRESET_WEIGHTS = [50, 55, 60, 65, 68, 70, 75, 80, 85];
  const PRESET_HEIGHTS = [150, 155, 160, 165, 170, 175, 180, 185];

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center p-4 animate-in slide-in-from-bottom duration-300">
      
      {/* Floating Island Card Container */}
      <div className="bg-slate-900/95 text-white backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-5">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400">floating_action_button</span>
            <div>
              <h3 className="font-black text-sm text-white">Floating Island Quick Drawer (New Concept 3)</h3>
              <p className="text-[10px] text-slate-400 font-medium">Pulau Mengambang & Chip Pemilih Angka Cepat Satu-Sentuhan</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>

        {/* Floating Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Weight Chips */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Berat (kg)</span>
              <span className="font-mono font-black text-teal-400 text-lg">{bb} kg</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_WEIGHTS.map(w => (
                <button 
                  key={w} 
                  type="button" 
                  onClick={() => setBb(w)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Number(bb) === w 
                      ? 'bg-teal-500 text-slate-950 font-black shadow-md scale-105' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Height Chips */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Tinggi (cm)</span>
              <span className="font-mono font-black text-cyan-400 text-lg">{tb} cm</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_HEIGHTS.map(h => (
                <button 
                  key={h} 
                  type="button" 
                  onClick={() => setTb(h)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Number(tb) === h 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md scale-105' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Floating Bottom Bar with Live Result */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">HASIL IMT / BMI:</span>
              <span className="text-2xl font-black font-mono text-white">{bmiVal}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
              {statusText}
            </span>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer">
              Batal
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Simpan Seketika
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
