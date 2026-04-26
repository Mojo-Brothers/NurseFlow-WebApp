import React, { useState } from 'react';
import { ShieldAlert, Clock, User, FileText, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';

const INCIDENT_TYPES = [
  { id: 'KNC', name: 'Kejadian Nyaris Cedera (Near Miss)', color: 'blue' },
  { id: 'KTC', name: 'Kejadian Tidak Cedera (No Harm)', color: 'amber' },
  { id: 'KTD', name: 'Kejadian Tidak Diharapkan (Adverse Event)', color: 'red' },
  { id: 'KPC', name: 'Kejadian Potensial Cedera (Reportable Circumstance)', color: 'emerald' },
];

export default function IncidentReportForm({ formData, setFormData }) {
  const [selectedType, setSelectedType] = useState(formData.incidentType || '');

  const updateForm = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Incident Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {INCIDENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setSelectedType(type.id);
              updateForm('incidentType', type.id);
            }}
            className={`
              relative p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden group
              ${selectedType === type.id 
                ? `bg-${type.color}-500/10 border-${type.color}-500 ring-4 ring-${type.color}-500/10` 
                : 'bg-white/5 border-white/5 hover:border-white/20'}
            `}
          >
            <div className={`
               w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all
               ${selectedType === type.id ? `bg-${type.color}-500 text-white` : 'bg-white/10 text-white/40'}
            `}>
               <ShieldAlert size={20} />
            </div>
            <h4 className={`text-xs font-black uppercase tracking-tighter mb-1 ${selectedType === type.id ? 'text-white' : 'text-white/60'}`}>{type.id}</h4>
            <p className="text-[10px] font-bold text-white/40 leading-tight">{type.name}</p>
            
            {selectedType === type.id && (
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${type.color}-500 animate-pulse`}></div>
            )}
          </button>
        ))}
      </div>

      {/* Incident Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <Clock size={14} className="text-[var(--primary)]" /> Waktu Kejadian
              </label>
              <input 
                 type="datetime-local"
                 value={formData.incidentTime || ''}
                 onChange={(e) => updateForm('incidentTime', e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
           </div>

           <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <User size={14} className="text-[var(--primary)]" /> Unit Terkait
              </label>
              <select 
                 value={formData.unit || ''}
                 onChange={(e) => updateForm('unit', e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none"
              >
                 <option value="">Pilih Unit...</option>
                 <option value="IGD">Instalasi Gawat Darurat (IGD)</option>
                 <option value="RJ">Rawat Jalan</option>
                 <option value="RI">Rawat Inap</option>
                 <option value="OK">Kamar Bedah (OK)</option>
                 <option value="LAB">Laboratorium</option>
              </select>
           </div>
        </div>

        <div className="space-y-6">
           <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <FileText size={14} className="text-[var(--primary)]" /> Kronologi Singkat
              </label>
              <textarea 
                 value={formData.chronology || ''}
                 onChange={(e) => updateForm('chronology', e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 min-h-[160px]"
                 placeholder="Jelaskan apa yang terjadi, siapa yang terlibat, dan tindakan segera yang dilakukan..."
              />
           </div>
        </div>
      </div>

      {/* JCI Compliance Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-8 flex items-center gap-6">
         <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={32} />
         </div>
         <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Kepatuhan Standar QPS.7</h4>
            <p className="text-xs font-bold text-white/60 leading-relaxed">
               Laporan ini bersifat **Non-Punitive** (tidak untuk menghukum). Tujuannya adalah perbaikan sistem dan mencegah kejadian berulang sesuai standar Keselamatan Pasien JCI.
            </p>
         </div>
         <div className="ml-auto hidden lg:block">
            <div className="flex -space-x-3">
               {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#12141c] bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                     PMKP
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
