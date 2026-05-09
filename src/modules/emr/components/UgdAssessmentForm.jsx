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

  const [activeZone, setActiveZone] = useState('zone-triage');

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

  useEffect(() => {
    if (activeTab !== 'PERAWAT') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveZone(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    const sections = document.querySelectorAll('section[id^="zone-"]');
    setTimeout(() => {
      document.querySelectorAll('section[id^="zone-"]').forEach((s) => observer.observe(s));
    }, 100);
    return () => document.querySelectorAll('section[id^="zone-"]').forEach((s) => observer.unobserve(s));
  }, [activeTab]);

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
         <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both pb-32">
               
               {/* ─── LEFT PILLAR: MINI WORKFLOW RAIL (2 COLS) ─── */}
               <div className="hidden md:block col-span-2 sticky top-6">
                  <div className="flex flex-col gap-1.5 bg-white/60 backdrop-blur-xl rounded-[2rem] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white">
                     <div className="px-3 pb-3 border-b border-slate-100/50 mb-1 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Workflow</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     </div>
                     {[
                        { id: 'os-triage', label: 'Triage', icon: <Siren size={14} /> },
                        { id: 'os-neuro', label: 'Neuro', icon: <Brain size={14} /> },
                        { id: 'os-docs', label: 'History', icon: <FileText size={14} /> }
                     ].map(zone => {
                        const isActive = activeZone === zone.id;
                        return (
                           <button
                              key={zone.id}
                              type="button"
                              onClick={() => {
                                 setActiveZone(zone.id);
                                 document.getElementById(zone.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className={cn(
                                 "flex flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group",
                                 isActive 
                                    ? "bg-slate-900 text-white shadow-md" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                              )}
                           >
                              <div className={cn("transition-transform duration-300", isActive && "scale-110 text-emerald-400")}>
                                 {zone.icon}
                              </div>
                              <span className="text-center leading-tight">{zone.label}</span>
                              {isActive && <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-400 rounded-full" />}
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* ─── CENTER PILLAR: MAIN CLINICAL WORKSPACE (7 COLS) ─── */}
               <div className="col-span-1 md:col-span-7 flex flex-col gap-10">
                  
                  {/* ZONE 1: Triage & Admission */}
                  <section id="os-triage" className="scroll-mt-6">
                     <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                              <Siren size={16} />
                           </div>
                           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Triage & Admission</h2>
                           <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                        </div>
                        
                        <div className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm p-8">
                           <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                              <div className="flex flex-col gap-3">
                                 <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Waktu Masuk <span className="text-red-500">*</span></Label>
                                 <Input type="datetime-local" className="h-14 rounded-2xl border-slate-200 font-bold text-slate-800 bg-slate-50/50 focus-visible:ring-blue-500/20 text-sm px-4" value={formData.waktuMasuk || ''} onChange={e => updateField(null, 'waktuMasuk', e.target.value)} />
                              </div>
                              <div className="flex flex-col gap-3">
                                 <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Triage Obstetri</Label>
                                 <div className="flex gap-2 h-14 bg-slate-100/80 p-1.5 rounded-[1.25rem] border border-slate-200/50">
                                    {['Merah', 'Kuning', 'Hijau', 'Hitam'].map(v => {
                                       const isSelected = formData.triageObstetri === v;
                                       return (
                                          <button
                                             key={v}
                                             type="button"
                                             onClick={() => updateField(null, 'triageObstetri', v)}
                                             className={cn(
                                                "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                isSelected ? "bg-white text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                             )}
                                          >
                                             {v}
                                          </button>
                                       );
                                    })}
                                 </div>
                              </div>
                              <div className="xl:col-span-2 flex flex-col gap-3">
                                 <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">ESI Level <span className="text-red-500">*</span></Label>
                                 <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map(v => {
                                       const isSelected = parseInt(formData.esi) === v;
                                       return (
                                          <button
                                             key={v}
                                             type="button"
                                             onClick={() => updateField(null, 'esi', v)}
                                             className={cn(
                                                "flex-1 h-16 rounded-2xl text-xl font-black transition-all duration-300 border-2",
                                                isSelected 
                                                   ? "bg-red-600 text-white border-red-500 shadow-[0_8px_20px_rgba(220,38,38,0.25)] scale-[1.02]" 
                                                   : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                             )}
                                          >
                                             {v}
                                          </button>
                                       );
                                    })}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* ZONE 2: Neuro Block */}
                  <section id="os-neuro" className="scroll-mt-6">
                     <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                              <Brain size={16} />
                           </div>
                           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Neuro & Motor Block</h2>
                           <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm p-8">
                           <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                              {/* GCS Segment */}
                              <div className="flex flex-col gap-6">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Glasgow Coma Scale</Label>
                                 <div className="flex flex-col gap-4">
                                    {[
                                       { l: 'E (Eye)', m: 4, f: 'gcsE' },
                                       { l: 'V (Verbal)', m: 5, f: 'gcsV' },
                                       { l: 'M (Motorik)', m: 6, f: 'gcsM' }
                                    ].map(x => (
                                      <div key={x.f} className="flex flex-col gap-2">
                                         <div className="flex justify-between items-center px-2">
                                            <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">{x.l}</Label>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max {x.m}</span>
                                         </div>
                                         <div className="flex gap-2">
                                            {Array.from({length: x.m}, (_, i) => x.m - i).map(val => {
                                               const isSelected = parseInt(formData[x.f]) === val;
                                               return (
                                                  <button
                                                     key={val}
                                                     type="button"
                                                     onClick={() => updateField(null, x.f, val.toString())}
                                                     className={cn(
                                                        "flex-1 h-12 rounded-[1rem] text-sm font-black transition-all duration-200 border-2",
                                                        isSelected 
                                                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md" 
                                                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
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
                              </div>

                              {/* Clinical State Segments */}
                              <div className="flex flex-col gap-8">
                                 <div className="flex flex-col gap-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat Kesadaran <span className="text-red-500">*</span></Label>
                                    <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-[1.25rem] border border-slate-200/50">
                                       {['Compos Mentis', 'Apatis', 'Somnolen', 'Sopor', 'Coma'].map(v => {
                                          const isSelected = (formData.tingkatKesadaran || 'Compos Mentis') === v;
                                          return (
                                             <button
                                                key={v}
                                                type="button"
                                                onClick={() => updateField(null, 'tingkatKesadaran', v)}
                                                className={cn(
                                                   "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                   isSelected ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                                )}
                                             >
                                                {v}
                                             </button>
                                          );
                                       })}
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-3">
                                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capillary Refill (CRT) <span className="text-red-500">*</span></Label>
                                       <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
                                          {['< 2 detik', '> 2 detik'].map(v => {
                                             const isSelected = (formData.crt || '< 2 detik') === v;
                                             return (
                                                <button key={v} type="button" onClick={() => updateField(null, 'crt', v)} className={cn("flex-1 px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isSelected ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")}>{v}</button>
                                             );
                                          })}
                                       </div>
                                    </div>
                                    <div className="flex gap-4">
                                       <div className="flex-1 flex flex-col gap-3">
                                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BB (Kg)</Label>
                                          <Input className="h-12 border-slate-200 rounded-xl bg-slate-50 text-base font-bold text-center text-slate-800" placeholder="--" value={formData.beratBadan || ''} onChange={e => updateField(null, 'beratBadan', e.target.value)} />
                                       </div>
                                       <div className="flex-1 flex flex-col gap-3">
                                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TB (cm)</Label>
                                          <Input className="h-12 border-slate-200 rounded-xl bg-slate-50 text-base font-bold text-center text-slate-800" placeholder="--" value={formData.tinggiBadan || ''} onChange={e => updateField(null, 'tinggiBadan', e.target.value)} />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* ZONE 3: Narrative Documentation Surface */}
                  <section id="os-docs" className="scroll-mt-6">
                     <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-slate-200/50 text-slate-600 flex items-center justify-center shadow-inner border border-slate-200">
                              <FileText size={16} />
                           </div>
                           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Narrative Documentation</h2>
                           <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                        </div>

                        {/* Borderless Canvas approach */}
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200/50 p-8 shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)]">
                           <div className="flex flex-col gap-10">
                              
                              <div className="flex flex-col gap-4">
                                 <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">Anamnesis & Keluhan Utama <span className="text-red-500">*</span></Label>
                                 <Textarea 
                                    className="w-full min-h-[180px] rounded-[1.5rem] resize-none border-0 bg-white font-medium text-sm text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-100 p-6 shadow-sm" 
                                    placeholder="Dokumentasikan narasi klinis secara lengkap disini..." 
                                    value={formData.anamnesis || ''} 
                                    onChange={e => updateField(null, 'anamnesis', e.target.value)} 
                                 />
                              </div>

                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                 <div className="flex flex-col gap-4">
                                    <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">Riwayat Penyakit Dahulu <span className="text-red-500">*</span></Label>
                                    <Textarea className="w-full min-h-[120px] rounded-[1.5rem] resize-none border-0 bg-white font-medium text-sm text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-100 p-6 shadow-sm" placeholder="Penyakit kronis, operasi..." value={formData.riwayatPenyakitDahulu || ''} onChange={e => updateField(null, 'riwayatPenyakitDahulu', e.target.value)} />
                                 </div>
                                 <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-4 flex-1">
                                       <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">Riwayat Konsumsi Obat</Label>
                                       <div className="flex-1 rounded-[1.5rem] bg-white border border-slate-200/80 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                          <Pill size={24} className="text-slate-300 mb-3" />
                                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rekam Obat di Rumah</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                                       <div>
                                          <Label className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">Indikasi Polisi/Forensik <span className="text-red-500">*</span></Label>
                                       </div>
                                       <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                          {['Tidak', 'Ya'].map(v => (
                                             <button key={v} type="button" onClick={() => updateField(null, 'kasusPolisi', v)} className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", (formData.kasusPolisi || 'Tidak') === v ? (v === 'Ya' ? "bg-red-600 text-white shadow-sm" : "bg-slate-800 text-white shadow-sm") : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}>{v}</button>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>

               {/* ─── RIGHT PILLAR: LIVE TELEMETRY + RISK ENGINE (3 COLS) ─── */}
               <div className="col-span-1 md:col-span-3 self-stretch bg-[#0B1120] text-slate-300 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-800 relative group">
                  <div className="sticky top-6 flex flex-col h-[calc(100vh-100px)] overflow-hidden rounded-[2.5rem]">
                     <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-50 z-20" />
                  
                  {/* Top Live Header */}
                  <div className="bg-slate-900/80 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-md">
                     <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" /> Patient Live State
                     </h3>
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-hide p-6 flex flex-col gap-8">
                     
                     {/* Telemetry Stack (Vertical) */}
                     <div className="flex flex-col gap-5">
                        <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telemetry Vitals</Label>
                        {[
                           { l: 'BP', desc: 'Tekanan Darah', f: 'tekananDarah', u: 'mmHg', color: 'text-emerald-400', border: 'focus-visible:border-emerald-500' },
                           { l: 'HR', desc: 'Nadi', f: 'nadi', u: 'bpm', color: 'text-emerald-400', border: 'focus-visible:border-emerald-500' },
                           { l: 'Suhu', desc: 'Temperature', f: 'suhu', u: '°C', color: 'text-orange-400', border: 'focus-visible:border-orange-500' },
                           { l: 'RR', desc: 'Pernafasan', f: 'pernafasan', u: 'rpm', color: 'text-cyan-400', border: 'focus-visible:border-cyan-500' },
                           { l: 'SpO2', desc: 'Saturasi', f: 'saturasi', u: '%', color: 'text-blue-400', border: 'focus-visible:border-blue-500' }
                        ].map(v => (
                           <div key={v.f} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{v.l}</span>
                                 <span className="text-[9px] font-medium text-slate-500">{v.desc}</span>
                              </div>
                              <div className="relative w-28">
                                 <Input 
                                    className={cn("h-10 bg-transparent border-0 border-b-2 border-slate-700 rounded-none text-xl font-black tabular-nums transition-all pl-2 pr-8 text-right focus-visible:ring-0", v.color, v.border)} 
                                    placeholder="--" 
                                    value={formData[v.f] || ''} 
                                    onChange={e => updateField(null, v.f, e.target.value)} 
                                 />
                                 <span className="absolute right-0 bottom-2.5 text-[8px] font-bold text-slate-600 uppercase pointer-events-none">{v.u}</span>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="h-px bg-white/10 w-full" />

                     {/* Risk Matrix Stack (Horizontal sliders feeling) */}
                     <div className="flex flex-col gap-5">
                        <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Assessment Rail</Label>
                        
                        {/* Pain Score */}
                        <div className="flex flex-col gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> Nyeri</span>
                              <div className="flex gap-1 bg-black/50 p-1 rounded-lg">
                                 {['Tidak Ada', 'Ada'].map(v => (
                                    <button key={v} type="button" onClick={() => updateField(null, 'keluhanNyeri', v)} className={cn("px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all", (formData.keluhanNyeri || 'Tidak Ada') === v ? (v === 'Ada' ? "bg-amber-500 text-white" : "bg-slate-700 text-white") : "text-slate-500")}>{v}</button>
                                 ))}
                              </div>
                           </div>
                           {formData.keluhanNyeri === 'Ada' && (
                              <div className="flex items-center gap-2 mt-2">
                                 <span className="text-[9px] text-slate-400 uppercase">Skor</span>
                                 <Input type="number" className="h-8 w-16 bg-black border-slate-700 text-amber-500 font-bold text-center text-sm" value={formData.skorNyeri || ''} onChange={e => updateField(null, 'skorNyeri', e.target.value)} />
                                 <Select value={formData.tipeNyeri || 'Akut'} onValueChange={v => updateField(null, 'tipeNyeri', v)}>
                                    <SelectTrigger className="h-8 border-slate-700 bg-black text-[9px] font-bold text-slate-300 uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Akut" className="text-[9px]">Akut</SelectItem><SelectItem value="Kronik" className="text-[9px]">Kronik</SelectItem></SelectContent>
                                 </Select>
                              </div>
                           )}
                        </div>

                        {/* Infection */}
                        <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12}/> Luka & Infeksi</span>
                           <div className="grid grid-cols-2 gap-2 mt-1">
                              {['Tidak Ada', 'Udara', 'Kontak', 'Droplet'].map(v => (
                                 <button key={v} type="button" onClick={() => updateField(null, 'risikoInfeksi', v)} className={cn("py-1.5 rounded-md text-[9px] font-bold uppercase transition-all border", (formData.risikoInfeksi || 'Tidak Ada') === v ? "bg-red-500/20 border-red-500 text-red-400" : "border-slate-800 text-slate-500 hover:border-slate-600")}>{v}</button>
                              ))}
                           </div>
                        </div>

                        {/* Fall Risk */}
                        <div className="flex flex-col gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1"><Activity size={12}/> Fall Risk (Get Up & Go)</span>
                           <div className="flex flex-col gap-2 mt-1">
                              {[
                                 { l: 'Berjalan Sempoyongan', f: 'jatuhBerjalan' },
                                 { l: 'Memegang Penopang', f: 'jatuhDuduk' }
                              ].map(q => (
                                 <div key={q.f} className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[9px] text-slate-400 truncate max-w-[60%]">{q.l}</span>
                                    <div className="flex gap-1 bg-black/50 p-1 rounded-md">
                                       {['Tidak', 'Ya'].map(v => (
                                          <button key={v} type="button" onClick={() => updateField(null, q.f, v)} className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all", (formData[q.f] || 'Tidak') === v ? (v === 'Ya' ? "bg-purple-500 text-white" : "bg-slate-700 text-white") : "text-slate-500")}>{v}</button>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                              <div className={cn("mt-2 text-[9px] font-black uppercase text-center py-2 rounded-lg border", formData.jatuhBerjalan === 'Ya' || formData.jatuhDuduk === 'Ya' ? "bg-red-500/20 border-red-500 text-red-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}>
                                 {formData.jatuhBerjalan === 'Ya' || formData.jatuhDuduk === 'Ya' ? 'ALERT: RISIKO JATUH' : 'TIDAK BERISIKO'}
                              </div>
                           </div>
                        </div>

                     </div>
                  </div>
                  </div>
               </div>

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
    </div>
  );
}
