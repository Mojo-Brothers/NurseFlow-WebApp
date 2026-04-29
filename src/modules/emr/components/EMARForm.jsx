import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, AlertTriangle, UserCheck, ShieldAlert, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';

const HIGH_ALERT_MEDS = [
  'Insulin', 'Heparin', 'Warfarin', 'Digoxin', 'Potassium Chloride', 'Morphine', 'Fentanyl'
];

export default function EMARForm({ formData, setFormData, patient }) {
  // Simulating prescribed medications from CPOE/Pharmacy
  const [prescribedMeds, setPrescribedMeds] = useState([
    { id: 1, name: 'Amlodipine 5mg', dose: '1 Tablet', route: 'Oral', frequency: '1x1', instruction: 'Sesudah Makan', isHighAlert: false },
    { id: 2, name: 'Insulin Novorapid', dose: '10 Unit', route: 'Subkutan', frequency: '3x1 (AC)', instruction: '15 Menit Sebelum Makan', isHighAlert: true },
    { id: 3, name: 'Paracetamol 500mg', dose: '1 Tablet', route: 'Oral', frequency: 'PRN (Jika Demam)', instruction: 'Sesudah Makan', isHighAlert: false }
  ]);

  const [adminLogs, setAdminLogs] = useState(formData.administration_logs || {});
  const [witnesses, setWitnesses] = useState(formData.witnesses || {});

  const toggleAdmin = (medId) => {
    const isCurrentlyAdministered = !!adminLogs[medId];
    const newLogs = { ...adminLogs };
    
    if (isCurrentlyAdministered) {
      delete newLogs[medId];
    } else {
      newLogs[medId] = {
        timestamp: new Date().toISOString(),
        administered_by: 'Nurse Sarah', // In real app, from auth
        status: 'GIVEN'
      };
    }
    
    setAdminLogs(newLogs);
    setFormData({ ...formData, administration_logs: newLogs });
  };

  const setWitness = (medId, witnessName) => {
    const newWitnesses = { ...witnesses, [medId]: witnessName };
    setWitnesses(newWitnesses);
    setFormData({ ...formData, witnesses: newWitnesses });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* ─── JCI SAFETY HUB ─── */}
      <Card className="bg-amber-50/50 border-2 border-amber-100 rounded-[3.5rem] p-4">
         <CardContent className="p-8 flex items-center gap-10">
            <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-amber-500 shrink-0 shadow-xl shadow-amber-500/10">
               <ShieldAlert size={40} />
            </div>
            <div className="space-y-2">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Medication Administration Protocol (7 RIGHTS)</h3>
               <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl italic">
                  Verify: Right Patient, Right Drug, Right Dose, Right Route, Right Time, Right Documentation, Right Indication.
               </p>
            </div>
         </CardContent>
      </Card>

      {/* ─── IPSG PATIENT IDENTITY ─── */}
      <Card className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-4">
         <CardContent className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <Checkbox 
                  id="id_verified"
                  checked={formData.id_verified || false}
                  onCheckedChange={(checked) => setFormData({...formData, id_verified: checked})}
                  className="w-8 h-8 rounded-xl border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
               />
               <Label htmlFor="id_verified" className="cursor-pointer">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-900">Confirm Patient Identity (IPSG.1)</span>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 bg-emerald-50 px-4 py-1 rounded-full border border-emerald-100">
                     Match Bracelet with MRN: {patient?.mrn || 'N/A'}
                  </p>
               </Label>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-emerald-600">
               <ShieldCheck size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Identity Secure</span>
            </div>
         </CardContent>
      </Card>

      {/* ─── MEDICATION TRACKER ─── */}
      <div className="grid grid-cols-1 gap-6">
        {prescribedMeds.map((med) => {
          const isAdministered = !!adminLogs[med.id];
          const isHighAlert = med.isHighAlert;
          const hasWitness = !!witnesses[med.id];

          return (
            <Card 
              key={med.id} 
              className={`
                relative overflow-hidden rounded-[3rem] border-2 transition-all duration-500 shadow-sm
                ${isAdministered 
                  ? 'bg-emerald-50/30 border-emerald-500 shadow-xl shadow-emerald-500/10' 
                  : isHighAlert ? 'bg-red-50/30 border-red-200' : 'bg-white border-slate-100 hover:border-slate-300'}
              `}
            >
              {isHighAlert && (
                <div className="absolute top-0 right-12 px-8 py-2 bg-red-600 text-[9px] font-black uppercase tracking-[0.2em] text-white rounded-b-2xl shadow-xl z-10 animate-pulse">
                  HIGH ALERT
                </div>
              )}

              <CardContent className="p-10 pt-12">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner transition-colors duration-500 ${isAdministered ? 'bg-emerald-600 text-white' : isHighAlert ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Pill size={36} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{med.name}</h4>
                      <div className="flex flex-wrap items-center gap-6 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-2"><Zap size={14} className="text-blue-500"/> {med.dose}</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> {med.route}</span>
                        <span className="flex items-center gap-2"><Clock size={14} className="text-amber-500"/> {med.frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                    {isHighAlert && !isAdministered && (
                      <div className="w-full sm:w-auto min-w-[240px]">
                        <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Witness Required (Double-Check)</Label>
                        <Input 
                          placeholder="Nurse ID / Name"
                          className="h-12 border-red-100 bg-red-50/30 focus-visible:border-red-500"
                          value={witnesses[med.id] || ''}
                          onChange={(e) => setWitness(med.id, e.target.value)}
                        />
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        if (isHighAlert && !witnesses[med.id] && !isAdministered) {
                          alert("Peringatan: Obat High Alert wajib didampingi saksi (Double-Check) sesuai standar JCI MMU.6.");
                          return;
                        }
                        toggleAdmin(med.id);
                      }}
                      variant={isAdministered ? 'jci' : 'default'}
                      size="lg"
                      className={`h-16 px-12 rounded-2xl w-full sm:w-auto ${!isAdministered && 'bg-slate-900 text-white hover:bg-slate-800 border-none'}`}
                    >
                      {isAdministered ? <><CheckCircle2 size={18} className="mr-3"/> Administered</> : <><UserCheck size={18} className="mr-3"/> Administer</>}
                    </Button>
                  </div>
                </div>

                {isAdministered && (
                  <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentation:</span>
                      <span className="text-[11px] font-bold text-slate-600 italic">Given by Nurse Sarah at {new Date(adminLogs[med.id].timestamp).toLocaleTimeString()}</span>
                    </div>
                    {isHighAlert && witnesses[med.id] && (
                      <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Verified by {witnesses[med.id]}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── PROGRESS ANALYTICS ─── */}
      <Card className="p-10 border-none bg-slate-900 text-white rounded-[3.5rem] shadow-2xl">
         <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Administration Progress</span>
               <span className="text-xl font-black text-blue-400 tracking-tighter">
                  {Object.keys(adminLogs).length} / {prescribedMeds.length} Items
               </span>
            </div>
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
               <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 shadow-lg shadow-blue-500/20"
                  style={{ width: `${(Object.keys(adminLogs).length / prescribedMeds.length) * 100}%` }}
               />
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
