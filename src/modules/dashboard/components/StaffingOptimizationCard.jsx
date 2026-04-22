import React from 'react';

/**
 * StaffingOptimizationCard — A premium AI-driven widget for ward management.
 */
export default function StaffingOptimizationCard({ recommendation }) {
  const isCritical = recommendation?.risk === 'CRITICAL_UNDERSTAFFING_RISK';

  return (
    <div className={`p-8 rounded-[3rem] border shadow-2xl transition-all relative overflow-hidden
      ${isCritical ? 'bg-error text-white border-error shadow-error/20' : 'bg-white border-outline-variant text-on-surface'}`}>
       
       {isCritical && (
          <div className="absolute top-0 right-0 p-4 bg-white/20 backdrop-blur-md rounded-bl-3xl">
             <span className="material-symbols-outlined text-white animate-pulse">warning</span>
          </div>
       )}

       <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60`}>
          Next Shift Optimization
       </p>
       
       <h3 className="text-2xl font-black mb-6 leading-tight">
          Recommended <br/> Nursing Headcount
       </h3>

       <div className="flex-row items-baseline gap-4 mb-8">
          <span className="text-7xl font-black tracking-tighter tabular-nums">
             {recommendation?.headcount || '---'}
          </span>
          <div className="flex-column">
             <span className="text-sm font-bold uppercase opacity-60">Professional</span>
             <span className="text-sm font-bold uppercase opacity-60">Nurses</span>
          </div>
       </div>

       <div className={`p-4 rounded-2xl flex-row gap-3 items-center
         ${isCritical ? 'bg-white/10' : 'bg-surface-container'}`}>
          <span className="material-symbols-outlined">analytics</span>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase leading-none mb-1">Intelligence Insight</p>
             <p className="text-xs font-bold leading-tight">{recommendation?.reason}</p>
          </div>
       </div>

       <button className={`w-full mt-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all
         ${isCritical ? 'bg-white text-error hover:bg-white/90' : 'bg-primary text-white hover:shadow-primary/20'}`}>
          Apply Staffing Plan
       </button>
    </div>
  );
}
