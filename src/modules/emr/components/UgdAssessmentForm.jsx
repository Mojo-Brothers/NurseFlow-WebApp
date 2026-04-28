import React, { useState } from 'react';
import { 
  Zap, Clock, ShieldAlert, Activity, Heart, Thermometer, Wind, User, 
  ShieldCheck, CheckCircle2, ChevronRight, Stethoscope, FileText, 
  Microscope, ClipboardCheck, AlertTriangle, Workflow, Save, Plus, 
  BadgeInfo, LogOut, Pill, AlertCircle, Droplets, Info, Eye, Brain, X
} from 'lucide-react';

// MASTER SPACING TOKENS (8pt System)
const SPACING = {
  MICRO: 'gap-2',    // 8px
  INPUT: 'gap-4',    // 16px
  INNER: 'gap-6',    // 24px
  SECTION: 'gap-8',  // 32px
  OUTER: 'space-y-8' // 32px
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
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Zap size={14} className="text-blue-600" /> Triage Assessment & Arrival
           </h3>
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">JCI-SAFE</span>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-stretch">
           {/* ESI Selector */}
           <div className="col-span-8 grid grid-cols-5 gap-2">
              {ESI_LEVELS.map((esi) => (
                <button
                  key={esi.level}
                  type="button"
                  onClick={() => updateField(null, 'esi', esi.level)}
                  className={`
                    flex flex-col items-center justify-center py-6 px-2 rounded-xl border-2 transition-all duration-300
                    ${formData.esi === esi.level 
                      ? `${esi.color} ${esi.text} border-transparent shadow-lg scale-[1.02] z-10` 
                      : 'bg-white border-slate-100 hover:border-blue-200 grayscale opacity-40'}
                  `}
                >
                  <span className="text-2xl font-black mb-1">{esi.level}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">{esi.label}</span>
                </button>
              ))}
           </div>

           {/* Arrival Stats */}
           <div className="col-span-4 flex flex-col gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                 <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Arrival Mode</label>
                 <select 
                    className="w-full bg-transparent text-[11px] font-black uppercase outline-none"
                    value={formData.arrivalMode || 'AMBULANCE'}
                    onChange={(e) => updateField(null, 'arrivalMode', e.target.value)}
                 >
                    <option value="AMBULANCE">🚑 Ambulance</option>
                    <option value="WALK-IN">🚶 Walk-In</option>
                    <option value="REFERRAL">📄 Referral</option>
                 </select>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                 <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Arrival Time</label>
                 <input 
                    type="time" 
                    className="w-full bg-transparent text-[11px] font-black outline-none"
                    value={formData.arrivalTime || new Date().toTimeString().slice(0,5)}
                    onChange={(e) => updateField(null, 'arrivalTime', e.target.value)}
                 />
              </div>
           </div>
        </div>
      </section>

      {/* ─── VITAL SIGNS & EWS ─── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Activity size={14} className="text-blue-600" /> Vital Signs & Early Warning System
           </h3>
           <div className={`px-4 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
              <ShieldCheck size={12} /> NEWS2 Score: {newsScore}
           </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
           {[
              { label: 'Systolic', icon: <Heart size={12} />, field: 'bp_sys', unit: 'mmHg' },
              { label: 'Diastolic', icon: <Heart size={12} />, field: 'bp_dia', unit: 'mmHg' },
              { label: 'HR', icon: <Activity size={12} />, field: 'hr', unit: 'bpm' },
              { label: 'RR', icon: <Wind size={12} />, field: 'rr', unit: '/min' },
              { label: 'Temp', icon: <Thermometer size={12} />, field: 'temp', unit: '°C' },
              { label: 'SpO2', icon: <Droplets size={12} />, field: 'spo2', unit: '%' }
           ].map((vs) => (
             <div key={vs.field} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-300 transition-all">
                <div className="flex items-center gap-2 mb-3 opacity-30">
                   {vs.icon}
                   <span className="text-[7px] font-black uppercase tracking-[0.2em]">{vs.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <input 
                      type="text" 
                      className="w-full text-xl font-black outline-none bg-transparent tabular-nums" 
                      placeholder="--"
                      value={formData.vitals?.[vs.field] || ''}
                      onChange={(e) => updateField('vitals', vs.field, e.target.value)}
                   />
                   <span className="text-[8px] font-bold text-slate-300 uppercase">{vs.unit}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Brain size={20} />
                 </div>
                 <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Pain Scale (VAS)</p>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Score: {formData.painScale || 0} / 10</p>
                 </div>
              </div>
              <input 
                 type="range" min="0" max="10" 
                 className="w-48 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                 value={formData.painScale || 0}
                 onChange={(e) => updateField(null, 'painScale', e.target.value)}
              />
           </div>
           <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                 <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Oxygen Support</p>
                 <select 
                    className="w-full bg-transparent text-[10px] font-black uppercase outline-none mt-1"
                    value={formData.oxygenSupport || 'NONE'}
                    onChange={(e) => updateField(null, 'oxygenSupport', e.target.value)}
                 >
                    <option value="NONE">Room Air</option>
                    <option value="NASAL">Nasal Cannula</option>
                    <option value="MASK">Simple Mask</option>
                    <option value="NRM">Non-Rebreathing Mask</option>
                 </select>
              </div>
           </div>
        </div>
      </section>

      {/* ─── PRIMARY SURVEY (ABCDE) ─── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Stethoscope size={14} className="text-blue-600" /> Primary Survey (ABCDE)
           </h3>
           <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Critical Assessment Stage</span>
        </div>

        <div className="grid grid-cols-5 gap-4">
           {[
              { id: 'A', label: 'Airway', options: ['Clear', 'Partial Obstr.', 'Total Obstr.'] },
              { id: 'B', label: 'Breathing', options: ['Normal', 'Tachypnea', 'Bradypnea', 'Apnea'] },
              { id: 'C', label: 'Circulation', options: ['Stable', 'Hemorrhage', 'Shock'] },
              { id: 'D', label: 'Disability', options: ['Alert', 'Voice', 'Pain', 'Unresp.'] },
              { id: 'E', label: 'Exposure', options: ['Normal', 'Deformity', 'Trauma'] }
           ].map((step) => (
             <div key={step.id} className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-white">
                <div className="bg-slate-900 text-white text-[9px] font-black p-3 text-center uppercase tracking-widest">
                   {step.id} - {step.label}
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1 justify-center">
                   {step.options.map(opt => (
                     <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                           type="radio" name={`abcde_${step.id}`} 
                           className="w-3 h-3 accent-blue-600" 
                           checked={formData.primarySurvey?.[step.id] === opt}
                           onChange={() => updateField('primarySurvey', step.id, opt)}
                        />
                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors uppercase tabular-nums">{opt}</span>
                     </label>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* ─── SUBJECTIVE & SECONDARY SURVEY ─── */}
      <section className="grid grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Text Entries */}
        <div className="col-span-7 flex flex-col gap-8">
           <div className="flex flex-col gap-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                 <Info size={14} className="text-blue-600" /> Chief Complaint & History
              </label>
              <textarea 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-[11px] font-bold min-h-[160px] focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                 placeholder="S: Patient complaints..."
                 value={formData.subjective || ''}
                 onChange={(e) => updateField(null, 'subjective', e.target.value)}
              />
           </div>
           
           <div className="flex flex-col gap-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                 <Eye size={14} className="text-blue-600" /> Physical Exam (Head-to-Toe)
              </label>
              <textarea 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-[11px] font-bold min-h-[240px] focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                 placeholder="O: Objective findings..."
                 value={formData.objective || ''}
                 onChange={(e) => updateField(null, 'objective', e.target.value)}
              />
           </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="col-span-5 flex flex-col gap-8">
           {/* GCS & Neuro */}
           <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col gap-6 h-1/2">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-3">
                 <Brain size={14} /> Neurological Hub (GCS)
              </h4>
              <div className="grid grid-cols-3 gap-4 flex-1">
                 {[
                    { l: 'Eye', m: 4, f: 'gcs_e' },
                    { l: 'Motor', m: 6, f: 'gcs_m' },
                    { l: 'Verbal', m: 5, f: 'gcs_v' }
                 ].map(x => (
                   <div key={x.f} className="flex flex-col items-center justify-center">
                      <p className="text-[7px] font-black text-slate-500 uppercase mb-3 tracking-widest">{x.l}</p>
                      <input 
                         type="number" max={x.m} min={1}
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-2xl font-black text-center outline-none focus:border-blue-500 transition-all"
                         value={formData.neuro?.[x.f] || ''}
                         onChange={(e) => updateField('neuro', x.f, e.target.value)}
                      />
                      <p className="text-[7px] font-bold text-slate-600 mt-2">Scale {x.m}</p>
                   </div>
                 ))}
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Combined GCS</span>
                 <span className="text-4xl font-black text-blue-400 tabular-nums">
                    {(parseInt(formData.neuro?.gcs_e)||0) + (parseInt(formData.neuro?.gcs_m)||0) + (parseInt(formData.neuro?.gcs_v)||0)}
                 </span>
              </div>
           </div>

           {/* Safety & Allergy */}
           <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col gap-8 shadow-sm h-1/2">
              <div className="flex flex-col gap-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck size={14} className="text-red-500" /> Allergy Alert
                 </label>
                 <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-bold outline-none focus:border-red-400"
                    placeholder="Document allergies..."
                    value={formData.allergies || ''}
                    onChange={(e) => updateField(null, 'allergies', e.target.value)}
                 />
              </div>
              <div className="flex flex-col gap-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient Safety Screening</p>
                 <div className="flex flex-col gap-2">
                    {[
                       { l: 'Fall Risk', f: 'safety_fall' },
                       { l: 'Suicide Risk', f: 'safety_suicide' },
                       { l: 'Infection Control', f: 'safety_infection' }
                    ].map(s => (
                       <div key={s.f} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">{s.l}</span>
                          <button 
                             type="button"
                             onClick={() => updateField('safety', s.f, !formData.safety?.[s.f])}
                             className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${formData.safety?.[s.f] ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200 text-slate-400'}`}
                          >
                             {formData.safety?.[s.f] ? 'HIGH' : 'LOW'}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ─── DIAGNOSIS & ACTION PLAN ─── */}
      <section className="grid grid-cols-2 gap-8">
         <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[2rem] flex flex-col gap-4">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <BadgeInfo size={16} /> Clinical Diagnosis
            </label>
            <textarea 
               className="w-full bg-white border border-blue-200 rounded-2xl p-6 text-[11px] font-bold min-h-[140px] focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner"
               placeholder="Primary & Differential..."
               value={formData.diagnosis || ''}
               onChange={(e) => updateField(null, 'diagnosis', e.target.value)}
            />
         </div>
         <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem] flex flex-col gap-4">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <Workflow size={16} /> Care Strategy
            </label>
            <textarea 
               className="w-full bg-white border border-emerald-200 rounded-2xl p-6 text-[11px] font-bold min-h-[140px] focus:ring-4 focus:ring-emerald-100 outline-none transition-all shadow-inner"
               placeholder="Integrated care plan..."
               value={formData.carePlan || ''}
               onChange={(e) => updateField(null, 'carePlan', e.target.value)}
            />
         </div>
      </section>

      {/* ─── ACTION TIMELINE ─── */}
      <section className="bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] flex flex-col gap-8">
         <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <Clock size={14} className="text-blue-600" /> ER Intervention Timeline
            </h3>
            <button type="button" className="px-4 py-1.5 rounded bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform">
               <Plus size={14} /> Log Action
            </button>
         </div>

         <div className="relative pl-12 border-l-2 border-slate-200 flex flex-col gap-8 ml-4">
            {[
               { time: '14:20', action: 'Triage Assessment Completed', user: 'RN Sarah Jenkins' },
               { time: '14:25', action: 'Vital Signs & EWS Established', user: 'RN Sarah Jenkins' },
               { time: '14:35', action: 'Physician Initial Review', user: 'Dr. Marcus Holloway' }
            ].map((item, i) => (
              <div key={i} className="relative">
                 <div className="absolute -left-[57px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm ring-4 ring-slate-100"></div>
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.action}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1 italic">Operator: {item.user}</p>
                    </div>
                    <span className="text-[11px] font-black text-slate-300 tabular-nums">{item.time}</span>
                 </div>
              </div>
            ))}
         </div>
      </section>

    </div>
  );
}
