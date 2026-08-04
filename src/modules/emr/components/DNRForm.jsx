import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, Lock, Shield, PenTool, CheckCircle2, UserX } from 'lucide-react';

export default function DNRForm({ formData, setFormData, isSaving, onSave }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="p-8 md:p-12 rounded-[3.5rem] bg-slate-800 border-2 border-slate-700 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-10 opacity-5 pointer-events-none">
             <UserX size={160} />
          </div>
          <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center shadow-2xl shadow-red-500/10 rotate-3 shrink-0">
             <ShieldAlert size={40} />
          </div>
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Do Not Resuscitate (DNR)</h3>
             <p className="text-[11px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1 text-slate-300">Advanced Directives / Penolakan Resusitasi Jantung Paru (PFR.1.5)</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Nama Keluarga / Wali</label>
             <input 
                type="text"
                className="w-full px-8 py-6 rounded-[2rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 text-lg font-bold focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all"
                placeholder="Nama pihak yang memberi keputusan..."
             />
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Hubungan dengan Pasien</label>
             <select className="w-full px-8 py-6 rounded-[2rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 text-lg font-bold focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all appearance-none cursor-pointer">
                <option value="">Pilih Hubungan...</option>
                <option value="Suami/Istri">Suami / Istri</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Anak">Anak</option>
                <option value="Saudara Kandung">Saudara Kandung</option>
                <option value="Diri Sendiri">Diri Sendiri (Pasien)</option>
             </select>
          </div>
       </div>

       <div className="bg-red-500/5 border-2 border-red-500/20 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
          <div className="flex gap-6 relative z-10">
             <div className="shrink-0 mt-1">
                <ShieldAlert size={28} className="text-red-600" />
             </div>
             <div className="space-y-6 text-sm font-bold text-[var(--on-surface-variant)] leading-relaxed text-justify">
                <p>
                   Dengan ini saya menyatakan bahwa saya telah menerima penjelasan yang memadai mengenai kondisi medis, prognosis, dan manfaat serta risiko dari Resusitasi Jantung Paru (RJP/CPR) yang mungkin diberikan apabila terjadi henti napas atau henti jantung.
                </p>
                <p>
                   Berdasarkan pemahaman tersebut dan dalam keadaan sadar tanpa paksaan dari pihak manapun, saya memutuskan untuk <strong className="font-black text-red-600 uppercase">MENOLAK</strong> dilakukannya tindakan Resusitasi Jantung Paru (Do Not Resuscitate) maupun pemasangan alat bantu napas mekanik (Ventilator).
                </p>
                <p>
                   Keputusan ini diambil setelah berdiskusi dengan Dokter Penanggung Jawab Pelayanan (DPJP) demi menjaga martabat dan mencegah penderitaan yang tidak perlu.
                </p>
             </div>
          </div>
          
          <div className="mt-10 flex flex-col md:flex-row items-center gap-6 pt-10 border-t border-red-500/20">
             <label className="flex-1 flex items-center gap-4 cursor-pointer group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-inner ${agreed ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-transparent group-hover:bg-red-500/20'}`}>
                   <CheckCircle2 size={18} />
                </div>
                <input type="checkbox" className="hidden" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className={`text-sm font-black uppercase tracking-widest ${agreed ? 'text-red-600' : 'text-[var(--on-surface-variant)] opacity-60'}`}>
                   Saya Memahami & Menyetujui
                </span>
             </label>

             {agreed && (
               <div className="flex-1 flex gap-4 animate-in fade-in slide-in-from-right-4">
                  <button className="flex-1 p-5 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-dashed border-red-500/30 text-red-600 flex items-center justify-center gap-3 hover:bg-red-500/5 transition-all">
                     <Fingerprint size={20} /> <span className="text-xs font-black uppercase tracking-widest">Biometrik Wali</span>
                  </button>
                  <button className="flex-1 p-5 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-dashed border-blue-500/30 text-blue-600 flex items-center justify-center gap-3 hover:bg-blue-500/5 transition-all">
                     <Lock size={20} /> <span className="text-xs font-black uppercase tracking-widest">Digital Sign DPJP</span>
                  </button>
               </div>
             )}
          </div>
       </div>

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving || !agreed}
             className="px-10 py-5 rounded-[2rem] bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <Shield size={18} />}
             Aktifkan Status DNR
          </button>
       </div>
    </div>
  );
}
