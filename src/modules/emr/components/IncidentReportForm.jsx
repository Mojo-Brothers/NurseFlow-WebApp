import React, { useState } from 'react';
import { ShieldAlert, Clock, User, FileText, AlertTriangle, ChevronRight, HelpCircle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

const INCIDENT_TYPES = [
  { id: 'KNC', name: 'Near Miss (KNC)', color: 'blue', desc: 'Potential harm prevented.' },
  { id: 'KTC', name: 'No Harm (KTC)', color: 'amber', desc: 'Incident with no injury.' },
  { id: 'KTD', name: 'Adverse Event (KTD)', color: 'red', desc: 'Injury or complication.' },
  { id: 'KPC', name: 'Potential (KPC)', color: 'emerald', desc: 'Circumstance of risk.' },
];

export default function IncidentReportForm({ formData, setFormData }) {
  const [selectedType, setSelectedType] = useState(formData.incidentType || '');

  const updateForm = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* ─── INCIDENT CLASSIFICATION ─── */}
      <div className="grid grid-cols-4 gap-6">
        {INCIDENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => {
              setSelectedType(type.id);
              updateForm('incidentType', type.id);
            }}
            className={`
              relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden group
              ${selectedType === type.id 
                ? `bg-white border-blue-600 shadow-2xl scale-[1.02] z-10` 
                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 grayscale opacity-40'}
            `}
          >
            <div className={`
               w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all shadow-sm
               ${selectedType === type.id ? `bg-blue-600 text-white` : 'bg-slate-200 text-slate-400'}
            `}>
               <ShieldAlert size={24} />
            </div>
            <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${selectedType === type.id ? 'text-blue-600' : 'text-slate-400'}`}>{type.id}</h4>
            <p className="text-[10px] font-bold text-slate-500 leading-tight mb-4 uppercase tracking-tighter">{type.name}</p>
            <p className="text-[9px] font-medium text-slate-400 leading-relaxed italic">{type.desc}</p>
            
            {selectedType === type.id && (
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/40"></div>
            )}
          </button>
        ))}
      </div>

      {/* ─── INCIDENT DOCUMENTATION ─── */}
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-4 flex flex-col gap-10">
           <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pb-6">
                 <CardTitle className="flex items-center gap-4">
                    <Clock size={16} className="text-blue-600" /> Event Context
                 </CardTitle>
              </CardHeader>
              <CardContent className="px-0 flex flex-col gap-8">
                 <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Incident Timestamp</Label>
                    <Input 
                       type="datetime-local"
                       className="h-14 border-slate-200 bg-white text-sm"
                       value={formData.incidentTime || ''}
                       onChange={(e) => updateForm('incidentTime', e.target.value)}
                    />
                 </div>

                 <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Responsible Unit</Label>
                    <Select 
                       value={formData.unit || ''}
                       onValueChange={(val) => updateForm('unit', val)}
                    >
                       <SelectTrigger className="h-14 border-slate-200 bg-white">
                          <SelectValue placeholder="Select unit..." />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="IGD">Emergency Unit (IGD)</SelectItem>
                          <SelectItem value="RJ">Outpatient Clinic</SelectItem>
                          <SelectItem value="RI">Inpatient Ward</SelectItem>
                          <SelectItem value="OK">Operation Theater</SelectItem>
                          <SelectItem value="LAB">Laboratory</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="col-span-8 flex flex-col gap-10">
           <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pb-6">
                 <CardTitle className="flex items-center gap-4">
                    <FileText size={16} className="text-blue-600" /> Narrative Chronology
                 </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                 <Textarea 
                    className="min-h-[280px] text-sm font-bold bg-white border-slate-200 focus-visible:border-blue-400"
                    placeholder="Describe exactly what happened, clinical state, immediate actions taken..."
                    value={formData.chronology || ''}
                    onChange={(e) => updateForm('chronology', e.target.value)}
                 />
              </CardContent>
           </Card>
        </div>
      </div>

      {/* ─── JCI COMPLIANCE (QPS.7) ─── */}
      <Card className="bg-amber-50/50 border-2 border-amber-100 rounded-[3.5rem] p-4">
         <CardContent className="p-8 flex items-center gap-10">
            <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-amber-500 shrink-0 shadow-xl shadow-amber-500/10">
               <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Standard QPS.7 Compliance</h4>
               <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl italic">
                  This report is **Non-Punitive**. Data collected is used solely for system improvement and root-cause analysis (RCA) to prevent recurrence, as mandated by Joint Commission International.
               </p>
            </div>
            <div className="ml-auto flex items-center gap-4">
               <div className="px-6 py-3 rounded-2xl bg-white border border-amber-100 text-[10px] font-black uppercase tracking-widest text-amber-600 shadow-sm flex items-center gap-3">
                  <ShieldCheck size={16} /> Audit Ready
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
