import React, { useState } from 'react';
import { Activity, ShieldCheck, Thermometer, Brain, Frown, Save, ArrowRight } from 'lucide-react';

export default function PainReassessmentForm({ formData, setFormData, isSaving, onSave }) {
  const [painScore, setPainScore] = useState(0);

  const getPainColor = (score) => {
    if (score === 0) return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
    if (score <= 3) return 'text-green-500 border-green-500 bg-green-500/10';
    if (score <= 6) return 'text-amber-500 border-amber-500 bg-amber-500/10';
    if (score <= 8) return 'text-orange-500 border-orange-500 bg-orange-500/10';
    return 'text-red-500 border-red-500 bg-red-500/10';
  };

  const getPainLabel = (score) => {
    if (score === 0) return 'Tidak Nyeri';
    if (score <= 3) return 'Nyeri Ringan';
    if (score <= 6) return 'Nyeri Sedang';
    if (score <= 8) return 'Nyeri Berat';
    return 'Nyeri Sangat Berat';
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-inner">
                   <Thermometer size={32} />
                </div>
                Re-Asesmen Nyeri
             </h3>
             <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] mt-2">Wajib dilakukan 30-60 menit pasca analgesik (COP.6)</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-black/40 p-10 rounded-[3rem] border-2 border-gray-100 dark:border-white/5 shadow-xl flex flex-col items-center justify-center space-y-8">
             <h4 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface-variant)]">Skor Nyeri Saat Ini (NRS)</h4>
             <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center transition-all duration-500 shadow-2xl ${getPainColor(painScore).replace('text-', 'shadow-').replace('/10', '/30')} ${getPainColor(painScore)}`}>
                <span className="text-7xl font-black">{painScore}</span>
             </div>
             <p className={`text-lg font-black uppercase tracking-widest ${getPainColor(painScore).split(' ')[0]}`}>{getPainLabel(painScore)}</p>
             
             <input 
                type="range" 
                min="0" max="10" 
                value={painScore} 
                onChange={(e) => setPainScore(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
             />
             <div className="w-full flex justify-between text-[10px] font-black uppercase text-[var(--on-surface-variant)]/40 px-2">
                <span>0</span>
                <span>5</span>
                <span>10</span>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-indigo-500/5 border-2 border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">Intervensi Sebelumnya (Otomatis ditarik dari eMAR)</label>
                <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-indigo-500/10">
                   <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0"><Activity size={18} /></div>
                   <div>
                      <p className="text-sm font-black text-[var(--on-surface)]">Ketorolac 30mg IV</p>
                      <p className="text-[10px] font-bold text-[var(--on-surface-variant)] mt-1">Diberikan 45 menit yang lalu oleh Ns. Budi</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Evaluasi Efektivitas</label>
                <select className="w-full p-6 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-bold focus:ring-12 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer shadow-sm">
                   <option value="">Pilih Hasil Evaluasi...</option>
                   <option value="efektif">Nyeri Berkurang (Intervensi Efektif)</option>
                   <option value="tetap">Nyeri Menetap (Perlu intervensi tambahan)</option>
                   <option value="memburuk">Nyeri Bertambah Buruk</option>
                </select>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Rencana Tindak Lanjut</label>
                <div className="flex flex-wrap gap-3">
                   {['Lanjutkan Observasi', 'Lapor DPJP', 'Kolaborasi Analgesik Tambahan', 'Non-Farmakologi (Relaksasi)'].map(plan => (
                      <button key={plan} className="px-5 py-3 rounded-[1.2rem] bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
                         {plan}
                      </button>
                   ))}
                </div>
             </div>
          </div>
       </div>

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving}
             className="px-10 py-5 rounded-[2rem] bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
             Simpan Re-Asesmen Nyeri
          </button>
       </div>
    </div>
  );
}
