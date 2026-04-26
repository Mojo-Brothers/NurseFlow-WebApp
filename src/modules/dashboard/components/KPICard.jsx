import React from 'react';

/**
 * KPICard — A premium analytics widget for hospital executives.
 */
export default function KPICard({ label, value, unit, trend, icon, color = 'var(--primary)' }) {
  const isUp = trend?.startsWith('+');
  const trendColor = isUp ? 'text-success' : 'text-error';

  return (
    <div className="flex-column gap-2 p-6 bg-surface rounded-[2rem] border border-outline-variant shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
       {/* Background Decoration */}
       <div 
          className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700"
          style={{ fontSize: '120px', color }}
       >
          <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{icon}</span>
       </div>

       <div className="flex-row justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container" style={{ color }}>
             <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-surface-container-high ${trendColor}`}>
             {trend}
          </div>
       </div>

       <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1 block">
             {label}
          </span>
          <div className="flex-row items-baseline gap-2">
             <span className="text-4xl font-black tracking-tighter tabular-nums" style={{ color }}>
                {value}
             </span>
             <span className="text-xs font-bold opacity-40 uppercase">{unit}</span>
          </div>
       </div>
    </div>
  );
}
