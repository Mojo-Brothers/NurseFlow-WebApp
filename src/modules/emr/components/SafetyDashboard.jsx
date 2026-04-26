import React from 'react';
import { ShieldAlert, TrendingUp, Users, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

export default function SafetyDashboard() {
  const metrics = [
    { label: 'Incident Reporting Rate', value: '12', change: '+20%', icon: <ShieldAlert />, color: 'blue' },
    { label: 'IPSG.1 Compliance', value: '98.5%', change: '+1.2%', icon: <CheckCircle2 />, color: 'emerald' },
    { label: 'High-Alert Double Check', value: '100%', change: 'Stable', icon: <Activity />, color: 'blue' },
    { label: 'Near Miss (KNC) Detected', value: '45', change: '+5', icon: <TrendingUp />, color: 'amber' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Hospital Safety Analytics</h2>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Real-time Quality & Patient Safety (QPS) Monitor</p>
         </div>
         <div className="flex gap-4">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Healthy</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {metrics.map((m, i) => (
            <div key={i} className="bg-[#1a1c2a]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-[var(--primary)]/30 transition-all group">
               <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 text-${m.color}-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {m.icon}
               </div>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{m.label}</p>
               <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-white">{m.value}</span>
                  <span className={`text-[10px] font-bold ${m.change.includes('+') ? 'text-emerald-500' : 'text-white/40'}`}>{m.change}</span>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-[#1a1c2a]/40 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
               <TrendingUp size={18} className="text-[var(--primary)]" /> Trend Insiden (KNC vs KTD)
            </h3>
            <div className="h-64 flex items-end justify-between gap-4">
               {[40, 60, 30, 80, 45, 90, 55].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                     <div className="w-full relative group cursor-pointer">
                        <div style={{ height: `${h}%` }} className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 rounded-t-xl transition-all duration-500"></div>
                        <div style={{ height: `${h/2}%` }} className="w-full absolute bottom-0 bg-red-500/30 group-hover:bg-red-500/50 rounded-t-xl transition-all duration-500 delay-100"></div>
                     </div>
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">Day {i+1}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-red-500/5 border border-red-500/10 rounded-[2rem] p-6">
               <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} /> Critical Alerts
               </h4>
               <div className="space-y-3">
                  {[1, 2].map(i => (
                     <div key={i} className="p-4 bg-red-500/10 rounded-2xl border border-red-500/10">
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-1">Unreported Sentinel Event</p>
                        <p className="text-[9px] font-bold text-red-500/60 uppercase">Unit: Kamar Bedah • 2h ago</p>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-[2rem] p-6">
               <h4 className="text-xs font-black text-[var(--primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Quality Goals
               </h4>
               <div className="space-y-4">
                  <div>
                     <div className="flex justify-between mb-2">
                        <span className="text-[9px] font-black text-white/40 uppercase">Hand Hygiene Compliance</span>
                        <span className="text-[9px] font-black text-white uppercase">85%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-emerald-500"></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between mb-2">
                        <span className="text-[9px] font-black text-white/40 uppercase">Discharge Summary Timeliness</span>
                        <span className="text-[9px] font-black text-white uppercase">92%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[92%] bg-[var(--primary)]"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
