import React, { useState } from 'react';
import { Activity, Thermometer, Wind, Zap, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

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
    <div className="space-y-12 animate-in zoom-in-95 duration-500 pb-10">
      {/* ─── NEWS2 DECISION HUB ─── */}
      <Card className="bg-slate-900 border-none rounded-[3.5rem] shadow-2xl relative overflow-hidden p-4">
        <div className="absolute top-0 right-0 p-10">
           <div className={`
             w-28 h-28 rounded-[2rem] flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-500 bg-white/5
             ${severity.color === 'red' ? 'border-red-500 animate-pulse' : 
               severity.color === 'orange' ? 'border-orange-500' : 
               severity.color === 'amber' ? 'border-amber-500' : 
               'border-emerald-500'}
           `}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">NEWS-2</span>
              <span className={`text-5xl font-black ${severity.color === 'red' ? 'text-red-500' : severity.color === 'orange' ? 'text-orange-500' : severity.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>
                 {news2Score}
              </span>
           </div>
        </div>

        <CardHeader className="pb-12 max-w-xl">
           <CardTitle className="text-white flex items-center gap-6">
              <ShieldAlert className={news2Score >= 5 ? 'text-red-500' : 'text-emerald-500'} size={40} /> 
              Clinical Decision Support
           </CardTitle>
           <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4">NEWS-2 Standard (JCI COP.3.1)</p>
        </CardHeader>
        
        <CardContent className="max-w-xl">
           <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center gap-8">
              <div className={`w-4 h-16 rounded-full bg-${severity.color}-500 shadow-lg shadow-${severity.color}-500/40`}></div>
              <div>
                 <h4 className={`text-2xl font-black uppercase tracking-tight text-${severity.color}-500`}>{severity.label}</h4>
                 <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{severity.action}</p>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* ─── VITALS PARAMETERS ─── */}
      <div className="grid grid-cols-4 gap-8">
        <VitalsInput 
           label="Respiration Rate" 
           icon={<Wind size={20}/>} 
           unit="bpm" 
           onChange={(v) => {
              let s = 0;
              if (v <= 8 || v >= 25) s = 3;
              else if (v >= 21) s = 2;
              else if (v <= 11) s = 1;
              updateScore('rr', s);
           }} 
        />
        <VitalsInput 
           label="SpO2" 
           icon={<Activity size={20}/>} 
           unit="%" 
           onChange={(v) => {
              let s = 0;
              if (v <= 91) s = 3;
              else if (v <= 93) s = 2;
              else if (v <= 95) s = 1;
              updateScore('spo2', s);
           }} 
        />
        <VitalsInput 
           label="Systolic BP" 
           icon={<Zap size={20}/>} 
           unit="mmHg" 
           onChange={(v) => {
              let s = 0;
              if (v <= 90 || v >= 220) s = 3;
              else if (v <= 100) s = 2;
              else if (v <= 110) s = 1;
              updateScore('sbp', s);
           }} 
        />
        <VitalsInput 
           label="Heart Rate" 
           icon={<Activity size={20}/>} 
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

      {/* ─── NEUROLOGICAL STATE ─── */}
      <Card className="border-2 border-slate-100 rounded-[3.5rem] bg-slate-50/50 p-4">
         <CardHeader className="pb-8 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-4">
               <ShieldCheck size={18} className="text-blue-600" /> Consciousness Scale (ACVPU)
            </CardTitle>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select One</span>
         </CardHeader>
         <CardContent className="flex flex-wrap gap-4">
            {['Alert (0)', 'Confusion (3)', 'Voice (3)', 'Pain (3)', 'Unresponsive (3)'].map((opt, i) => (
               <Button 
                  key={i}
                  variant={scores.conscious === (i === 0 ? 0 : 3) ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => updateScore('conscious', i === 0 ? 0 : 3)}
                  className={`rounded-2xl px-10 h-16 ${scores.conscious === (i === 0 ? 0 : 3) ? 'shadow-blue-600/20 shadow-xl scale-105' : 'bg-white border-slate-200'}`}
               >
                  {opt}
               </Button>
            ))}
         </CardContent>
      </Card>
    </div>
  );
}

function VitalsInput({ label, icon, unit, onChange }) {
  return (
    <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-400 transition-all group p-4">
       <CardHeader className="p-4 pb-8 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
             {icon}
          </div>
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</Label>
       </CardHeader>
       <CardContent className="p-4 pt-0">
          <div className="flex items-baseline gap-3">
             <Input 
                type="number"
                placeholder="0"
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-auto p-0 border-none bg-transparent text-4xl font-black tabular-nums focus-visible:ring-0"
             />
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{unit}</span>
          </div>
       </CardContent>
    </Card>
  );
}
