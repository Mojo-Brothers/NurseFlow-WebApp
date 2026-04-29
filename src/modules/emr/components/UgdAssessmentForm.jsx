import React, { useState } from 'react';
import { 
  Zap, Clock, ShieldAlert, Activity, Heart, Thermometer, Wind, User, 
  ShieldCheck, CheckCircle2, ChevronRight, Stethoscope, FileText, 
  Microscope, ClipboardCheck, AlertTriangle, Workflow, Save, Plus, 
  BadgeInfo, LogOut, Pill, AlertCircle, Droplets, Info, Eye, Brain, X
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';

// MASTER SPACING TOKENS (8pt System)
const SPACING = {
  MICRO: 'gap-2',    // 8px
  INPUT: 'gap-4',    // 16px
  INNER: 'gap-6',    // 24px
  SECTION: 'gap-12', // Increased for premium feel
  OUTER: 'space-y-12' 
};

export default function UgdAssessmentForm({ formData, setFormData, patient, encounter, currentUser }) {
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
    { level: 1, label: 'Resusitasi', color: 'bg-red-600', text: 'text-white' },
    { level: 2, label: 'Emergent', color: 'bg-orange-500', text: 'text-white' },
    { level: 3, label: 'Urgent', color: 'bg-yellow-400', text: 'text-black' },
    { level: 4, label: 'Less Urgent', color: 'bg-emerald-500', text: 'text-white' },
    { level: 5, label: 'Non-Urgent', color: 'bg-blue-500', text: 'text-white' }
  ];

  const calculateNEWS2 = () => 0; 
  const newsScore = calculateNEWS2();

  return (
    <div className={`${SPACING.OUTER} pb-16`}>
      
      {/* ─── TRIAGE COMMAND CENTER ─── */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-8">
          <CardTitle className="flex items-center gap-4">
            <Zap size={16} className="text-blue-600" /> Triage Assessment & Arrival
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 flex flex-col gap-10">
          <div className="grid grid-cols-12 gap-10 items-start">
            {/* ESI Selector */}
            <div className="col-span-8 grid grid-cols-5 gap-3">
               {ESI_LEVELS.map((esi) => (
                 <button
                   key={esi.level}
                   type="button"
                   onClick={() => updateField(null, 'esi', esi.level)}
                   className={`
                     flex flex-col items-center justify-center py-8 px-2 rounded-3xl border-2 transition-all duration-500
                     ${formData.esi === esi.level 
                       ? `${esi.color} ${esi.text} border-transparent shadow-2xl shadow-${esi.color.split('-')[1]}-600/40 scale-[1.05] z-10` 
                       : 'bg-white border-slate-100 hover:border-blue-200 grayscale-[0.8] opacity-50 hover:opacity-100 hover:grayscale-0'}
                   `}
                 >
                   <span className="text-3xl font-black mb-1 tabular-nums tracking-tighter">{esi.level}</span>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">{esi.label}</span>
                 </button>
               ))}
            </div>

            {/* Arrival Stats */}
            <div className="col-span-4 grid grid-cols-1 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col gap-3">
                 <Label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Arrival Mode</Label>
                 <Select 
                    value={formData.arrivalMode || 'AMBULANCE'}
                    onValueChange={(val) => updateField(null, 'arrivalMode', val)}
                 >
                    <SelectTrigger className="bg-white border-slate-200 h-14 rounded-2xl">
                       <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="AMBULANCE">🚑 Ambulance</SelectItem>
                       <SelectItem value="WALK-IN">🚶 Walk-In</SelectItem>
                       <SelectItem value="REFERRAL">📄 Referral</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col gap-3">
                 <Label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Arrival Time</Label>
                 <Input 
                    type="time" 
                    className="bg-white border-slate-200 h-14 rounded-2xl text-base"
                    value={formData.arrivalTime || new Date().toTimeString().slice(0,5)}
                    onChange={(e) => updateField(null, 'arrivalTime', e.target.value)}
                 />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── VITAL SIGNS & EWS ─── */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <Activity size={16} className="text-blue-600" /> Vital Signs & Early Warning System
          </CardTitle>
          <div className="px-6 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm">
             <ShieldCheck size={14} /> NEWS2 Score: {newsScore}
          </div>
        </CardHeader>
        <CardContent className="px-0 flex flex-col gap-8">
          <div className="grid grid-cols-6 gap-4">
             {[
                { label: 'Systolic', icon: <Heart size={12} />, field: 'bp_sys', unit: 'mmHg' },
                { label: 'Diastolic', icon: <Heart size={12} />, field: 'bp_dia', unit: 'mmHg' },
                { label: 'HR', icon: <Activity size={12} />, field: 'hr', unit: 'bpm' },
                { label: 'RR', icon: <Wind size={12} />, field: 'rr', unit: '/min' },
                { label: 'Temp', icon: <Thermometer size={12} />, field: 'temp', unit: '°C' },
                { label: 'SpO2', icon: <Droplets size={12} />, field: 'spo2', unit: '%' }
             ].map((vs) => (
               <div key={vs.field} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-blue-400 transition-all group">
                  <div className="flex items-center gap-2 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                     {vs.icon}
                     <span className="text-[8px] font-black uppercase tracking-[0.2em]">{vs.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <Input 
                        className="h-auto p-0 border-none bg-transparent text-3xl font-black tabular-nums focus-visible:ring-0" 
                        placeholder="--"
                        value={formData.vitals?.[vs.field] || ''}
                        onChange={(e) => updateField('vitals', vs.field, e.target.value)}
                     />
                     <span className="text-[9px] font-bold text-slate-300 uppercase">{vs.unit}</span>
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/10">
                      <Brain size={24} />
                   </div>
                   <div>
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pain Scale (VAS)</Label>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Intensity: {formData.painScale || 0} / 10</p>
                   </div>
                </div>
                <input 
                   type="range" min="0" max="10" 
                   className="w-64 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" 
                   value={formData.painScale || 0}
                   onChange={(e) => updateField(null, 'painScale', e.target.value)}
                />
             </div>
             <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/10">
                   <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                   <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Oxygen Support</Label>
                   <Select 
                      value={formData.oxygenSupport || 'NONE'}
                      onValueChange={(val) => updateField(null, 'oxygenSupport', val)}
                   >
                      <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl">
                         <SelectValue placeholder="Select support" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="NONE">Room Air</SelectItem>
                         <SelectItem value="NASAL">Nasal Cannula</SelectItem>
                         <SelectItem value="MASK">Simple Mask</SelectItem>
                         <SelectItem value="NRM">Non-Rebreathing Mask</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>

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
