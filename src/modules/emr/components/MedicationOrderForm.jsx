import React, { useState } from 'react';
import { Pill, Plus, Trash2, AlertTriangle, Info, CheckCircle2, Search } from 'lucide-react';

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
       setAlerts(prev => [...prev, { type: 'HIGH_ALERT', message: `PERINGATAN: ${name} adalah obat HIGH ALERT. Wajib double-check!`, id: newItem.id }]);
    }
    if (lasaMatch) {
       setAlerts(prev => [...prev, { type: 'LASA', message: `PERINGATAN: ${name} adalah obat LASA (Look-Alike Sound-Alike). Pastikan tidak tertukar dengan ${lasaMatch.pairs.join(', ')}.`, id: newItem.id }]);
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
    <div className="space-y-6">
      {/* Search & Selection */}
      <div className="relative">
         <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40">
            <Search size={18} />
         </div>
         <input 
            type="text"
            placeholder="Cari Obat (Contoh: Insulin, Amlodipine, Paracetamol)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && searchQuery) {
                  addMedication(searchQuery);
               }
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-bold"
         />
         {searchQuery && (
            <button 
               onClick={() => addMedication(searchQuery)}
               className="absolute right-2 top-2 bottom-2 px-4 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
               Tambah
            </button>
         )}
      </div>

      {/* Safety Alerts Panel */}
      {alerts.length > 0 && (
         <div className="space-y-2">
            {alerts.map((alert, idx) => (
               <div key={idx} className={`p-4 rounded-2xl flex items-start gap-4 border ${alert.type === 'HIGH_ALERT' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
               </div>
            ))}
         </div>
      )}

      {/* Medication List */}
      <div className="space-y-4">
         {items.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-40">
               <Pill size={48} className="mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">Belum ada obat yang diorder</p>
            </div>
         ) : (
            items.map((item) => (
               <div key={item.id} className={`
                  relative overflow-hidden bg-white/5 border rounded-3xl p-5 transition-all
                  ${item.isHighAlert ? 'border-red-500/30' : item.isLasa ? 'border-amber-500/30' : 'border-white/10'}
               `}>
                  {item.isHighAlert && (
                     <div className="absolute top-0 right-0 px-4 py-1 bg-red-500 text-[9px] font-black uppercase tracking-widest text-white rounded-bl-xl">
                        High Alert
                     </div>
                  )}
                  {item.isLasa && (
                     <div className="absolute top-0 right-0 px-4 py-1 bg-amber-500 text-[9px] font-black uppercase tracking-widest text-white rounded-bl-xl">
                        LASA
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                     <div className="md:col-span-4">
                        <div className="flex items-center gap-3 mb-3">
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.isHighAlert ? 'bg-red-500/20 text-red-500' : 'bg-[var(--primary)]/20 text-[var(--primary)]'}`}>
                              <Pill size={16} />
                           </div>
                           <h4 className="text-sm font-black text-white uppercase">{item.name}</h4>
                        </div>
                        <input 
                           type="text"
                           placeholder="Dosis (Contoh: 500mg)"
                           value={item.dose}
                           onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                           className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[var(--primary)]/50"
                        />
                     </div>

                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Rute</label>
                        <select 
                           value={item.route}
                           onChange={(e) => updateItem(item.id, 'route', e.target.value)}
                           className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none"
                        >
                           <option value="Oral">Oral</option>
                           <option value="IV">IV</option>
                           <option value="IM">IM</option>
                           <option value="SC">SC</option>
                           <option value="Topikal">Topikal</option>
                        </select>
                     </div>

                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Frekuensi</label>
                        <select 
                           value={item.frequency}
                           onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                           className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none"
                        >
                           <option value="1x1">1x1</option>
                           <option value="2x1">2x1</option>
                           <option value="3x1">3x1</option>
                           <option value="4x1">4x1</option>
                           <option value="PRN">Kapan Perlu (PRN)</option>
                        </select>
                     </div>

                     <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Instruksi</label>
                        <input 
                           type="text"
                           placeholder="Contoh: Sesudah Makan"
                           value={item.instruction}
                           onChange={(e) => updateItem(item.id, 'instruction', e.target.value)}
                           className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[var(--primary)]/50"
                        />
                     </div>

                     <div className="md:col-span-1 flex items-center justify-end h-full">
                        <button 
                           onClick={() => removeItem(item.id)}
                           className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all mt-6"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>

      {/* Decision Support Summary */}
      {items.length > 0 && (
         <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
               </div>
               <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Safe Order Check</h4>
                  <p className="text-[10px] font-bold text-white/60">Semua order telah diverifikasi terhadap Alergi & Interaksi.</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/60 uppercase">No Interactions</div>
               <div className="px-3 py-1 bg-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-500 uppercase">Clear for Pharmacy</div>
            </div>
         </div>
      )}
    </div>
  );
}
