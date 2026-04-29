import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, User, Clock, Info, AlertTriangle, Fingerprint } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

export default function HandHygieneAudit({ formData, setFormData }) {
  const [moments, setMoments] = useState([
    { id: 1, label: 'Before Patient Contact', description: 'Protect patient from germs on hands.', done: false },
    { id: 2, label: 'Before Aseptic Procedure', description: 'Protect patient from germs entering body.', done: false },
    { id: 3, label: 'After Body Fluid Exposure', description: 'Protect self and environment.', done: false },
    { id: 4, label: 'After Patient Contact', description: 'Protect self and environment.', done: false },
    { id: 5, label: 'After Contact with Surroundings', description: 'Protect self and environment.', done: false }
  ]);

  const toggleMoment = (id) => {
    const updated = moments.map(m => m.id === id ? { ...m, done: !m.done } : m);
    setMoments(updated);
    setFormData({ ...formData, compliance_moments: updated });
  };

  const [method, setMethod] = useState('Handrub');

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* ─── IPSG.5 SAFETY HUB ─── */}
      <Card className="bg-emerald-50/50 border-2 border-emerald-100 rounded-[3.5rem] p-4 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
         <CardContent className="p-8 flex items-center gap-10 relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30">
               <Fingerprint size={44} />
            </div>
            <div className="space-y-3">
               <h3 className="text-xl font-black text-emerald-700 uppercase tracking-tighter">Hand Hygiene Audit (IPSG.5)</h3>
               <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl italic">
                  Health care-associated infection risk reduction through WHO 5 Moments Hand Hygiene protocol implementation and direct observation.
               </p>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-10">
        {/* ─── METHODOLOGY ─── */}
        <div className="col-span-4 space-y-8">
           <Card className="rounded-[3rem] border-2 border-slate-100 shadow-sm p-4">
              <CardHeader className="pb-8">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {['Handrub (Alcohol)', 'Handwash (Soap)', 'Surgical Aseptic'].map(m => (
                    <Button 
                       key={m}
                       variant={method === m ? 'default' : 'outline'}
                       onClick={() => {
                          setMethod(m);
                          setFormData({...formData, method: m});
                       }}
                       className={`w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest ${method === m ? 'shadow-blue-600/20 shadow-xl scale-105' : 'bg-white border-slate-200'}`}
                    >
                       {m}
                    </Button>
                 ))}
              </CardContent>
           </Card>

           <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex gap-5">
              <Info size={24} className="text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold italic text-amber-700 leading-relaxed">Auditors must conduct direct observation without interrupting clinical care workflows.</p>
           </div>
        </div>

        {/* ─── MOMENTS CHECKLIST ─── */}
        <div className="col-span-8 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">WHO 5 Moments Checklist</h4>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Select Observed Actions</span>
           </div>
           <div className="space-y-4">
              {moments.map((m) => (
                 <button 
                   key={m.id}
                   type="button"
                   onClick={() => toggleMoment(m.id)}
                   className={`
                      w-full p-8 rounded-[3rem] border-2 flex items-center justify-between transition-all duration-500 text-left group
                      ${m.done ? 'bg-emerald-50/50 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-blue-400'}
                   `}
                 >
                   <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${m.done ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                         {m.done ? <CheckCircle2 size={28} /> : <span className="text-xl font-black">{m.id}</span>}
                      </div>
                      <div>
                         <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{m.label}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{m.description}</p>
                      </div>
                   </div>
                   <div className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${m.done ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
                      {m.done ? 'COMPLIANT' : 'PENDING'}
                   </div>
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* ─── AUDIT PERFORMANCE ─── */}
      <Card className="p-12 rounded-[4rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 opacity-50"></div>
         <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex items-center gap-10">
               <div className="w-28 h-28 rounded-full border-[10px] border-white/10 flex items-center justify-center text-4xl font-black shadow-2xl bg-white/5">
                  {Math.round((moments.filter(m => m.done).length / moments.length) * 100)}%
               </div>
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Compliance Score</h3>
                  <p className="text-sm font-bold text-slate-400 mt-4 max-w-sm">Meets international clinical hygiene standards as mandated by Infection Prevention & Control (PPI).</p>
               </div>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
               <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-5">
                  <User size={18} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Observer: Nurse Sarah</span>
               </div>
               <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-5">
                  <Clock size={18} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified: {new Date().toLocaleTimeString()}</span>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
