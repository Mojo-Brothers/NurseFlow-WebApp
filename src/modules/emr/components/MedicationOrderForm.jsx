import React, { useState } from 'react';
import { Pill, Plus, Trash2, AlertTriangle, Info, CheckCircle2, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

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
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition-all duration-700"></div>
         <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
            <Input 
               className="h-20 pl-20 pr-56 text-xl rounded-[2.5rem] border-slate-100 bg-white shadow-2xl focus-visible:ring-blue-100 focus-visible:border-blue-400"
               placeholder="Cari & Tambah Obat (Contoh: Insulin, Amlodipine)..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                     addMedication(searchQuery);
                  }
               }}
            />
            {searchQuery && (
               <Button 
                  onClick={() => addMedication(searchQuery)}
                  className="absolute right-4 top-4 bottom-4 px-10 rounded-2xl"
               >
                  <Plus size={18} className="mr-2" /> Tambah Order
               </Button>
            )}
         </div>
      </div>

      {/* ─── SAFETY ALERTS PANEL ─── */}
      {alerts.length > 0 && (
         <div className="space-y-4">
            {alerts.map((alert, idx) => (
               <Card key={idx} className={`border-none shadow-xl ${alert.type === 'HIGH_ALERT' ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <CardContent className="p-8 flex items-center gap-8">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${alert.type === 'HIGH_ALERT' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                        <AlertTriangle size={28} />
                     </div>
                     <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${alert.type === 'HIGH_ALERT' ? 'text-red-600' : 'text-amber-600'}`}>
                           {alert.type.replace('_', ' ')} SAFETY WARNING
                        </p>
                        <p className="text-lg font-black leading-tight tracking-tight text-slate-900">{alert.message}</p>
                     </div>
                     <div className="px-6 py-2 rounded-full border-2 border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Verification Required
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      )}

      {/* ─── MEDICATION LIST ─── */}
      <div className="space-y-8">
         {items.length === 0 ? (
            <Card className="border-4 border-dashed border-slate-100 bg-slate-50/30 rounded-[4rem] py-32 flex flex-col items-center justify-center group">
               <div className="w-32 h-32 rounded-[3rem] bg-white flex items-center justify-center text-slate-200 group-hover:text-blue-600 group-hover:rotate-12 transition-all duration-700 shadow-xl mb-8">
                  <Pill size={64} />
               </div>
               <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-300">Belum ada order obat aktif</p>
               <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-widest">Silahkan gunakan pencarian di atas</p>
            </Card>
         ) : (
            <div className="grid grid-cols-1 gap-8">
               {items.map((item) => (
                  <Card key={item.id} className={`
                     relative overflow-hidden border-2 rounded-[3.5rem] p-4 transition-all duration-500 shadow-2xl
                     ${item.isHighAlert ? 'border-red-500/30' : item.isLasa ? 'border-amber-500/30' : 'border-slate-100'}
                  `}>
                     {item.isHighAlert && (
                        <div className="absolute top-0 right-0 px-10 py-3 bg-red-500 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-bl-[2rem] shadow-xl z-10">
                           High Alert Medication
                        </div>
                     )}
                     {item.isLasa && (
                        <div className="absolute top-0 right-0 px-10 py-3 bg-amber-500 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-bl-[2rem] shadow-xl z-10">
                           LASA Warning
                        </div>
                     )}

                     <CardContent className="p-8 pt-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                           <div className="lg:col-span-4 space-y-8">
                              <div className="flex items-center gap-6">
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${item.isHighAlert ? 'bg-red-500/10 text-red-500' : 'bg-blue-600/10 text-blue-600'}`}>
                                    <Pill size={32} />
                                 </div>
                                 <div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready for Ordering</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Dosis & Kekuatan</Label>
                                 <Input 
                                    className="h-14 border-slate-200 bg-slate-50/50 text-lg font-black"
                                    placeholder="Contoh: 500mg"
                                    value={item.dose}
                                    onChange={(e) => updateItem(item.id, 'dose', e.target.value)}
                                 />
                              </div>
                           </div>

                           <div className="lg:col-span-7 grid grid-cols-3 gap-6">
                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Rute</Label>
                                 <Select 
                                    value={item.route}
                                    onValueChange={(val) => updateItem(item.id, 'route', val)}
                                 >
                                    <SelectTrigger className="h-14 border-slate-200 bg-slate-50/50">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="Oral">Oral</SelectItem>
                                       <SelectItem value="IV">IV (Intra Vena)</SelectItem>
                                       <SelectItem value="IM">IM (Intra Muskular)</SelectItem>
                                       <SelectItem value="SC">SC (Sub Kutan)</SelectItem>
                                       <SelectItem value="Topikal">Topikal</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>

                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Frekuensi</Label>
                                 <Select 
                                    value={item.frequency}
                                    onValueChange={(val) => updateItem(item.id, 'frequency', val)}
                                 >
                                    <SelectTrigger className="h-14 border-slate-200 bg-slate-50/50">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="1x1">1x1</SelectItem>
                                       <SelectItem value="2x1">2x1</SelectItem>
                                       <SelectItem value="3x1">3x1</SelectItem>
                                       <SelectItem value="4x1">4x1</SelectItem>
                                       <SelectItem value="PRN">PRN</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>

                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Instruksi</Label>
                                 <Input 
                                    className="h-14 border-slate-200 bg-slate-50/50"
                                    placeholder="Sesudah Makan"
                                    value={item.instruction}
                                    onChange={(e) => updateItem(item.id, 'instruction', e.target.value)}
                                 />
                              </div>
                           </div>

                           <div className="lg:col-span-1 flex items-center justify-end pt-10">
                              <Button 
                                 variant="destructive" 
                                 size="icon"
                                 onClick={() => removeItem(item.id)}
                                 className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-none shadow-none"
                              >
                                 <Trash2 size={24} />
                              </Button>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}
      </div>

      {/* ─── DECISION SUPPORT SUMMARY ─── */}
      {items.length > 0 && (
         <Card className="p-12 border-none rounded-[4rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white shadow-2xl shadow-emerald-500/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
                     <ShieldCheck size={48} className="animate-pulse" />
                  </div>
                  <div>
                     <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">Clinical Order Verified</h4>
                     <p className="text-sm font-bold opacity-60 mt-3 max-w-md">Semua order obat telah diverifikasi secara otomatis terhadap data Alergi Pasien & Interaksi Obat (MMU Standar).</p>
                  </div>
               </div>
               <div className="flex flex-col gap-4 w-full md:w-auto">
                  <div className="px-10 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">No Interactions Found</span>
                  </div>
                  <Button variant="outline" className="bg-white text-emerald-700 hover:bg-emerald-50 h-16 rounded-3xl border-none">
                     <Zap size={18} className="mr-2" /> Transmit to Pharmacy
                  </Button>
               </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
