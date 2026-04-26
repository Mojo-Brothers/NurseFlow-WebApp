import React from 'react';

/**
 * VitalTouchGrid — A high-speed, touch-optimized numeric keypad for frontline nurses.
 * Features large targets and haptic feedback simulation.
 */
export default function VitalTouchGrid({ value, onChange, unit, label, presets = [] }) {
  const handleKey = (num) => {
    // Simulasi haptic feedback
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    
    if (num === 'DEL') {
      onChange(String(value).slice(0, -1));
    } else if (num === '.') {
      if (!String(value).includes('.')) onChange(String(value) + '.');
    } else {
      onChange(String(value) + num);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

  return (
    <div className="flex-column gap-4 p-4 bg-surface-container rounded-3xl border border-outline-variant shadow-sm animate-fade-in">
       <div className="flex-row justify-between items-center px-2">
          <div>
             <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">{label}</span>
             <div className="flex-row items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums text-primary">{value || '--'}</span>
                <span className="text-[10px] font-bold opacity-60 uppercase">{unit}</span>
             </div>
          </div>
          <div className="flex-row gap-2">
             {presets.map(p => (
                <button 
                  key={p} 
                  onClick={() => onChange(String(p))}
                  className="px-3 py-1 bg-surface border border-outline-variant rounded-full text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all"
                >
                   {p}
                </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-3 gap-2">
          {keys.map(k => (
             <button
                key={k}
                onClick={() => handleKey(k)}
                className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-95 flex-row items-center justify-center
                  ${k === 'DEL' ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface shadow-sm border border-outline-variant/30'}`}
             >
                {k === 'DEL' ? <span className="material-symbols-outlined">backspace</span> : k}
             </button>
          ))}
       </div>
    </div>
  );
}
