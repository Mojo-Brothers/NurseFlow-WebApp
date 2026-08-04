import React from 'react';
import { Activity, ShieldCheck, FileSignature, AlertTriangle, Save, HeartPulse } from 'lucide-react';

export default function PreAnesthesiaAssessmentForm({ formData, setFormData, isSaving, onSave }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="p-8 md:p-12 rounded-[3.5rem] bg-purple-500/5 border-2 border-purple-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-10 opacity-[0.03] pointer-events-none">
             <HeartPulse size={160} />
          </div>
          <div className="w-20 h-20 rounded-[2rem] bg-purple-500 flex items-center justify-center text-white shadow-2xl shadow-purple-500/20 rotate-3 shrink-0">
             <HeartPulse size={40} />
          </div>
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter text-purple-700">Asesmen Pra-Anestesi & Sedasi</h3>
             <p className="text-[11px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1 text-purple-800">Evaluasi Kelayakan Pre-Operatif (ASC.4)</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Klasifikasi Status Fisik (ASA)</label>
                <div className="grid grid-cols-1 gap-3">
                   {[
                      { l: 'ASA I', d: 'Pasien sehat normal' },
                      { l: 'ASA II', d: 'Penyakit sistemik ringan' },
                      { l: 'ASA III', d: 'Penyakit sistemik berat' },
                      { l: 'ASA IV', d: 'Penyakit sistemik berat mengancam jiwa' },
                      { l: 'ASA V', d: 'Harapan hidup < 24 jam tanpa operasi' }
                   ].map(asa => (
                      <label key={asa.l} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 cursor-pointer hover:border-purple-500/30 transition-all group">
                         <div>
                            <span className="text-sm font-black text-[var(--on-surface)] uppercase tracking-widest">{asa.l}</span>
                            <p className="text-[10px] font-bold text-[var(--on-surface-variant)] mt-1">{asa.d}</p>
                         </div>
                         <input type="radio" name="asa" className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                      </label>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Asesmen Jalan Napas (Mallampati)</label>
                <div className="flex gap-4">
                   {['I', 'II', 'III', 'IV'].map(score => (
                      <button key={score} className="flex-1 py-6 rounded-[2rem] bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 hover:border-purple-500 text-lg font-black transition-all shadow-sm">
                         {score}
                      </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-4">Rencana Teknik Anestesi</label>
                <div className="flex flex-wrap gap-3">
                   {['Anestesi Umum', 'Spinal', 'Epidural', 'Blok Perifer', 'Lokal', 'Sedasi Moderat', 'Sedasi Dalam'].map(tech => (
                      <label key={tech} className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                         <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                         <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{tech}</span>
                      </label>
                   ))}
                </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-purple-500/5 border-2 border-purple-500/20">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-700 mb-4">Penyulit / Risiko Tambahan</h4>
                <textarea 
                   className="w-full bg-white dark:bg-black/20 border border-purple-500/10 rounded-[1.5rem] p-5 text-sm font-bold min-h-[100px] outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner"
                   placeholder="Alergi obat anestesi, riwayat asma berat, dll..."
                />
             </div>
          </div>
       </div>

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving}
             className="px-10 py-5 rounded-[2rem] bg-purple-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <FileSignature size={18} />}
             Simpan Asesmen
          </button>
       </div>
    </div>
  );
}
