import React, { useState } from 'react';

export default function BmiModalSlider({ isOpen, onClose, initialBb = 68, initialTb = 170, onSave }) {
  const [bb, setBb] = useState(initialBb);
  const [tb, setTb] = useState(initialTb);

  if (!isOpen) return null;

  const lastVisitBb = 70;
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
        <div className="p-5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">show_chart</span>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Kalkulator BMI & Riwayat Kunjungan
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs font-medium">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-base">history</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold">Kunjungan Lalu:</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{lastVisitBb} kg</span>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              Number(diffBb) <= 0 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            }`}>
              {Number(diffBb) > 0 ? `+${diffBb}` : diffBb} kg
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Berat Badan (BB):</label>
              <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">{bb} kg</span>
            </div>
            <input 
              type="range" 
              min="30" 
              max="200" 
              value={bb} 
              onChange={(e) => setBb(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Tinggi Badan (TB):</label>
              <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">{tb} cm</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="220" 
              value={tb} 
              onChange={(e) => setTb(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Hasil Indeks Massa Tubuh (BMI)</p>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">{bmiVal}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black border ${badgeStyle}`}>
              {statusText}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-xs"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
