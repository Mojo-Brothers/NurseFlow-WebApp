import React, { useState } from 'react';
import { Droplets, ShieldCheck, Activity, AlertTriangle, Save, UserCheck, Search, Info } from 'lucide-react';

export default function BloodTransfusionForm({ formData, setFormData, isSaving, onSave }) {
  const [activeTab, setActiveTab] = useState('verification'); // verification, monitoring, reaction

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="p-8 md:p-12 rounded-[3.5rem] bg-red-500/5 border-2 border-red-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-10 opacity-[0.03] pointer-events-none">
             <Droplets size={160} />
          </div>
          <div className="w-20 h-20 rounded-[2rem] bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/20 rotate-3 shrink-0">
             <Droplets size={40} />
          </div>
          <div>
             <h3 className="text-3xl font-black uppercase tracking-tighter text-red-600">Protokol Transfusi Darah</h3>
             <p className="text-[11px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1 text-red-700">Double Check & Monitoring Tanda Vital (IPSG.1 & COP.3.3)</p>
          </div>
       </div>

       <div className="flex bg-gray-100/50 dark:bg-white/5 p-2 rounded-[2rem] gap-2">
          {['verification', 'monitoring', 'reaction'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-300 ${activeTab === tab ? 'bg-white dark:bg-black/40 text-red-600 shadow-sm' : 'text-[var(--on-surface-variant)] hover:bg-white/50 dark:hover:bg-black/20'}`}
             >
               {tab === 'verification' ? 'Double Check' : tab === 'monitoring' ? 'Monitoring Vital' : 'Reaksi Transfusi'}
             </button>
          ))}
       </div>

       {activeTab === 'verification' && (
         <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Nomor Kantong Darah</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Search size={20} className="text-[var(--on-surface-variant)] opacity-40" />
                   </div>
                   <input 
                      type="text"
                      className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-bold focus:ring-12 focus:ring-red-500/5 focus:border-red-500 outline-none transition-all shadow-sm uppercase placeholder:normal-case"
                      placeholder="Scan atau ketik nomor kantong..."
                   />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Jenis Produk Darah</label>
                 <select className="w-full p-6 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-bold focus:ring-12 focus:ring-red-500/5 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer shadow-sm">
                    <option value="">Pilih Produk...</option>
                    <option value="PRC">Packed Red Cells (PRC)</option>
                    <option value="WB">Whole Blood (WB)</option>
                    <option value="TC">Thrombocyte Concentrate (TC)</option>
                    <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                    <option value="Cryo">Cryoprecipitate</option>
                 </select>
              </div>
           </div>

           <div className="bg-red-500/5 border-2 border-red-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
              <h4 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck size={18} /> Independent Double Check</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {['Kesesuaian Identitas Pasien', 'Kesesuaian Golongan Darah (ABO/Rh)', 'Kesesuaian Nomor Kantong & Crossmatch', 'Tanggal Kedaluwarsa & Kondisi Fisik Darah'].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                       <span className="text-xs font-bold text-[var(--on-surface-variant)]">{item}</span>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                       </label>
                    </div>
                 ))}
              </div>
              <div className="mt-8 pt-8 border-t border-red-500/20 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 ml-4">Perawat 1 (Pelaksana)</label>
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-[1.5rem] border border-red-500/20 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"><UserCheck size={18} /></div>
                       <div>
                          <p className="text-sm font-bold text-[var(--on-surface)]">Ns. Anita Sari</p>
                          <p className="text-[10px] font-bold text-[var(--on-surface-variant)] opacity-60">Verified via PIN</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 ml-4">Perawat 2 (Verifikator)</label>
                    <button className="w-full p-4 bg-white dark:bg-black/40 rounded-[1.5rem] border-2 border-dashed border-red-500/40 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-500/5 transition-all">
                       Tap untuk Verifikasi (Perawat 2)
                    </button>
                 </div>
              </div>
           </div>
         </div>
       )}

       {activeTab === 'monitoring' && (
         <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-amber-500/5 border-2 border-amber-500/20 p-6 rounded-[2.5rem] flex items-start gap-4">
               <Info size={24} className="text-amber-600 shrink-0 mt-1" />
               <p className="text-sm font-bold text-amber-700 leading-relaxed">
                  Pemantauan ketat wajib dilakukan pada <strong className="font-black">15 menit pertama</strong> sejak darah mulai masuk. Reaksi fatal paling sering terjadi pada fase ini.
               </p>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-separate border-spacing-y-4">
                  <thead>
                     <tr>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">Fase Waktu</th>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">TD (mmHg)</th>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">Nadi (x/m)</th>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">Suhu (°C)</th>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">RR (x/m)</th>
                        <th className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]/60">Aksi</th>
                     </tr>
                  </thead>
                  <tbody>
                     {['Pre-Transfusi (0 mnt)', '15 Menit Pertama', '30 Menit', 'Post-Transfusi'].map((fase, i) => (
                        <tr key={i} className="group">
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-l border-gray-100 dark:border-white/5 rounded-l-[1.5rem] group-hover:bg-[var(--surface-container-high)] transition-all">
                              <span className="text-xs font-black text-[var(--on-surface)]">{fase}</span>
                           </td>
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-gray-100 dark:border-white/5">
                              <input type="text" className="w-16 bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center text-xs font-bold outline-none border border-gray-200 dark:border-white/10" placeholder="120/80" />
                           </td>
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-gray-100 dark:border-white/5">
                              <input type="text" className="w-16 bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center text-xs font-bold outline-none border border-gray-200 dark:border-white/10" placeholder="80" />
                           </td>
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-gray-100 dark:border-white/5">
                              <input type="text" className="w-16 bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center text-xs font-bold outline-none border border-gray-200 dark:border-white/10" placeholder="36.5" />
                           </td>
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-gray-100 dark:border-white/5">
                              <input type="text" className="w-16 bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center text-xs font-bold outline-none border border-gray-200 dark:border-white/10" placeholder="20" />
                           </td>
                           <td className="px-6 py-4 bg-white dark:bg-black/40 border-y border-r border-gray-100 dark:border-white/5 rounded-r-[1.5rem]">
                              <button className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"><Activity size={16} /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
       )}

       {activeTab === 'reaction' && (
         <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="p-8 rounded-[2.5rem] border-2 border-red-500/20 bg-red-500/5 space-y-6">
               <div className="flex items-center gap-4">
                  <AlertTriangle size={24} className="text-red-600" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-red-600">Catatan Reaksi Transfusi</h4>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Gatal / Urtikaria', 'Demam > 38°C', 'Menggigil', 'Sesak Napas', 'Nyeri Dada', 'Nyeri Pinggang', 'Urin Gelap', 'Hipotensi'].map((rx, idx) => (
                     <label key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 cursor-pointer hover:border-red-500/50 transition-all">
                        <input type="checkbox" className="w-5 h-5 rounded text-red-500 focus:ring-red-500/50 bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10" />
                        <span className="text-xs font-bold text-[var(--on-surface-variant)]">{rx}</span>
                     </label>
                  ))}
               </div>

               <div className="space-y-4 pt-4 border-t border-red-500/20">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 ml-4">Tindakan Khusus & Keterangan</label>
                  <textarea 
                     className="w-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-[2rem] p-6 text-sm font-bold min-h-[120px] focus:ring-12 focus:ring-red-500/5 focus:border-red-500 transition-all outline-none leading-relaxed placeholder:opacity-30 shadow-sm"
                     placeholder="Bila ada reaksi, jelaskan waktu timbul reaksi, tindakan yang dilakukan (misal: stop transfusi, lapor DPJP), dan obat yang diberikan..."
                  />
               </div>
            </div>
         </div>
       )}

       <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-white/5">
          <button
             onClick={onSave}
             disabled={isSaving}
             className="px-10 py-5 rounded-[2rem] bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
             {isSaving ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
             Simpan Protokol Transfusi
          </button>
       </div>
    </div>
  );
}
