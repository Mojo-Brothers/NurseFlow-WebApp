import React, { useState } from 'react';

export default function BmiModalSlider({ isOpen, onClose, initialBb = 68, initialTb = 170, onSave }) {
  const [bb, setBb] = useState(initialBb);
  const [tb, setTb] = useState(initialTb);

  if (!isOpen) return null;

  const lastVisitBb = 70; // 2kg higher on previous visit
  const diffBb = (bb - lastVisitBb).toFixed(1);

  const hInM = tb / 100;
  const bmiVal = hInM > 0 ? (bb / (hInM * hInM)).toFixed(1) : '0.0';

  let statusText = 'Normal';
  let badgeStyle = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300';
  if (bmiVal < 18.5) {
    statusText = 'Underweight';
    badgeStyle = 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300';
  } else if (bmiVal >= 23 && bmiVal < 25) {
    statusText = 'Overweight';
    badgeStyle = 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300';
  } else if (bmiVal >= 25) {
    statusText = 'Obese';
    badgeStyle = 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300';
  }

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) onSave(bb, tb);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">show_chart</span>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Stepper & Historical Visit Trend (New Concept 2)
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs font-medium">
          
          {/* Historical Trend Badge */}
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-base">history</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold">Kunjungan Lalu (05/08/2026):</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{lastVisitBb} kg</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${diffBb < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {diffBb < 0 ? `${diffBb} kg` : `+${diffBb} kg`}
            </span>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Weight Stepper */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[10px] block">Berat (kg)</label>
              <div className="text-center font-mono font-black text-3xl text-slate-900 dark:text-white">{bb}</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => setBb(Math.max(1, Number(bb) - 1))} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">-1 kg</button>
                <button type="button" onClick={() => setBb(Number(bb) + 1)} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">+1 kg</button>
                <button type="button" onClick={() => setBb(Math.max(1, Number(bb) - 5))} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">-5 kg</button>
                <button type="button" onClick={() => setBb(Number(bb) + 5)} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">+5 kg</button>
              </div>
            </div>

            {/* Height Stepper */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[10px] block">Tinggi (cm)</label>
              <div className="text-center font-mono font-black text-3xl text-slate-900 dark:text-white">{tb}</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => setTb(Math.max(1, Number(tb) - 1))} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">-1 cm</button>
                <button type="button" onClick={() => setTb(Number(tb) + 1)} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">+1 cm</button>
                <button type="button" onClick={() => setTb(Math.max(1, Number(tb) - 5))} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">-5 cm</button>
                <button type="button" onClick={() => setTb(Number(tb) + 5)} className="py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100 cursor-pointer">+5 cm</button>
              </div>
            </div>

          </div>

          {/* BMI Result Bar */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Indeks Massa Tubuh (BMI)</span>
              <span className="text-2xl font-black text-teal-600 font-mono">{bmiVal}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${badgeStyle}`}>
              {statusText}
            </span>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            Simpan & Catat Tren
          </button>
        </form>

      </div>
    </div>
  );
}
