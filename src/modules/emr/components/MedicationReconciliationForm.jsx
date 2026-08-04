import React from 'react';
import { Pill, Activity, RotateCcw, Save, ShieldAlert, ArrowRightLeft } from 'lucide-react';

export default function MedicationReconciliationForm({ formData, setFormData, isSaving, onSave }) {
  const homeMeds = [
    { name: 'Amlodipine 5mg', dose: '1x1 Pagi', status: 'Lanjutkan' },
    { name: 'Metformin 500mg', dose: '3x1 Bersama Makan', status: 'Hentikan (Diganti Insulin)' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                   <ArrowRightLeft size={32} />
                </div>
                Rekonsiliasi Obat
             </h3>
             <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] mt-2">Mencegah duplikasi, interaksi, & omission (MMU.4)</p>
          </div>
       </div>

       <div className="bg-emerald-500/5 border-2 border-emerald-500/20 p-8 md:p-12 rounded-[3rem] space-y-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-12 opacity-[0.03] pointer-events-none">
             <Pill size={200} />
          </div>
          
          <h4 className="text-sm font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2 relative z-10">
             <RotateCcw size={18} /> Obat Bawaan dari Rumah (Home Medications)
          </h4>
          
          <div className="space-y-4 relative z-10">
             {homeMeds.map((med, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-black/40 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm gap-6">
                   <div className="flex-1">
                      <p className="text-lg font-black text-[var(--on-surface)]">{med.name}</p>
                      <p className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mt-1">{med.dose}</p>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto">
                      <select className="flex-1 md:w-64 p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer">
                         <option>Lanjutkan saat dirawat</option>
                         <option>Hentikan sementara</option>
                         <option>Ganti dosis / jenis</option>
                      </select>
                   </div>
                </div>
             ))}
             
             <button className="w-full py-6 rounded-[2rem] border-2 border-dashed border-emerald-500/40 text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2">
                + Tambah Obat Bawaan Lainnya
             </button>
          </div>
       </div>

       <div className="bg-amber-500/5 border-2 border-amber-500/20 p-8 rounded-[2.5rem] flex items-start gap-4">
          <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-1" />
          <div>
             <h4 className="text-sm font-black uppercase tracking-widest text-amber-700">Verifikasi Interaksi Obat (Otomatis)</h4>
             <p className="text-[11px] font-bold text-amber-700/80 mt-2 leading-relaxed">
                Tidak terdeteksi interaksi mayor antara obat bawaan yang dilanjutkan dengan obat yang diresepkan via CPOE hari ini.
             </p>
          </div>
       </div>

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving}
             className="px-10 py-5 rounded-[2rem] bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
             Sahkan Rekonsiliasi
          </button>
       </div>
    </div>
  );
}
