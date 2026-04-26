import React, { useState } from 'react';
import { Activity, Thermometer, Wind, Zap, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function EarlyWarningSystem({ formData, setFormData }) {
  const [scores, setScores] = useState({
    rr: 0, spo2: 0, oxygen: 0, sbp: 0, hr: 0, conscious: 0, temp: 0
  });

  const calculateNews2 = () => {
    let total = 0;
    Object.values(scores).forEach(s => total += s);
    return total;
  };

  const news2Score = calculateNews2();

  const getSeverity = (score) => {
    if (score >= 7) return { label: 'CRITICAL (SEPSIS RISK)', color: 'red', action: 'RESUSCITASI & AKTIVASI CODE BLUE' };
    if (score >= 5) return { label: 'HIGH RISK', color: 'orange', action: 'LAPOR DOKTER JAGA & MONITORING TIAP JAM' };
    if (score >= 3) return { label: 'MEDIUM RISK', color: 'amber', action: 'MONITORING TIAP 4 JAM' };
    return { label: 'LOW RISK', color: 'emerald', action: 'MONITORING RUTIN' };
  };

  const severity = getSeverity(news2Score);

  const updateScore = (field, value) => {
    const newScores = { ...scores, [field]: value };
    setScores(newScores);
    setFormData({ ...formData, news2_score: calculateNews2(), raw_scores: newScores });
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="bg-gradient-to-br from-[#1a1c2a] to-[#12141c] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className={`
             w-24 h-24 rounded-3xl flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-500
             ${severity.color === 'red' ? 'bg-red-500/20 border-red-500 animate-pulse' : 
               severity.color === 'orange' ? 'bg-orange-500/20 border-orange-500' : 
               severity.color === 'amber' ? 'bg-amber-500/20 border-amber-500' : 
               'bg-emerald-500/20 border-emerald-500'}
           `}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">NEWS-2</span>
              <span className="text-4xl font-black">{news2Score}</span>
           </div>
        </div>

        <div className="max-w-xl">
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
              <ShieldAlert className={news2Score >= 5 ? 'text-red-500' : 'text-emerald-500'} size={32} /> 
              Clinical Decision Support
           </h3>
           <p className="text-sm font-bold text-white/40 mb-8 uppercase tracking-widest">NEWS-2 Standard (JCI COP.3.1)</p>
           
           <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
              <div className={`w-3 h-12 rounded-full bg-${severity.color}-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}></div>
              <div>
                 <h4 className={`text-lg font-black uppercase tracking-tighter text-${severity.color}-500`}>{severity.label}</h4>
                 <p className="text-xs font-bold text-white/80">{severity.action}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* RR */}
        <VitalsInput 
           label="Respiration Rate" 
           icon={<Wind size={18}/>} 
           unit="bpm" 
           onChange={(v) => {
              let s = 0;
              if (v <= 8 || v >= 25) s = 3;
              else if (v >= 21) s = 2;
              else if (v <= 11) s = 1;
              updateScore('rr', s);
           }} 
        />
        {/* SpO2 */}
        <VitalsInput 
           label="SpO2" 
           icon={<Activity size={18}/>} 
           unit="%" 
           onChange={(v) => {
              let s = 0;
              if (v <= 91) s = 3;
              else if (v <= 93) s = 2;
              else if (v <= 95) s = 1;
              updateScore('spo2', s);
           }} 
        />
        {/* SBP */}
        <VitalsInput 
           label="Systolic BP" 
           icon={<Zap size={18}/>} 
           unit="mmHg" 
           onChange={(v) => {
              let s = 0;
              if (v <= 90 || v >= 220) s = 3;
              else if (v <= 100) s = 2;
              else if (v <= 110) s = 1;
              updateScore('sbp', s);
           }} 
        />
        {/* HR */}
        <VitalsInput 
           label="Heart Rate" 
           icon={<Activity size={18}/>} 
           unit="bpm" 
           onChange={(v) => {
              let s = 0;
              if (v <= 40 || v >= 131) s = 3;
              else if (v >= 111) s = 2;
              else if (v <= 50 || v >= 91) s = 1;
              updateScore('hr', s);
           }} 
        />
      </div>

      {/* Level of Consciousness */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
         <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 block">Kesadaran (ACVPU)</label>
         <div className="flex flex-wrap gap-4">
            {['Alert (0)', 'Confusion (3)', 'Voice (3)', 'Pain (3)', 'Unresponsive (3)'].map((opt, i) => (
               <button 
                  key={i}
                  onClick={() => updateScore('conscious', i === 0 ? 0 : 3)}
                  className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${scores.conscious === (i === 0 ? 0 : 3) ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
               >
                  {opt}
               </button>
            ))}
         </div>
      </div>
    </div>
  );
}

function VitalsInput({ label, icon, unit, onChange }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-[var(--primary)]/30 transition-all group">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover:text-[var(--primary)] transition-colors">
             {icon}
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
       </div>
       <div className="flex items-end gap-2">
          <input 
             type="number"
             placeholder="0"
             onChange={(e) => onChange(Number(e.target.value))}
             className="w-full bg-transparent border-b-2 border-white/10 focus:border-[var(--primary)] text-2xl font-black text-white focus:outline-none transition-colors"
          />
          <span className="text-[10px] font-black text-white/20 mb-1">{unit}</span>
       </div>
    </div>
  );
}
