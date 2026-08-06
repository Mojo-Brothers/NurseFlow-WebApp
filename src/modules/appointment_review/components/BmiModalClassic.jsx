import React, { useState } from 'react';

export default function BmiModalClassic({ isOpen, onClose, initialBb = 68, initialTb = 170, onSave }) {
  const [bb, setBb] = useState(initialBb);
  const [tb, setTb] = useState(initialTb);

  if (!isOpen) return null;

  const hInM = tb / 100;
  const bmiVal = hInM > 0 ? (bb / (hInM * hInM)).toFixed(1) : '0.0';

  // Calculate ideal weight range (BMI 18.5 - 22.9 for Asia-Pacific)
  const minIdealBb = (18.5 * (hInM * hInM)).toFixed(1);
  const maxIdealBb = (22.9 * (hInM * hInM)).toFixed(1);

  let category = 'Normal';
  let badgeColor = 'bg-emerald-500 text-white';
  let ringColor = 'border-emerald-500';

  if (bmiVal < 18.5) {
    category = 'Kurus (Underweight)';
    badgeColor = 'bg-amber-500 text-white';
    ringColor = 'border-amber-500';
  } else if (bmiVal >= 23 && bmiVal < 25) {
    category = 'Kelebihan BB (Overweight)';
    badgeColor = 'bg-orange-500 text-white';
    ringColor = 'border-orange-500';
  } else if (bmiVal >= 25) {
    category = 'Obesitas (Obese)';
    badgeColor = 'bg-rose-600 text-white';
    ringColor = 'border-rose-600';
  }

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) onSave(bb, tb);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full max-w-xl rounded-3xl shadow-2xl border border-teal-500/30 overflow-hidden flex flex-col">
        
        {/* Header Banner */}
        <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 border-b border-teal-500/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <span className="material-symbols-outlined">accessibility_new</span>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Biometric Body Avatar & Target Gauge</h2>
              <p className="text-xs text-teal-300 font-medium">New Concept 1: Siluet Tubuh Biometrik & Rentang Berat Ideal</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">
          
          {/* Main Grid: Body Silhouette vs Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Visual Body Silhouette Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
              
              {/* Ring Gauge Center */}
              <div className={`w-28 h-28 rounded-full border-4 ${ringColor} flex flex-col items-center justify-center shadow-lg relative bg-slate-900/80 backdrop-blur-xs`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase">IMT Pasien</span>
                <span className="text-3xl font-black font-mono text-white">{bmiVal}</span>
              </div>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                {category}
              </span>

              <div className="text-center text-[11px] text-slate-400 font-medium">
                Rentang Berat Ideal (Asia-Pasifik):
                <div className="font-bold font-mono text-teal-400 mt-0.5">{minIdealBb} kg - {maxIdealBb} kg</div>
              </div>
            </div>

            {/* Inputs & Quick Modifiers */}
            <div className="space-y-4">
              
              {/* Weight Modifier */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Berat Badan (kg):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.5" 
                    value={bb} 
                    onChange={(e) => setBb(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-black text-lg text-white text-center focus:ring-2 focus:ring-teal-500 outline-none" 
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[-2, -1, +1, +2].map((v) => (
                    <button 
                      key={v} 
                      type="button" 
                      onClick={() => setBb(Number(bb) + v)}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] border border-slate-700 cursor-pointer"
                    >
                      {v > 0 ? `+${v}` : v} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Height Modifier */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Tinggi Badan (cm):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="1" 
                    value={tb} 
                    onChange={(e) => setTb(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-black text-lg text-white text-center focus:ring-2 focus:ring-teal-500 outline-none" 
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[-2, -1, +1, +2].map((v) => (
                    <button 
                      key={v} 
                      type="button" 
                      onClick={() => setTb(Number(tb) + v)}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] border border-slate-700 cursor-pointer"
                    >
                      {v > 0 ? `+${v}` : v} cm
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            Simpan Hasil Biometrik
          </button>
        </form>

      </div>
    </div>
  );
}
