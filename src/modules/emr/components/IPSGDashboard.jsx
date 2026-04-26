import React from 'react';
import { ShieldCheck, ShieldAlert, Activity, AlertCircle, CheckCircle2, UserCheck, PhoneCall, Pill, Scissors, Fingerprint, AlertTriangle } from 'lucide-react';

export default function IPSGDashboard() {
  // Logic to determine compliance status (Simulated for demo)
  const goals = [
    { id: 'IPSG.1', label: 'Identity', status: 'COMPLIANT', icon: <UserCheck size={14}/> },
    { id: 'IPSG.2', label: 'Communication', status: 'READY', icon: <PhoneCall size={14}/> },
    { id: 'IPSG.3', label: 'High-Alert Meds', status: 'WARNING', icon: <Pill size={14}/> },
    { id: 'IPSG.4', label: 'Safe Surgery', status: 'READY', icon: <Scissors size={14}/> },
    { id: 'IPSG.5', label: 'Hand Hygiene', status: 'COMPLIANT', icon: <Fingerprint size={14}/> },
    { id: 'IPSG.6', label: 'Fall Risk', status: 'COMPLIANT', icon: <AlertTriangle size={14}/> },
  ];

  return (
    <div className="bg-[var(--surface-container-low)]/80 backdrop-blur-xl border border-[var(--outline-variant)]/30 rounded-3xl p-3 flex items-center justify-between shadow-lg shadow-black/5">
      <div className="flex items-center gap-3 px-4 border-r border-[var(--outline-variant)]/30">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
           <ShieldCheck size={18} />
        </div>
        <div>
           <h3 className="text-[10px] font-black text-[var(--on-surface)] tracking-[0.1em] uppercase leading-none">JCI Safety</h3>
           <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Live Tracking</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-around px-2 gap-4">
        {goals.map(goal => (
          <div key={goal.id} className="flex items-center gap-2 group cursor-help">
             <div className={`
               w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300
               ${goal.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                 goal.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' : 
                 goal.status === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-bounce' :
                 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)] opacity-40'}
             `}>
                {goal.icon}
             </div>
             <div className="hidden lg:block">
                <p className="text-[8px] font-black opacity-40 uppercase tracking-tighter leading-none">{goal.id}</p>
                <p className="text-[9px] font-black text-[var(--on-surface)] uppercase tracking-tight mt-0.5">{goal.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="px-4 border-l border-[var(--outline-variant)]/30">
         <button className="px-4 py-2 rounded-xl bg-[var(--surface-container-high)] hover:bg-[var(--primary)] hover:text-white text-[9px] font-black text-[var(--on-surface)] uppercase tracking-widest transition-all border border-[var(--outline-variant)]">
            Full Audit
         </button>
      </div>
    </div>
  );
}


