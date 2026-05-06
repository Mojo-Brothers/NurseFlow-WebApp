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
  const [activeTab, setActiveTab] = useState('PERAWAT');
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineInput, setTimelineInput] = useState({ action: '', user: '', time: '' });
  
  const [showRjpModal, setShowRjpModal] = useState(false);
  const [rjpInput, setRjpInput] = useState({ type: 'OBAT', detail: '', time: '' });

  const handleAddTimeline = () => {
    if (!timelineInput.action || !timelineInput.time) return;
    const currentLogs = formData.timelineLogs || [];
    updateField(null, 'timelineLogs', [...currentLogs, timelineInput]);
    setShowTimelineModal(false);
    setTimelineInput({ action: '', user: '', time: '' });
  };

  const handleAddRjpLog = () => {
    if (!rjpInput.detail || !rjpInput.time) return;
    const currentLogs = formData.rjpLogs || [];
    updateField(null, 'rjpLogs', [...currentLogs, rjpInput]);
    setShowRjpModal(false);
    setRjpInput({ type: 'OBAT', detail: '', time: '' });
  };

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

      {/* ─── PREMIUM TAB NAVIGATION ─── */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit border border-slate-200/80 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
            {[
               { id: 'PERAWAT', label: 'Pengkajian Perawat', icon: <User size={14} /> },
               { id: 'DOKTER', label: 'Pengkajian Dokter', icon: <Stethoscope size={14} /> },
               { id: 'TINDAKAN', label: 'Tindakan Keperawatan', icon: <ClipboardCheck size={14} /> },
               { id: 'RJP', label: 'Resusitasi (RJP)', icon: <Heart size={14} /> }
            ].map(tab => (
               <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                     "flex items-center gap-2.5 px-6 py-2.5 rounded-[12px] text-[11px] font-black uppercase tracking-[0.08em] transition-all duration-300 relative",
                     activeTab === tab.id 
                        ? "bg-white text-blue-600 shadow-[0_4px_15px_rgba(37,99,235,0.1)] border border-slate-200/50 scale-[1.02]" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 border border-transparent hover:scale-[1.01]"
                  )}
               >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                     <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                  )}
               </button>
            ))}
         </div>
      </div>

      {activeTab === 'PERAWAT' && (
         <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
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
      <Card className="border-none shadow-none bg-transparent mb-6">
        <CardHeader className="px-0 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-900 flex items-center justify-center rounded-lg shadow-sm">
                <Activity size={16} className="text-white" />
             </div>
             <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">
               ABCDE SURVEY
             </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Critical Stage</span>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-5 gap-4 min-h-40">
             {[
                { 
                  id: 'A', label: 'Airway', 
                  options: [
                    { val: 'Clear', label: 'Clear', type: 'neutral' },
                    { val: 'Partial Obstr.', label: 'Partial', type: 'amber' },
                    { val: 'Total Obstr.', label: 'Total', type: 'red' }
                  ] 
                },
                { 
                  id: 'B', label: 'Breathing', 
                  options: [
                    { val: 'Normal', label: 'Normal', type: 'neutral' },
                    { val: 'Tachypnea', label: 'Tachypnea', type: 'amber' },
                    { val: 'Bradypnea', label: 'Bradypnea', type: 'amber' },
                    { val: 'Apnea', label: 'Apnea', type: 'red' }
                  ] 
                },
                { 
                  id: 'C', label: 'Circulation', 
                  options: [
                    { val: 'Stable', label: 'Stable', type: 'neutral' },
                    { val: 'Hemorrhage', label: 'Hemorrhage', type: 'amber' },
                    { val: 'Shock', label: 'Shock', type: 'red' }
                  ] 
                },
                { 
                  id: 'D', label: 'Disability', 
                  options: [
                    { val: 'Alert', label: 'Alert', type: 'neutral' },
                    { val: 'Voice', label: 'Voice', type: 'amber' },
                    { val: 'Pain', label: 'Pain', type: 'amber' },
                    { val: 'Unresp.', label: 'Unresponsive', type: 'red' }
                  ] 
                },
                { 
                  id: 'E', label: 'Exposure', 
                  options: [
                    { val: 'Normal', label: 'Normal', type: 'neutral' },
                    { val: 'Deformity', label: 'Deformity', type: 'amber' },
                    { val: 'Trauma', label: 'Trauma', type: 'red' }
                  ] 
                }
             ].map((step) => (
               <div key={step.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                     <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest text-left flex items-center">
                        <span className="text-blue-600 mr-2">{step.id}</span>
                        {step.label}
                     </h4>
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                     {step.options.map(opt => {
                       const isActive = formData.primarySurvey?.[step.id] === opt.val;
                       
                       let baseStyle = "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300";
                       let activeStyle = "";

                       if (opt.type === 'neutral') {
                          activeStyle = "bg-slate-800 border-slate-900 text-white shadow-md";
                       } else if (opt.type === 'amber') {
                          baseStyle = "border-amber-100/50 bg-amber-50/20 text-amber-700 hover:bg-amber-50 hover:border-amber-200";
                          activeStyle = "bg-amber-500 border-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]";
                       } else if (opt.type === 'red') {
                          baseStyle = "border-red-100/50 bg-red-50/20 text-red-700 hover:bg-red-50 hover:border-red-200";
                          activeStyle = "bg-red-600 border-red-700 text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)]";
                       }

                       return (
                         <button
                           key={opt.val}
                           type="button"
                           onClick={() => updateField('primarySurvey', step.id, opt.val)}
                           className={cn(
                             "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group",
                             isActive ? activeStyle : baseStyle
                           )}
                         >
                            <span className={cn(
                               "text-[10px] uppercase tracking-wide z-10 relative",
                               isActive ? "font-semibold" : "font-medium"
                            )}>
                               {opt.label}
                            </span>
                            
                            {isActive ? (
                               <div className={cn("w-1.5 h-1.5 rounded-full z-10 relative shadow-sm", opt.type === 'red' && "animate-pulse")} style={{ backgroundColor: 'white' }} />
                            ) : (
                               <div className="w-1.5 h-1.5 rounded-full z-10 relative opacity-0 group-hover:opacity-20 transition-opacity bg-current" />
                            )}
                         </button>
                       );
                     })}
                  </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── CLINICAL DOCUMENTATION FLOW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-6 items-stretch mb-6">
         {/* ROW 1: Subjective & Neuro */}
         {/* Subjective */}
         <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                     <Info size={14} strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
                     S — Subjective
                  </CardTitle>
               </div>
               <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><Clock size={10} /> {liveTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5"><User size={10} /> RN On-Duty</span>
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative group">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none h-4" />
               <Textarea 
                  className="w-full h-full min-h-[160px] border-0 rounded-none resize-none text-[13px] font-semibold text-slate-700 p-6 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-inset bg-transparent placeholder:text-slate-300 placeholder:font-medium transition-all"
                  placeholder="Patient complaints and history of present illness..."
                  value={formData.subjective || ''}
                  onChange={(e) => updateField(null, 'subjective', e.target.value)}
               />
            </CardContent>
         </Card>

         {/* GCS & Neuro - Redesigned to be tactile */}
         <Card className="bg-[#0A0F1C] border border-slate-800 shadow-xl rounded-2xl flex flex-col h-full overflow-hidden relative">
            {/* Subtle top glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            
            <CardHeader className="px-6 py-5 border-b border-white/5">
               <CardTitle className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                  <Brain size={16} /> Neurological Hub (GCS)
               </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 flex flex-col gap-8 flex-1">
               <div className="flex flex-col gap-5">
                  {[
                     { l: 'Eye', m: 4, f: 'gcs_e' },
                     { l: 'Motor', m: 6, f: 'gcs_m' },
                     { l: 'Verbal', m: 5, f: 'gcs_v' }
                  ].map(x => (
                    <div key={x.f} className="flex flex-col gap-2.5">
                       <div className="flex justify-between items-center px-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{x.l}</Label>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Max {x.m}</span>
                       </div>
                       <div className="flex gap-1.5">
                          {Array.from({length: x.m}, (_, i) => x.m - i).map(val => {
                             const isSelected = parseInt(formData.neuro?.[x.f]) === val;
                             return (
                                <button
                                   key={val}
                                   type="button"
                                   onClick={() => updateField('neuro', x.f, val.toString())}
                                   className={cn(
                                      "flex-1 h-9 rounded-lg text-[13px] font-black transition-all duration-200 border",
                                      isSelected 
                                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                                        : "bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-slate-300"
                                   )}
                                >
                                   {val}
                                </button>
                             );
                          })}
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-end px-2">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Combined Score</span>
                     <span className="text-[9px] font-bold text-slate-600 uppercase">Range: 3-15</span>
                  </div>
                  
                  {(() => {
                     const total = (parseInt(formData.neuro?.gcs_e)||0) + (parseInt(formData.neuro?.gcs_m)||0) + (parseInt(formData.neuro?.gcs_v)||0);
                     const isCritical = total > 0 && total <= 8;
                     const isWarning = total > 8 && total <= 12;
                     const isGood = total > 12;
                     return (
                        <div className={cn(
                           "text-6xl font-black tabular-nums tracking-tighter leading-none transition-colors",
                           isCritical ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" :
                           isWarning ? "text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                           isGood ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]" :
                           "text-slate-600"
                        )}>
                           {total === 0 ? '--' : total}
                        </div>
                     );
                  })()}
               </div>
            </CardContent>
         </Card>

         {/* ROW 2: Objective & Safety */}
         {/* Objective */}
         <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                     <Eye size={14} strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
                     O — Objective Exam
                  </CardTitle>
               </div>
               <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50"><Save size={10} /> Auto-Saved</span>
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative group">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none h-4" />
               <Textarea 
                  className="w-full h-full min-h-[220px] border-0 rounded-none resize-none text-[13px] font-semibold text-slate-700 p-6 focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-inset bg-transparent placeholder:text-slate-300 placeholder:font-medium transition-all"
                  placeholder="Head-to-toe clinical findings..."
                  value={formData.objective || ''}
                  onChange={(e) => updateField(null, 'objective', e.target.value)}
               />
            </CardContent>
         </Card>

         {/* Safety & Allergy Module */}
         <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
               
               {/* Allergy Alert Module */}
               <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                     <Label className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-slate-400" /> Allergy Alert
                     </Label>
                     {formData.allergies ? (
                        <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-200">Critical</span>
                     ) : (
                        <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100">Unverified</span>
                     )}
                  </div>
                  
                  <div className={cn(
                     "relative border-2 rounded-xl transition-all duration-300 overflow-hidden group",
                     formData.allergies 
                        ? "border-red-400 bg-red-50 shadow-[0_4px_15px_rgba(239,68,68,0.15)]" 
                        : "border-slate-200 bg-slate-50 focus-within:border-amber-400 focus-within:bg-amber-50 focus-within:shadow-[0_4px_15px_rgba(251,191,36,0.15)]"
                  )}>
                     <Input 
                        className="h-12 border-0 bg-transparent text-sm font-bold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-0 px-4"
                        placeholder="Document known allergies..."
                        value={formData.allergies || ''}
                        onChange={(e) => updateField(null, 'allergies', e.target.value)}
                     />
                     {formData.allergies && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Safety Screening Blocks */}
               <div className="flex flex-col gap-3 p-6 pt-5 bg-slate-50/50 border-t border-slate-100 flex-1">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                     <BadgeInfo size={14} className="text-slate-400" /> Patient Safety
                  </p>
                  <div className="flex flex-col gap-2.5">
                     {[
                        { l: 'Fall Risk', f: 'safety_fall', icon: <Activity size={14} /> },
                        { l: 'Suicide Risk', f: 'safety_suicide', icon: <AlertCircle size={14} /> },
                        { l: 'Infection Control', f: 'safety_infection', icon: <ShieldAlert size={14} /> }
                     ].map(s => {
                        const isHigh = formData.safety?.[s.f];
                        return (
                           <button 
                              key={s.f}
                              type="button"
                              onClick={() => updateField('safety', s.f, !isHigh)}
                              className={cn(
                                 "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 text-left group",
                                 isHigh 
                                    ? "bg-red-600 border-red-500 text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)]" 
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                              )}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    isHigh ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                                 )}>
                                    {s.icon}
                                 </div>
                                 <span className="text-[11px] font-black uppercase tracking-wide">{s.l}</span>
                              </div>
                              <div className={cn(
                                 "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                                 isHigh 
                                    ? "bg-white/20 border-white/20 text-white shadow-inner" 
                                    : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300"
                              )}>
                                 {isHigh ? 'HIGH RISK' : 'LOW RISK'}
                              </div>
                           </button>
                        );
                     })}
                  </div>
               </div>

            </CardContent>
         </Card>
      </div>
         </div>
      )}

      {activeTab === 'DOKTER' && (
         <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {/* ─── PENGKAJIAN MEDIS (DOKTER) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6 items-stretch">
               {/* Left: Anamnesis */}
               <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                           <Stethoscope size={14} strokeWidth={2.5} />
                        </div>
                        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
                           Anamnesis Medis
                        </CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col flex-1">
                     <div className="p-4 border-b border-slate-100 flex-1">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Keluhan Utama & Riwayat Penyakit</Label>
                        <Textarea 
                           className="w-full min-h-[140px] border-slate-200 rounded-xl resize-none text-sm font-medium text-slate-700 p-4 focus-visible:ring-indigo-100 bg-slate-50/50"
                           placeholder="Jelaskan keluhan utama..."
                           value={formData.medicalAnamnesis || ''}
                           onChange={(e) => updateField(null, 'medicalAnamnesis', e.target.value)}
                        />
                     </div>
                     <div className="p-4 flex-1">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Riwayat Penyakit Dahulu & Operasi</Label>
                        <Textarea 
                           className="w-full min-h-[140px] border-slate-200 rounded-xl resize-none text-sm font-medium text-slate-700 p-4 focus-visible:ring-indigo-100 bg-slate-50/50"
                           placeholder="Riwayat medis pasien..."
                           value={formData.medicalHistory || ''}
                           onChange={(e) => updateField(null, 'medicalHistory', e.target.value)}
                        />
                     </div>
                  </CardContent>
               </Card>

               {/* Right: Pemeriksaan Fisik Lanjutan */}
               <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100/50">
                           <Microscope size={14} strokeWidth={2.5} />
                        </div>
                        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
                           Pemeriksaan Fisik & Penunjang
                        </CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col h-full">
                     <div className="flex flex-col flex-1 p-4 gap-4">
                        <div className="flex-1">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pemeriksaan Fisik Detail</Label>
                           <Textarea 
                              className="w-full h-full min-h-[150px] border-slate-200 rounded-xl resize-none text-sm font-medium text-slate-700 p-4 focus-visible:ring-teal-100 bg-slate-50/50"
                              placeholder="Kepala, Leher, Thorax, Abdomen, Ekstremitas..."
                              value={formData.physicalExam || ''}
                              onChange={(e) => updateField(null, 'physicalExam', e.target.value)}
                           />
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pemeriksaan Penunjang (Laboratorium, Rad, dll)</Label>
                           <div className="space-y-3">
                              {['EKG', 'CT Scan', 'Thorax', 'Laboratorium'].map(exam => (
                                 <div key={exam} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                                       {formData.exams?.[exam] && <CheckCircle2 size={12} className="text-teal-600" />}
                                    </div>
                                    <Input 
                                       className="h-10 text-xs font-medium border-slate-200 focus-visible:ring-teal-100 bg-white shadow-sm flex-1"
                                       placeholder={`Keterangan ${exam}...`}
                                       value={formData.exams?.[exam] || ''}
                                       onChange={(e) => updateField('exams', exam, e.target.value)}
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
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
         </div>
      )}

      {activeTab === 'TINDAKAN' && (
         <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* ─── ACTION TIMELINE ─── */}
      <Card className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[3.5rem] flex flex-col">
         <CardHeader className="px-6 pb-12 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-4">
               <Clock size={16} className="text-blue-600" /> ER Intervention Timeline
            </CardTitle>
            <Button size="sm" className="rounded-full px-6 shadow-blue-600/10 active:scale-95" onClick={() => setShowTimelineModal(true)}>
               <Plus size={14} className="mr-2" /> Log Action
            </Button>
         </CardHeader>

         <CardContent className="px-6 relative pl-16 border-l-4 border-slate-200/50 flex flex-col gap-10 ml-8">
            {(formData.timelineLogs && formData.timelineLogs.length > 0 ? formData.timelineLogs : [
               { time: '14:20', action: 'Triage Assessment Completed', user: 'RN Sarah Jenkins' },
               { time: '14:25', action: 'Vital Signs & EWS Established', user: 'RN Sarah Jenkins' }
            ]).map((item, i) => (
              <div key={i} className="relative group">
                 <div className="absolute -left-[61px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-600 shadow-xl group-hover:scale-110 transition-transform"></div>
                 <div className="flex justify-between items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:border-blue-100 group-hover:shadow-md transition-all">
                    <div>
                       <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.action}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2 italic">Operator: {item.user || 'On-Duty Staff'}</p>
                    </div>
                    <span className="text-sm font-black text-blue-600 tabular-nums bg-blue-50 px-3 py-1 rounded-lg">{item.time}</span>
                 </div>
              </div>
            ))}
         </CardContent>
      </Card>
         </div>
      )}

      {activeTab === 'RJP' && (
         <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {/* ─── RESUSITASI JANTUNG PARU (RJP) ─── */}
            <div className="bg-red-50/40 border border-red-100 p-8 rounded-[3rem] relative overflow-hidden">
               {/* Background Warning Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
               <div className="absolute top-4 right-8 flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-full border border-red-200">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Code Blue Active</span>
               </div>
               
               <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                     <Heart size={24} className="animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-red-950 uppercase tracking-tight">Protokol Resusitasi (RJP)</h2>
                     <p className="text-xs font-bold text-red-700/80 uppercase tracking-widest mt-1">Advanced Cardiac Life Support</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Indikasi & Tim */}
                  <Card className="bg-white border border-red-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                     <CardHeader className="bg-red-50/50 border-b border-red-50 px-6 py-4">
                        <CardTitle className="text-[11px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                           <AlertTriangle size={14} /> Indikasi & Tim Resusitasi
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 flex flex-col gap-6 flex-1">
                        <div>
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Indikasi Dilakukan RJP</Label>
                           <Textarea 
                              className="w-full min-h-[100px] border-slate-200 rounded-xl resize-none text-sm font-medium text-slate-700 focus-visible:ring-red-100"
                              placeholder="Kondisi pasien saat RJP dimulai (misal: Cardiac Arrest, Asistol)..."
                              value={formData.rjpIndication || ''}
                              onChange={(e) => updateField(null, 'rjpIndication', e.target.value)}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Waktu Mulai RJP</Label>
                              <Input 
                                 type="time"
                                 className="h-12 border-slate-200 rounded-xl text-lg font-bold tabular-nums text-slate-800 focus-visible:ring-red-100"
                                 value={formData.rjpStartTime || ''}
                                 onChange={(e) => updateField(null, 'rjpStartTime', e.target.value)}
                              />
                           </div>
                           <div>
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Dokter Penanggung Jawab</Label>
                              <Input 
                                 className="h-12 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus-visible:ring-red-100"
                                 placeholder="Nama Dokter..."
                                 value={formData.rjpDoctor || ''}
                                 onChange={(e) => updateField(null, 'rjpDoctor', e.target.value)}
                              />
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Airway & Circulation */}
                  <Card className="bg-white border border-red-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                     <CardHeader className="bg-red-50/50 border-b border-red-50 px-6 py-4">
                        <CardTitle className="text-[11px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                           <Activity size={14} /> Airway & Circulation
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 flex flex-col gap-6 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Intubasi (Waktu & Ukuran ETT)</Label>
                              <div className="flex items-center gap-3">
                                 <Input type="time" className="w-32 h-10 border-slate-200 rounded-xl font-bold tabular-nums" value={formData.rjpIntubationTime || ''} onChange={(e) => updateField(null, 'rjpIntubationTime', e.target.value)} />
                                 <Input className="h-10 border-slate-200 rounded-xl flex-1 text-sm font-medium" placeholder="Ukuran ETT & Batas..." value={formData.rjpEttSize || ''} onChange={(e) => updateField(null, 'rjpEttSize', e.target.value)} />
                              </div>
                           </div>
                           <div className="col-span-2 border-t border-slate-100 pt-4">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pemasangan Akses IV & Cairan</Label>
                              <div className="flex items-center gap-3">
                                 <Input className="h-10 border-slate-200 rounded-xl w-1/3 text-sm font-medium" placeholder="Akses IV..." value={formData.rjpIvAccess || ''} onChange={(e) => updateField(null, 'rjpIvAccess', e.target.value)} />
                                 <Input className="h-10 border-slate-200 rounded-xl flex-1 text-sm font-medium" placeholder="Cairan IV yang dipakai..." value={formData.rjpFluids || ''} onChange={(e) => updateField(null, 'rjpFluids', e.target.value)} />
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* Penatalaksanaan, Defibrilasi, Hasil Akhir */}
               <div className="mt-8 grid grid-cols-1 gap-8 relative z-10">
                  <Card className="bg-white border border-red-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                     <CardHeader className="bg-red-50/50 border-b border-red-50 px-6 py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-[11px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                           <Zap size={14} /> Monitoring Obat & Defibrilasi
                        </CardTitle>
                        <Button size="sm" onClick={() => setShowRjpModal(true)} className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8 px-4 text-[10px] font-black uppercase tracking-wider">
                           <Plus size={12} className="mr-1.5" /> Tambah Log
                        </Button>
                     </CardHeader>
                     <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                           {formData.rjpLogs && formData.rjpLogs.length > 0 ? (
                              formData.rjpLogs.map((log, i) => (
                                 <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                       <div className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center border",
                                          log.type === 'SHOCK' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                       )}>
                                          {log.type === 'SHOCK' ? <Zap size={14} /> : <Pill size={14} />}
                                       </div>
                                       <div>
                                          <p className="text-xs font-black text-slate-800 uppercase">{log.type === 'SHOCK' ? 'Defibrilasi' : 'Pemberian Obat'}</p>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{log.detail}</p>
                                       </div>
                                    </div>
                                    <div className="text-sm font-black tabular-nums text-slate-600">{log.time}</div>
                                 </div>
                              ))
                           ) : (
                              <div className="p-6 text-center">
                                 <p className="text-xs font-semibold text-slate-400 italic">Belum ada data pemberian obat atau defibrilasi.</p>
                              </div>
                           )}
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-red-600/10 pointer-events-none mix-blend-overlay" />
                     <CardHeader className="border-b border-slate-800 px-6 py-4">
                        <CardTitle className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <Activity size={14} className="text-slate-400" /> Hasil Akhir RJP
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 flex flex-col md:flex-row gap-8 relative z-10">
                        <div className="flex-1">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Catatan Klinis Hasil Akhir</Label>
                           <Textarea 
                              className="w-full min-h-[120px] bg-slate-950 border-slate-800 rounded-xl resize-none text-sm font-medium text-white focus-visible:ring-slate-700 placeholder:text-slate-600"
                              placeholder="Kondisi akhir pasien setelah RJP..."
                              value={formData.rjpOutcomeNotes || ''}
                              onChange={(e) => updateField(null, 'rjpOutcomeNotes', e.target.value)}
                           />
                        </div>
                        <div className="w-full md:w-64 flex flex-col gap-4">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Outcome</Label>
                           <RadioGroup 
                              value={formData.rjpOutcome || ''} 
                              onValueChange={(val) => updateField(null, 'rjpOutcome', val)}
                              className="flex flex-col gap-3"
                           >
                              <div className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                                 <RadioGroupItem value="ROSC" id="outcome-rosc" className="border-slate-500 text-emerald-500" />
                                 <Label htmlFor="outcome-rosc" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">ROSC (Pindah ICU)</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                                 <RadioGroupItem value="DECEASED" id="outcome-deceased" className="border-slate-500 text-red-500" />
                                 <Label htmlFor="outcome-deceased" className="text-xs font-bold text-slate-300 uppercase tracking-widest cursor-pointer">Meninggal</Label>
                              </div>
                           </RadioGroup>
                           <div className="mt-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Waktu Selesai</Label>
                              <Input 
                                 type="time"
                                 className="h-10 bg-slate-950 border-slate-800 rounded-xl text-sm font-bold tabular-nums text-white focus-visible:ring-slate-700"
                                 value={formData.rjpEndTime || ''}
                                 onChange={(e) => updateField(null, 'rjpEndTime', e.target.value)}
                              />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </div>
      )}

    </div>

      {/* ─── DIALOG FORMS (MODALS) ─── */}
      {showTimelineModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTimelineModal(false)} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
               <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Plus size={16} strokeWidth={3} />
                     </div>
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tambah Tindakan</h3>
                  </div>
                  <button onClick={() => setShowTimelineModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 flex flex-col gap-5">
                  <div>
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tindakan / Aktivitas</Label>
                     <Input 
                        className="h-12 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus-visible:ring-blue-100"
                        placeholder="Deskripsi tindakan..."
                        value={timelineInput.action}
                        onChange={e => setTimelineInput({...timelineInput, action: e.target.value})}
                        autoFocus
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Waktu Tindakan</Label>
                        <Input 
                           type="time"
                           className="h-12 border-slate-200 rounded-xl text-lg font-bold tabular-nums text-slate-800 focus-visible:ring-blue-100"
                           value={timelineInput.time}
                           onChange={e => setTimelineInput({...timelineInput, time: e.target.value})}
                        />
                     </div>
                     <div>
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Operator (Opsional)</Label>
                        <Input 
                           className="h-12 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus-visible:ring-blue-100"
                           placeholder="Nama perawat/dokter..."
                           value={timelineInput.user}
                           onChange={e => setTimelineInput({...timelineInput, user: e.target.value})}
                        />
                     </div>
                  </div>
                  <Button onClick={handleAddTimeline} className="mt-4 h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider">
                     Simpan Ke Timeline
                  </Button>
               </div>
            </div>
         </div>
      )}

      {showRjpModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRjpModal(false)} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
               <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                        <Activity size={16} strokeWidth={3} />
                     </div>
                     <h3 className="text-sm font-black text-red-800 uppercase tracking-widest">Input Obat / Shock</h3>
                  </div>
                  <button onClick={() => setShowRjpModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 flex flex-col gap-5">
                  <div>
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Jenis Intervensi</Label>
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                           onClick={() => setRjpInput({...rjpInput, type: 'OBAT'})}
                           className={cn("h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all", rjpInput.type === 'OBAT' ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                        >
                           Obat-obatan
                        </button>
                        <button 
                           onClick={() => setRjpInput({...rjpInput, type: 'SHOCK'})}
                           className={cn("h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all", rjpInput.type === 'SHOCK' ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                        >
                           Defibrilasi (Shock)
                        </button>
                     </div>
                  </div>
                  <div>
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Detail (Dosis / Joule)</Label>
                     <Input 
                        className="h-12 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus-visible:ring-red-100"
                        placeholder={rjpInput.type === 'OBAT' ? "Contoh: Epinephrine 1mg IV..." : "Contoh: Biphasic 200 Joule..."}
                        value={rjpInput.detail}
                        onChange={e => setRjpInput({...rjpInput, detail: e.target.value})}
                        autoFocus
                     />
                  </div>
                  <div>
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Waktu Diberikan</Label>
                     <Input 
                        type="time"
                        className="h-12 border-slate-200 rounded-xl text-lg font-bold tabular-nums text-slate-800 focus-visible:ring-red-100"
                        value={rjpInput.time}
                        onChange={e => setRjpInput({...rjpInput, time: e.target.value})}
                     />
                  </div>
                  <Button onClick={handleAddRjpLog} className="mt-4 h-12 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider">
                     Catat Intervensi
                  </Button>
               </div>
            </div>
         </div>
      )}

  );
}
