import React, { useState, useEffect } from 'react';
import { 
  Zap, Clock, ShieldAlert, Activity, Heart, Thermometer, Wind, User, 
  ShieldCheck, CheckCircle2, ChevronRight, Stethoscope, FileText, 
  Microscope, ClipboardCheck, AlertTriangle, Workflow, Save, Plus, 
  BadgeInfo, LogOut, Pill, AlertCircle, Droplets, Info, Eye, Brain, X,
  Siren, MousePointer2
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

// MASTER SPACING TOKENS (8pt System)
const SPACING = {
  MICRO: 'gap-2',    // 8px
  INPUT: 'gap-4',    // 16px
  INNER: 'gap-6',    // 24px
  SECTION: 'gap-12', // Increased for premium feel
  OUTER: 'space-y-12' 
};

export default function UgdAssessmentForm({ formData, setFormData, patient, encounter, currentUser }) {
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateField = (section, field, value) => {
    if (section) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const ESI_LEVELS = [
    { 
      level: 1, 
      label: 'Resusitasi', 
      shortSub: 'Immediate',
      sub: 'Critical life-threatening condition',
      sla: 'IMMEDIATE / < 1 MIN',
      color: 'text-red-600',
      activeBg: 'from-red-500 to-red-600',
      activeBadge: 'bg-red-950/40',
      glow: 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.3),0_4px_15px_rgba(0,0,0,0.15)]',
      tint: 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300',
      icon: <Activity className="w-3.5 h-3.5" />
    },
    { 
      level: 2, 
      label: 'Emergent', 
      shortSub: 'High risk',
      sub: 'High risk situation / unstable vitals',
      sla: 'RESPONSE < 10 MIN',
      color: 'text-orange-600',
      activeBg: 'from-orange-500 to-amber-600',
      activeBadge: 'bg-orange-950/40',
      glow: 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.3),0_4px_15px_rgba(0,0,0,0.15)]',
      tint: 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300',
      icon: <ShieldAlert className="w-3.5 h-3.5" />
    },
    { 
      level: 3, 
      label: 'Urgent', 
      shortSub: 'Stable / multi',
      sub: 'Stable condition / multiple resources',
      sla: 'RESPONSE < 30 MIN',
      color: 'text-amber-600',
      activeBg: 'from-amber-500 to-yellow-600',
      activeBadge: 'bg-amber-950/40',
      glow: 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.3),0_4px_15px_rgba(0,0,0,0.15)]',
      tint: 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300',
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    },
    { 
      level: 4, 
      label: 'Less Urgent', 
      shortSub: 'Stable / single',
      sub: 'Stable / single resource intervention',
      sla: 'RESPONSE < 60 MIN',
      color: 'text-blue-600',
      activeBg: 'from-blue-600 to-indigo-700',
      activeBadge: 'bg-blue-950/40',
      glow: 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.3),0_4px_15px_rgba(0,0,0,0.15)]',
      tint: 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300',
      icon: <ShieldCheck className="w-3.5 h-3.5" />
    },
    { 
      level: 5, 
      label: 'Non-Urgent', 
      shortSub: 'Stable / none',
      sub: 'Stable / routine clinical examination',
      sla: 'RESPONSE < 120 MIN',
      color: 'text-slate-500',
      activeBg: 'from-slate-600 to-slate-700',
      activeBadge: 'bg-slate-950/40',
      glow: 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.3),0_4px_15px_rgba(0,0,0,0.15)]',
      tint: 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300',
      icon: <User className="w-3.5 h-3.5" />
    }
  ];

  const calculateNEWS2 = () => 0; 
  const newsScore = calculateNEWS2();

  return (
    <div className={`${SPACING.OUTER} pb-16`}>
      
      {/* ─── TRIAGE COMMAND CENTER ─── */}
      <section className="space-y-4 font-sans">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center shadow-md border border-slate-700">
              <Siren size={14} className="text-red-500 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-slate-900 leading-none">
                ER Triage Control
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </div>
                <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-normal">System Synced • Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-3 py-1 rounded-md shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">ER Load</span>
              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-normal">Moderate</span>
            </div>
            <div className="h-2.5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">Shift</span>
              <span className="text-[9px] font-bold text-slate-900 uppercase tracking-normal tabular-nums">S1</span>
            </div>
            <div className="h-2.5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-normal">Normal Ops</span>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_24px_48px_rgba(15,23,42,0.1)] bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-2 border-2">
          <div className="grid grid-cols-12 divide-x divide-slate-100 bg-white/90 rounded-[3.2rem] overflow-hidden">
            {/* LEFT: CLINICAL TRIAGE COMMAND STRIP */}
            <div className="col-span-12 xl:col-span-8 p-6 lg:p-8 flex flex-col justify-between relative">
              {/* The "Bridge Element" - a subtle telemetry line connecting left to right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent pointer-events-none" />

              <div className="bg-slate-200/60 p-2 rounded-3xl flex flex-col gap-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200">
                {ESI_LEVELS.map((esi) => {
                  const isActive = formData.esi === esi.level || (!formData.esi && esi.level === 2);
                  return (
                    <button
                      key={esi.level}
                      type="button"
                      onClick={() => updateField(null, 'esi', esi.level)}
                      className={cn(
                        "relative flex items-center p-3 rounded-2xl transition-all duration-300 group text-left overflow-hidden",
                        isActive 
                          ? `bg-gradient-to-r ${esi.activeBg} text-white z-10 border border-white/20 ${esi.glow}` 
                          : `bg-slate-50/80 hover:bg-white border border-transparent shadow-sm`
                      )}
                    >
                      {/* Inner Recessed Bevel */}
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10" />
                      )}

                      <div className="flex items-center gap-4 w-full relative z-10">
                        {/* LEFT: NUMBER */}
                        <div className="w-14 h-14 flex items-center justify-center shrink-0">
                          <span className={cn(
                            "text-5xl font-black tracking-tighter transition-all duration-300 leading-none",
                            isActive ? "text-white" : "text-slate-300 group-hover:text-slate-400"
                          )}>
                            {esi.level}
                          </span>
                        </div>

                        {/* MIDDLE: INFO */}
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex items-center gap-2">
                             <div className={cn(
                                "p-1 rounded-md transition-all shadow-sm",
                                isActive ? "bg-white/20 text-white shadow-inner border border-white/10" : `bg-white border border-slate-200 ${esi.color}`
                             )}>
                                {esi.level === 1 && isActive ? <Activity className="w-3 h-3 animate-pulse" /> : React.cloneElement(esi.icon, { className: 'w-3 h-3' })}
                             </div>
                             <span className={cn(
                                "text-[11px] font-bold uppercase tracking-[0.05em]",
                                isActive ? "text-white" : "text-slate-900"
                             )}>
                                {esi.label}
                             </span>
                          </div>
                          <p className={cn(
                            "text-[10px] font-medium tracking-[0.02em]",
                            isActive ? "text-white/80" : "text-slate-500"
                          )}>
                            {esi.sub}
                          </p>
                        </div>

                        {/* RIGHT: SLA */}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-2 h-8 px-3 rounded-xl text-[9px] font-bold transition-all border shadow-sm shrink-0",
                            isActive ? `${esi.activeBadge} text-white border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]` : "bg-white text-slate-500 border-slate-200"
                          )}>
                            <Clock size={10} strokeWidth={3} className={isActive ? "opacity-90" : "opacity-50"} />
                            <span className="uppercase tracking-[0.05em] tabular-nums">{esi.sla}</span>
                          </div>
                          
                          {/* Clinical Pulse Signal */}
                          {isActive ? (
                            <div className="relative flex h-2 w-2 shrink-0 mr-1">
                              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                              <div className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />
                            </div>
                          ) : (
                            <div className="w-2 mr-1 shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* CLINICAL QUEUE STRIP */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-2.5 mt-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">Waiting</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 tabular-nums bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-inner">12</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">Critical</span>
                    <span className="text-[10px] font-mono font-bold text-red-600 tabular-nums bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shadow-inner">02</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">Avg Wait</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 tabular-nums">14 <span className="text-[8px] text-slate-400">MIN</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-normal">Last Call:</span>
                   <span className="text-[9px] font-mono font-bold text-slate-900 tabular-nums">BED 03</span>
                </div>
              </div>
            </div>

            {/* RIGHT: DARK TELEMETRY DECK */}
            <div className="col-span-12 xl:col-span-4 bg-gradient-to-b from-slate-900 to-slate-950 p-8 flex flex-col gap-7 relative overflow-hidden border-t border-l border-slate-700/50 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
              {/* Radial Glow & Micro-noise */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 pointer-events-none mix-blend-overlay" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-emerald-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-400">Telemetry Active</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded px-2 py-0.5 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-300">Standard</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <Label className="text-[9px] text-slate-400 font-semibold uppercase tracking-[0.15em] px-1">
                  Arrival Mode
                </Label>
                <div className="grid grid-cols-3 gap-3 py-2 px-3 bg-slate-950/80 rounded-[1.5rem] border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] h-16">
                  {[
                    { val: 'AMBULANCE', icon: <Siren size={20} strokeWidth={1.8} />, label: 'EMS' },
                    { val: 'WALK-IN', icon: <User size={20} strokeWidth={1.8} />, label: 'Walk-In' },
                    { val: 'REFERRAL', icon: <FileText size={20} strokeWidth={1.8} />, label: 'Referral' }
                  ].map(mode => {
                    const isSelected = (formData.arrivalMode || 'AMBULANCE') === mode.val;
                    return (
                      <button
                        key={mode.val}
                        type="button"
                        onClick={() => updateField(null, 'arrivalMode', mode.val)}
                        className={cn(
                          "relative group flex items-center justify-center rounded-xl transition-all duration-300",
                          isSelected 
                            ? "bg-slate-800 ring-1 ring-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.18)] text-white" 
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                      >
                        {mode.icon}

                        {/* Hovercard */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                          {mode.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center justify-between px-1">
                   <Label className="text-[9px] text-white font-semibold uppercase tracking-[0.15em]">
                     Time of Arrival
                   </Label>
                   <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white">Sync Pulse</span>
                   </div>
                </div>
                <div className="relative group flex flex-col justify-center bg-slate-950/80 border border-slate-800 h-[5.5rem] rounded-[1.25rem] shadow-[inset_0_4px_15px_rgba(0,0,0,0.6)] overflow-hidden cursor-pointer">
                  {/* Subtle Glow */}
                  <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none" />
                  
                  {/* Realtime Display - Stacked Hierarchy */}
                  <div className="flex flex-col items-center justify-center relative z-10 h-full">
                    <span className="text-5xl font-black text-white tracking-tight tabular-nums leading-none font-mono">
                       {liveTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5 opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-widest leading-none">
                         {liveTime.getSeconds().toString().padStart(2, '0')} SEC <span className="text-white/40 font-medium tracking-normal ml-0.5">• WIB</span>
                      </span>
                    </div>
                  </div>

                  {/* Hidden Input for Form State */}
                  <Input 
                    type="time" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    value={formData.arrivalTime || new Date().toTimeString().slice(0,5)}
                    onChange={(e) => updateField(null, 'arrivalTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-auto relative z-10">
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[1.25rem] p-3.5 flex items-center gap-3.5 shadow-inner">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[8px] opacity-40 animate-pulse" />
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative z-10">
                         <CheckCircle2 size={14} className="text-emerald-400" />
                      </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.1em]">Patient Indexed</p>
                       <p className="text-[8px] font-medium text-emerald-400/60 mt-0.5">Ready for clinical assessment</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── VITAL SIGNS TELEMETRY STRIP ─── */}
      <div className="bg-slate-50/60 p-8 rounded-[3rem] border border-slate-200/60 mb-8">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="relative flex h-2 w-2">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                 </div>
                 <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.1em]">Patient Telemetry</h3>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live • Updated 2s ago</span>
           </div>
           
           {/* NEWS2 SEVERITY MODULE */}
           <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NEWS2 Score</span>
              </div>
              <div className="h-6 w-px bg-slate-100" />
              <div className="flex items-center gap-3">
                 <span className="text-2xl font-black text-emerald-600 tabular-nums leading-none">{newsScore}</span>
                 <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-emerald-100">
                    <ShieldCheck size={12} /> Low Risk
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-6 gap-3 mb-8">
           {[
              { label: 'SYS', icon: <Heart className="w-4 h-4 stroke-[2]" />, field: 'bp_sys', unit: 'mmHg', color: 'text-slate-400', activeColor: 'text-rose-500', activeBg: 'bg-white' },
              { label: 'DIA', icon: <Heart className="w-4 h-4 stroke-[2]" />, field: 'bp_dia', unit: 'mmHg', color: 'text-slate-400', activeColor: 'text-rose-500', activeBg: 'bg-white' },
              { label: 'HR', icon: <Activity className="w-4 h-4 stroke-[2]" />, field: 'hr', unit: 'bpm', color: 'text-slate-400', activeColor: 'text-amber-500', activeBg: 'bg-gradient-to-b from-amber-50/40 to-transparent border-amber-100/60' },
              { label: 'RR', icon: <Wind className="w-4 h-4 stroke-[2]" />, field: 'rr', unit: '/min', color: 'text-slate-400', activeColor: 'text-sky-500', activeBg: 'bg-gradient-to-b from-sky-50/40 to-transparent border-sky-100/60', pulse: true },
              { label: 'TEMP', icon: <Thermometer className="w-4 h-4 stroke-[2]" />, field: 'temp', unit: '°C', color: 'text-slate-400', activeColor: 'text-orange-500', activeBg: 'bg-white' },
              { label: 'SPO2', icon: <Droplets className="w-4 h-4 stroke-[2]" />, field: 'spo2', unit: '%', color: 'text-slate-400', activeColor: 'text-blue-500', activeBg: 'bg-gradient-to-b from-blue-50/40 to-transparent border-blue-100/60' }
           ].map((vs) => {
             const val = formData.vitals?.[vs.field];
             const hasData = val && val !== '';
             return (
               <div key={vs.field} className={cn("bg-white border border-slate-200/80 px-4 py-3.5 rounded-[1.5rem] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between h-28 group relative overflow-hidden transition-all hover:border-blue-400 hover:shadow-md", hasData && vs.activeBg)}>
                  <div className="flex items-center justify-between z-10 relative">
                     <span className={cn("text-[11px] font-semibold tracking-[0.12em] uppercase", hasData ? "text-slate-700" : "text-slate-400")}>{vs.label}</span>
                     <div className={cn("transition-colors", hasData ? vs.activeColor : vs.color, vs.pulse && hasData && "animate-pulse")}>
                        {vs.icon}
                     </div>
                  </div>
                  
                  <div className="flex flex-col mt-auto z-10 relative">
                     {hasData ? (
                        <div className="flex items-baseline gap-1.5">
                           <Input 
                              className="h-auto p-0 border-none bg-transparent text-4xl font-bold tabular-nums tracking-tight focus-visible:ring-0 text-slate-900 w-full" 
                              value={val}
                              onChange={(e) => updateField('vitals', vs.field, e.target.value)}
                           />
                           <span className="text-xs text-slate-400 font-medium">{vs.unit}</span>
                        </div>
                     ) : (
                        <div className="flex items-center h-[40px] w-full relative">
                           <Input 
                              className="absolute inset-0 opacity-0 cursor-text z-20 w-full h-full" 
                              value={val || ''}
                              onChange={(e) => updateField('vitals', vs.field, e.target.value)}
                           />
                           <div className="flex items-center gap-1.5 opacity-60">
                             <Activity size={10} className="text-slate-500 animate-pulse" />
                             <span className="text-[10px] text-slate-500 font-medium tracking-wide">Awaiting monitor</span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Physiological Energy: Shimmer on active cards */}
                  {hasData && (
                     <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[200%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none mix-blend-overlay" />
                  )}
               </div>
             )
           })}
        </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] flex flex-col gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                         <Brain size={16} strokeWidth={2} />
                      </div>
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Pain Scale (VAS)</Label>
                   </div>
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-md">Intensity: {formData.painScale || 0}/10</p>
                </div>
                <input 
                   type="range" min="0" max="10" 
                   className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 mt-2" 
                   value={formData.painScale || 0}
                   onChange={(e) => updateField(null, 'painScale', e.target.value)}
                />
             </div>

             <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] flex flex-col gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                         <Wind size={16} strokeWidth={2} />
                      </div>
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Oxygen Therapy</Label>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active Flow</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1">
                   <Select 
                      value={formData.oxygenSupport || 'ROOM_AIR'}
                      onValueChange={(val) => {
                          updateField(null, 'oxygenSupport', val);
                          if (val === 'ROOM_AIR') updateField(null, 'oxygenFlow', '21% FiO2');
                          else updateField(null, 'oxygenFlow', '');
                      }}
                   >
                      <SelectTrigger className="bg-slate-50 border-transparent hover:border-slate-200 h-10 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-wide">
                         <SelectValue placeholder="Delivery Mode" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="ROOM_AIR">Room Air</SelectItem>
                         <SelectItem value="NASAL_CANNULA">Nasal Cannula</SelectItem>
                         <SelectItem value="SIMPLE_MASK">Simple Mask</SelectItem>
                         <SelectItem value="NRM">NRM</SelectItem>
                      </SelectContent>
                   </Select>
                   <div className="relative">
                      <Input 
                         className="h-10 bg-slate-50 border-transparent hover:border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-wide px-4"
                         placeholder="Flow / FiO2"
                         value={formData.oxygenFlow || (formData.oxygenSupport === 'ROOM_AIR' || !formData.oxygenSupport ? '21% FiO2' : '')}
                         onChange={(e) => updateField(null, 'oxygenFlow', e.target.value)}
                      />
                   </div>
                </div>
             </div>
          </div>
      </div>

      {/* ─── PRIMARY SURVEY (ABCDE) ─── */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <Stethoscope size={16} className="text-blue-600" /> Primary Survey (ABCDE)
          </CardTitle>
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-4 py-1 rounded-full border border-red-100">Critical Stage</span>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-5 gap-6">
             {[
                { id: 'A', label: 'Airway', options: ['Clear', 'Partial Obstr.', 'Total Obstr.'] },
                { id: 'B', label: 'Breathing', options: ['Normal', 'Tachypnea', 'Bradypnea', 'Apnea'] },
                { id: 'C', label: 'Circulation', options: ['Stable', 'Hemorrhage', 'Shock'] },
                { id: 'D', label: 'Disability', options: ['Alert', 'Voice', 'Pain', 'Unresp.'] },
                { id: 'E', label: 'Exposure', options: ['Normal', 'Deformity', 'Trauma'] }
             ].map((step) => (
               <div key={step.id} className="border-2 border-slate-100 rounded-[2rem] overflow-hidden flex flex-col bg-white hover:border-blue-100 transition-colors">
                  <div className="bg-slate-900 text-white text-[10px] font-black p-4 text-center uppercase tracking-widest">
                     {step.id} • {step.label}
                  </div>
                  <div className="p-6 flex flex-col gap-4 flex-1 justify-center">
                     <RadioGroup 
                        value={formData.primarySurvey?.[step.id] || ''} 
                        onValueChange={(val) => updateField('primarySurvey', step.id, val)}
                        className="flex flex-col gap-3"
                     >
                        {step.options.map(opt => (
                          <div key={opt} className="flex items-center gap-3 group cursor-pointer">
                             <RadioGroupItem value={opt} id={`abcde_${step.id}_${opt}`} />
                             <Label htmlFor={`abcde_${step.id}_${opt}`} className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase cursor-pointer">
                                {opt}
                             </Label>
                          </div>
                        ))}
                     </RadioGroup>
                  </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── SUBJECTIVE & SECONDARY SURVEY ─── */}
      <div className="grid grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Text Entries */}
        <div className="col-span-7 flex flex-col gap-10">
           <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                 <CardTitle className="flex items-center gap-4">
                    <Info size={16} className="text-blue-600" /> Chief Complaint & History
                 </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                 <Textarea 
                    className="min-h-[180px] text-sm font-bold"
                    placeholder="S: Patient complaints..."
                    value={formData.subjective || ''}
                    onChange={(e) => updateField(null, 'subjective', e.target.value)}
                 />
              </CardContent>
           </Card>
           
           <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                 <CardTitle className="flex items-center gap-4">
                    <Eye size={16} className="text-blue-600" /> Physical Exam (Head-to-Toe)
                 </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                 <Textarea 
                    className="min-h-[260px] text-sm font-bold"
                    placeholder="O: Objective findings..."
                    value={formData.objective || ''}
                    onChange={(e) => updateField(null, 'objective', e.target.value)}
                 />
              </CardContent>
           </Card>
        </div>

        {/* Right Column: Widgets */}
        <div className="col-span-5 flex flex-col gap-10">
           {/* GCS & Neuro */}
           <Card className="bg-slate-900 border-none shadow-2xl rounded-[3rem] p-4 flex flex-col">
              <CardHeader className="pb-8">
                 <CardTitle className="text-blue-400 flex items-center gap-4">
                    <Brain size={18} /> Neurological Hub (GCS)
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-8">
                 <div className="grid grid-cols-3 gap-6">
                    {[
                       { l: 'Eye', m: 4, f: 'gcs_e' },
                       { l: 'Motor', m: 6, f: 'gcs_m' },
                       { l: 'Verbal', m: 5, f: 'gcs_v' }
                    ].map(x => (
                      <div key={x.f} className="flex flex-col items-center">
                         <Label className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">{x.l}</Label>
                         <Input 
                            type="number" max={x.m} min={1}
                            className="w-full bg-white/5 border-white/10 h-16 text-3xl font-black text-center text-white focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                            value={formData.neuro?.[x.f] || ''}
                            onChange={(e) => updateField('neuro', x.f, e.target.value)}
                         />
                         <p className="text-[7px] font-bold text-slate-600 mt-3 uppercase tracking-tighter">Max {x.m}</p>
                      </div>
                    ))}
                 </div>
                 <div className="pt-8 border-t border-white/10 flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Combined GCS</span>
                    <span className="text-5xl font-black text-blue-400 tabular-nums tracking-tighter">
                       {(parseInt(formData.neuro?.gcs_e)||0) + (parseInt(formData.neuro?.gcs_m)||0) + (parseInt(formData.neuro?.gcs_v)||0)}
                    </span>
                 </div>
              </CardContent>
           </Card>

           {/* Safety & Allergy */}
           <Card className="border-2 border-slate-100 rounded-[3rem] p-4 flex flex-col flex-1">
              <CardContent className="pt-6 flex flex-col gap-10">
                 <div className="flex flex-col gap-4">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                       <ShieldCheck size={16} className="text-red-500" /> Allergy Alert
                    </Label>
                    <Input 
                       className="h-14 border-slate-200 bg-red-50/20 focus-visible:border-red-400 focus-visible:ring-red-100 text-sm"
                       placeholder="Document allergies..."
                       value={formData.allergies || ''}
                       onChange={(e) => updateField(null, 'allergies', e.target.value)}
                    />
                 </div>
                 <div className="flex flex-col gap-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Patient Safety Screening</p>
                    <div className="flex flex-col gap-3">
                       {[
                          { l: 'Fall Risk', f: 'safety_fall' },
                          { l: 'Suicide Risk', f: 'safety_suicide' },
                          { l: 'Infection Control', f: 'safety_infection' }
                       ].map(s => (
                          <div key={s.f} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                             <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{s.l}</span>
                             <button 
                                type="button"
                                onClick={() => updateField('safety', s.f, !formData.safety?.[s.f])}
                                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${formData.safety?.[s.f] ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                             >
                                {formData.safety?.[s.f] ? 'HIGH' : 'LOW'}
                             </button>
                          </div>
                       ))}
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* ─── DIAGNOSIS & ACTION PLAN ─── */}
      <div className="grid grid-cols-2 gap-10">
         <Card className="bg-blue-50/30 border-blue-100 rounded-[3rem] p-4 flex flex-col">
            <CardHeader className="pb-6">
               <CardTitle className="text-blue-600 flex items-center gap-4">
                  <BadgeInfo size={18} /> Clinical Diagnosis
               </CardTitle>
            </CardHeader>
            <CardContent>
               <Textarea 
                  className="bg-white border-blue-100 min-h-[160px] focus-visible:ring-blue-100 focus-visible:border-blue-300 text-sm"
                  placeholder="Primary & Differential..."
                  value={formData.diagnosis || ''}
                  onChange={(e) => updateField(null, 'diagnosis', e.target.value)}
               />
            </CardContent>
         </Card>
         <Card className="bg-emerald-50/30 border-emerald-100 rounded-[3rem] p-4 flex flex-col">
            <CardHeader className="pb-6">
               <CardTitle className="text-emerald-600 flex items-center gap-4">
                  <Workflow size={18} /> Care Strategy
               </CardTitle>
            </CardHeader>
            <CardContent>
               <Textarea 
                  className="bg-white border-emerald-100 min-h-[160px] focus-visible:ring-emerald-100 focus-visible:border-emerald-300 text-sm"
                  placeholder="Integrated care plan..."
                  value={formData.carePlan || ''}
                  onChange={(e) => updateField(null, 'carePlan', e.target.value)}
               />
            </CardContent>
         </Card>
      </div>

      {/* ─── ACTION TIMELINE ─── */}
      <Card className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[3.5rem] flex flex-col">
         <CardHeader className="px-6 pb-12 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-4">
               <Clock size={16} className="text-blue-600" /> ER Intervention Timeline
            </CardTitle>
            <Button size="sm" className="rounded-full px-6 shadow-blue-600/10 active:scale-95">
               <Plus size={14} className="mr-2" /> Log Action
            </Button>
         </CardHeader>

         <CardContent className="px-6 relative pl-16 border-l-4 border-slate-200/50 flex flex-col gap-10 ml-8">
            {[
               { time: '14:20', action: 'Triage Assessment Completed', user: 'RN Sarah Jenkins' },
               { time: '14:25', action: 'Vital Signs & EWS Established', user: 'RN Sarah Jenkins' },
               { time: '14:35', action: 'Physician Initial Review', user: 'Dr. Marcus Holloway' }
            ].map((item, i) => (
              <div key={i} className="relative group">
                 <div className="absolute -left-[61px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-600 shadow-xl group-hover:scale-110 transition-transform"></div>
                 <div className="flex justify-between items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:border-blue-100 group-hover:shadow-md transition-all">
                    <div>
                       <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.action}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2 italic">Operator: {item.user}</p>
                    </div>
                    <span className="text-sm font-black text-blue-600 tabular-nums bg-blue-50 px-3 py-1 rounded-lg">{item.time}</span>
                 </div>
              </div>
            ))}
         </CardContent>
      </Card>

    </div>
  );
}
