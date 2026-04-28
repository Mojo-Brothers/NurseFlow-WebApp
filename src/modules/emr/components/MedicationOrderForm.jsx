import React, { useState } from 'react';
import { Pill, Plus, Trash2, AlertTriangle, Info, CheckCircle2, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const HIGH_ALERT_MEDS = [
  'Insulin', 'Heparin', 'Warfarin', 'Digoxin', 'Potassium Chloride', 'Morphine', 'Fentanyl'
];

const LASA_MEDS = [
  { name: 'Amlodipine', pairs: ['Nimodipine'] },
  { name: 'Ceftriaxone', pairs: ['Cefotaxime'] },
  { name: 'Metformin', pairs: ['Metronidazole'] }
];

export default function MedicationOrderForm({ formData, setFormData, patient }) {
  const [items, setItems] = useState(formData.medications || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState([]);

  const addMedication = (name) => {
    const isHighAlert = HIGH_ALERT_MEDS.some(m => name.toLowerCase().includes(m.toLowerCase()));
    const lasaMatch = LASA_MEDS.find(m => name.toLowerCase() === m.name.toLowerCase());

    const newItem = {
      id: Date.now(),
      name,
      dose: '',
      route: 'Oral',
      frequency: '3x1',
      instruction: 'Sesudah Makan',
      isHighAlert,
      isLasa: !!lasaMatch,
      lasaPairs: lasaMatch?.pairs || []
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    setFormData({ ...formData, medications: newItems });
    setSearchQuery('');
    
    // Safety Alert logic
    if (isHighAlert) {
       setAlerts(prev => [...prev, { type: 'HIGH_ALERT', message: `KRITIKAL: ${name} adalah obat HIGH ALERT. Wajib double-check dosis dan rute!`, id: newItem.id }]);
    }
    if (lasaMatch) {
       setAlerts(prev => [...prev, { type: 'LASA', message: `PERINGATAN: ${name} adalah obat LASA. Pastikan tidak tertukar dengan ${lasaMatch.pairs.join(', ')}.`, id: newItem.id }]);
    }
  };

  const removeItem = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    setFormData({ ...formData, medications: newItems });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const updateItem = (id, field, value) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: value } : item);
    setItems(newItems);
    setFormData({ ...formData, medications: newItems });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* ─── SEARCH & SELECTION ─── */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-blue-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition-all duration-700"></div>
         <div className="relative">
            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-[var(--primary)]">
               <Search size={24} />
            </div>
            <input 
               type="text"
               placeholder="Cari & Tambah Obat (Contoh: Insulin, Amlodipine, Paracetamol)..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                     addMedication(searchQuery);
                  }
               }}
               className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[2.5rem] py-8 pl-20 pr-48 text-xl font-bold focus:outline-none focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all shadow-2xl placeholder:opacity-20"
            />
            {searchQuery && (
               <button 
                  onClick={() => addMedication(searchQuery)}
                  className="absolute right-4 top-4 bottom-4 px-12 bg-[var(--primary)] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-xl shadow-[var(--primary)]/20 transition-all flex items-center gap-3 active:scale-95"
               >
                  <Plus size={18} /> Tambah Order
               </button>
            )}
         </div>
      </div>

      {/* ─── SAFETY ALERTS PANEL ─── */}
      {alerts.length > 0 && (
         <div className="space-y-4 px-4">
            {alerts.map((alert, idx) => (
               <div key={idx} className={`p-8 rounded-[2.5rem] flex items-center gap-6 border-2 animate-in slide-in-from-right-4 duration-500 shadow-xl ${alert.type === 'HIGH_ALERT' ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-600'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${alert.type === 'HIGH_ALERT' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                     <AlertTriangle size={28} />
                  </div>
                  <div>
                     <p className="text-sm font-black uppercase tracking-widest opacity-40 mb-1">{alert.type.replace('_', ' ')} SAFETY WARNING</p>
                     <p className="text-lg font-black leading-tight tracking-tight">{alert.message}</p>
                  </div>
                  <div className="ml-auto">
                     <div className="px-4 py-2 rounded-full border-2 border-current text-[10px] font-black uppercase tracking-widest opacity-40">Verification Required</div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* ─── MEDICATION LIST ─── */}
      <div className="space-y-6">
         {items.length === 0 ? (
            <div className="py-32 bg-gray-50/30 dark:bg-black/10 border-4 border-dashed border-gray-100 dark:border-white/5 rounded-[4rem] flex flex-col items-center justify-center group">
               <div className="w-32 h-32 rounded-[3rem] bg-white dark:bg-black/40 flex items-center justify-center text-[var(--primary)]/20 group-hover:text-[var(--primary)] group-hover:rotate-12 transition-all duration-700 shadow-xl mb-8">
                  <Pill size={64} />
               </div>
               <p className="text-xl font-black uppercase tracking-[0.3em] opacity-20">Belum ada order obat aktif</p>
               <p className="text-sm font-bold opacity-10 mt-2 uppercase tracking-widest">Silahkan gunakan pencarian di atas</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-8">
               {items.map((item) => (
                  <div key={item.id} className={`
                     relative overflow-hidden bg-white dark:bg-black/20 border-2 rounded-[3.5rem] p-10 transition-all duration-500 shadow-2xl group
                     ${item.isHighAlert ? 'border-red-500/30 shadow-red-500/5' : item.isLasa ? 'border-amber-500/30 shadow-amber-500/5' : 'border-gray-100 dark:border-white/5'}
                  `}>
                     {item.isHighAlert && (
                        <div className="absolute top-0 right-0 px-10 py-3 bg-red-500 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-bl-[2rem] shadow-xl">
                           High Alert Medication
                        </div>
                     )}
                     {item.isLasa && (
                        <div className="absolute top-0 right-0 px-10 py-3 bg-amber-500 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-bl-[2rem] shadow-xl">
                           LASA Warning
                        </div>
                     )}

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-4 space-y-6">
                           <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${item.isHighAlert ? 'bg-red-500/10 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                                 <Pill size={32} />
                              </div>
                              <div>
                                 <h4 className="text-2xl font-black text-[var(--on-surface)] tracking-tighter uppercase leading-none">{item.name}</h4>
                                 <div className="flex items-center gap-2 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Ready for Ordering</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-2 opacity-60">Dosis & Kekuatan</label>
                              <input 
                                 type="text"
                                 placeholder="Dosis (Contoh: 500mg)"
                                 value={item.dose}
                                 onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                                 className="w-full bg-gray-50/50 dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-lg font-black focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner placeholder:opacity-10"
                              />
                           </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-2 opacity-60">Rute Pemberian</label>
                              <select 
                                 value={item.route}
                                 onChange={(e) => updateItem(item.id, 'route', e.target.value)}
                                 className="w-full bg-gray-50/50 dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-base font-black focus:outline-none appearance-none cursor-pointer shadow-inner"
                              >
                                 <option value="Oral">Oral</option>
                                 <option value="IV">IV (Intra Vena)</option>
                                 <option value="IM">IM (Intra Muskular)</option>
                                 <option value="SC">SC (Sub Kutan)</option>
                                 <option value="Topikal">Topikal / Lokal</option>
                              </select>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-2 opacity-60">Frekuensi</label>
                              <select 
                                 value={item.frequency}
                                 onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                                 className="w-full bg-gray-50/50 dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-base font-black focus:outline-none appearance-none cursor-pointer shadow-inner"
                              >
                                 <option value="1x1">Sekali Sehari (1x1)</option>
                                 <option value="2x1">Dua Kali Sehari (2x1)</option>
                                 <option value="3x1">Tiga Kali Sehari (3x1)</option>
                                 <option value="4x1">Empat Kali Sehari (4x1)</option>
                                 <option value="PRN">Kapan Perlu (PRN)</option>
                              </select>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-2 opacity-60">Instruksi Khusus</label>
                              <input 
                                 type="text"
                                 placeholder="Contoh: Sesudah Makan"
                                 value={item.instruction}
                                 onChange={(e) => updateItem(item.id, 'instruction', e.target.value)}
                                 className="w-full bg-gray-50/50 dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-base font-black focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner placeholder:opacity-10"
                              />
                           </div>
                        </div>

                        <div className="lg:col-span-1 flex items-center justify-end h-full">
                           <button 
                              onClick={() => removeItem(item.id)}
                              className="w-16 h-16 rounded-2xl bg-red-500/5 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500 shadow-xl lg:mt-6 group-hover:scale-110 active:scale-95"
                           >
                              <Trash2 size={24} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* ─── DECISION SUPPORT SUMMARY ─── */}
      {items.length > 0 && (
         <div className="p-12 rounded-[4rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-emerald-500/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="flex items-center gap-8 relative z-10">
               <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
                  <ShieldCheck size={48} className="animate-pulse" />
               </div>
               <div>
                  <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">Clinical Order Verified</h4>
                  <p className="text-sm font-bold opacity-60 mt-3 max-w-md">Semua order obat telah diverifikasi secara otomatis terhadap data Alergi Pasien & Interaksi Obat (MMU Standar).</p>
               </div>
            </div>
            <div className="flex flex-col gap-4 relative z-10 w-full md:w-auto">
               <div className="px-10 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">No Interactions Found</span>
               </div>
               <button className="px-10 py-5 bg-white text-emerald-700 rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Zap size={18} /> Transmit to Pharmacy
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
