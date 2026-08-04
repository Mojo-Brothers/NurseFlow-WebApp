import React, { useState, useEffect } from 'react';
import { Apple, Scale, Calculator, Save, AlertTriangle, ArrowRight, Salad } from 'lucide-react';

export default function NutritionScreeningForm({ formData, setFormData, isSaving, onSave }) {
  const [q1, setQ1] = useState(0); // BB turun
  const [q1Score, setQ1Score] = useState(0); // Skor penurunan BB
  const [q2, setQ2] = useState(0); // Asupan makan turun

  const totalScore = q1 + q1Score + q2;
  const isHighRisk = totalScore >= 2;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--on-surface)] flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-orange-500/10 text-orange-600 flex items-center justify-center">
                   <Apple size={28} />
                </div>
                Skrining Gizi (MST)
             </h3>
             <p className="text-[11px] font-bold opacity-40 uppercase tracking-[0.2em] mt-2 ml-18">Malnutrition Screening Tool (Dewasa) • Wajib 1x24 Jam AOP.1.2</p>
          </div>
          
          <div className={`px-8 py-5 rounded-[2rem] border-2 flex items-center gap-4 transition-all duration-500 shadow-xl ${isHighRisk ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
             <Calculator size={24} />
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Skor MST</p>
                <p className="text-2xl font-black">{totalScore}</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-8">
          <div className="p-8 md:p-10 rounded-[3rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)] flex items-center gap-3">
                   <span className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">1</span>
                   Apakah pasien mengalami penurunan berat badan yang tidak direncanakan dalam 6 bulan terakhir?
                </h4>
             </div>
             
             <div className="flex flex-wrap gap-4 ml-11">
                {[
                   { label: 'Tidak', val: 0 },
                   { label: 'Tidak Yakin (Baju Terasa Longgar)', val: 2 },
                   { label: 'Ya', val: 'ya' }
                ].map(opt => (
                   <button
                      key={opt.label}
                      onClick={() => {
                         setQ1(opt.val === 'ya' ? 0 : opt.val);
                         if (opt.val !== 'ya') setQ1Score(0);
                      }}
                      className={`px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest border-2 transition-all ${q1 === opt.val || (opt.val === 'ya' && typeof q1 === 'number' && q1Score > 0) ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-black/40 border-gray-100 dark:border-white/5 text-[var(--on-surface-variant)] hover:border-orange-500/30'}`}
                   >
                      {opt.label}
                   </button>
                ))}
             </div>

             {(typeof q1 === 'number' && q1Score > 0 || q1 === 'ya') && (
                <div className="ml-11 p-6 rounded-[2rem] bg-orange-500/5 border-2 border-orange-500/10 animate-in fade-in slide-in-from-top-4 space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Berapa penurunan berat badannya (Kg)?</p>
                   <div className="flex flex-wrap gap-3">
                      {[
                         { l: '1 - 5 Kg', v: 1 },
                         { l: '6 - 10 Kg', v: 2 },
                         { l: '11 - 15 Kg', v: 3 },
                         { l: '> 15 Kg', v: 4 },
                         { l: 'Tidak Tahu Pasti', v: 2 }
                      ].map(sc => (
                         <button
                            key={sc.l}
                            onClick={() => { setQ1('ya'); setQ1Score(sc.v); }}
                            className={`px-6 py-3 rounded-xl text-[10px] font-bold transition-all border ${q1Score === sc.v ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/50 dark:bg-black/20 border-orange-500/20 text-orange-700 hover:bg-orange-500/10'}`}
                         >
                            {sc.l} (Skor: {sc.v})
                         </button>
                      ))}
                   </div>
                </div>
             )}
          </div>

          <div className="p-8 md:p-10 rounded-[3rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)] flex items-center gap-3">
                   <span className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">2</span>
                   Apakah asupan makan pasien berkurang karena penurunan nafsu makan / gangguan menelan?
                </h4>
             </div>
             <div className="flex flex-wrap gap-4 ml-11">
                <button
                   onClick={() => setQ2(0)}
                   className={`px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest border-2 transition-all ${q2 === 0 ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-black/40 border-gray-100 dark:border-white/5 text-[var(--on-surface-variant)] hover:border-orange-500/30'}`}
                >
                   Tidak
                </button>
                <button
                   onClick={() => setQ2(1)}
                   className={`px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest border-2 transition-all ${q2 === 1 ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-black/40 border-gray-100 dark:border-white/5 text-[var(--on-surface-variant)] hover:border-orange-500/30'}`}
                >
                   Ya
                </button>
             </div>
          </div>
       </div>

       {isHighRisk && (
         <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-bottom-4">
            <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
               <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
               <h4 className="text-sm font-black text-red-600 uppercase tracking-widest">Risiko Malnutrisi Tinggi!</h4>
               <p className="text-xs font-bold text-red-700/80 mt-1">Skor MST ≥ 2 memerlukan intervensi gizi mendalam. Sistem akan secara otomatis membuat order konsultasi ke Ahli Gizi Klinis (Dietisien) setelah form ini disimpan.</p>
            </div>
            <button className="px-6 py-4 rounded-[1.5rem] bg-white border border-red-500/20 text-red-600 text-[10px] font-black uppercase tracking-widest shadow-sm hidden md:flex items-center gap-2 hover:bg-red-50">
               <Salad size={16} /> Order Gizi Aktif
            </button>
         </div>
       )}

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving}
             className="px-10 py-5 rounded-[2rem] bg-orange-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
             Simpan Asesmen MST
          </button>
       </div>
    </div>
  );
}
