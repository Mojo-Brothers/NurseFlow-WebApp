import React, { useState } from 'react';
import { 
  Zap, Clock, ShieldAlert, ClipboardList, PenTool, 
  Activity, Heart, Thermometer, Wind, User, 
  Search, ShieldCheck, CheckCircle2, ChevronRight,
  Stethoscope, FileText, Microscope, ClipboardCheck,
  AlertTriangle, Workflow, Save, Plus, BadgeInfo, LogOut, Pill
} from 'lucide-react';

export default function UgdAssessmentForm({ formData, setFormData, patient, encounter, currentUser }) {
  const [activeTab, setActiveTab] = useState('MEDIS'); // MEDIS, PERAWAT, TINDAKAN, RJP

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
    { level: 1, label: 'RESUSITASI', color: 'bg-red-600', text: 'text-white', description: 'Immediate life-saving' },
    { level: 2, label: 'EMERGENCY', color: 'bg-orange-500', text: 'text-white', description: 'High risk, confused, pain' },
    { level: 3, label: 'URGENT', color: 'bg-yellow-400', text: 'text-black', description: 'Stable, multiple resources' },
    { level: 4, label: 'LESS URGENT', color: 'bg-emerald-500', text: 'text-white', description: 'Stable, one resource' },
    { level: 5, label: 'NON URGENT', color: 'bg-blue-400', text: 'text-white', description: 'Stable, no resources' }
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ─── TRIAGE COMMAND BAR (ESI) ─── */}
      <div className="bg-white/40 dark:bg-black/10 p-12 rounded-[4rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-700 shadow-sm">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Zap size={200} className="rotate-12" />
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20">
                ER Priority Protocol
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <h3 className="text-3xl font-black text-[var(--on-surface)] uppercase tracking-tighter leading-none">Emergency Severity Index (ESI)</h3>
            <p className="text-sm font-bold opacity-40 mt-3">Tentukan level kegawatdaruratan pasien segera setelah triage.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full lg:w-auto">
            {ESI_LEVELS.map((esi) => (
              <button
                key={esi.level}
                type="button"
                onClick={() => updateField(null, 'esi', esi.level)}
                className={`
                  flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 group relative
                  ${formData.esi === esi.level 
                    ? `${esi.color} ${esi.text} shadow-2xl scale-110 ring-8 ring-offset-4 ring-[var(--surface-container-lowest)]` 
                    : 'bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 hover:border-[var(--primary)]'}
                `}
              >
                <span className="text-3xl font-black mb-1">{esi.level}</span>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{esi.label}</span>
                {formData.esi === esi.level && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-56 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-[var(--on-surface)] uppercase tracking-widest bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg border border-gray-100 dark:border-white/10">{esi.description}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HANDLING METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-50/50 dark:bg-black/20 p-8 rounded-[3rem] border-2 border-gray-100 dark:border-white/5 group">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] opacity-40 block mb-4 flex items-center gap-3">
            <Clock size={16} className="text-[var(--primary)]" /> Waktu Penanganan (ER Entry)
          </label>
          <input 
            type="datetime-local" 
            defaultValue={new Date().toISOString().slice(0, 16)}
            className="w-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl p-5 text-base font-black focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none"
            value={formData.handlingTime}
            onChange={(e) => updateField(null, 'handlingTime', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 bg-gradient-to-br from-[var(--primary)] to-blue-800 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-[var(--primary)]/20 gap-10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white ring-2 ring-white/20 shadow-inner group-hover:rotate-6 transition-transform duration-700">
               <Stethoscope size={48} />
            </div>
            <div className="space-y-1">
               <h4 className="text-2xl font-black uppercase tracking-tighter m-0 leading-none">Pemeriksaan Fisik</h4>
               <p className="text-[10px] font-bold opacity-60 m-0 uppercase tracking-widest text-white/80">Objective Assessment • JCI COP.3.1</p>
            </div>
          </div>
          <div className="flex gap-3 bg-black/10 p-2 rounded-[2rem] backdrop-blur-md">
            {['PERAWAT', 'DOKTER', 'TINDAKAN'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[var(--primary)] shadow-xl scale-105' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SUBJECTIVE ANALYSIS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/40"></div> Anamnesis / Keluhan Utama *
            </label>
            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">Mandatory Field</span>
          </div>
          <textarea 
            className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[3rem] p-10 text-lg font-bold focus:outline-none focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[300px] shadow-inner leading-relaxed outline-none placeholder:opacity-20"
            placeholder="Tuliskan keluhan utama dan riwayat penyakit sekarang..."
            value={formData.anamnesis}
            onChange={(e) => updateField(null, 'anamnesis', e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/40"></div> Riwayat Penyakit Dahulu & Operasi
            </label>
          </div>
          <textarea 
            className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[3rem] p-10 text-lg font-bold focus:outline-none focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[300px] shadow-inner leading-relaxed outline-none placeholder:opacity-20"
            placeholder="Riwayat medis masa lalu, operasi, asma, DM, HT, dll..."
            value={formData.pastHistory}
            onChange={(e) => updateField(null, 'pastHistory', e.target.value)}
          />
        </div>
      </div>

      {/* ─── PHYSICAL EXAMINATION (PREMIUM BODY MAP SECTION) ─── */}
      <div className="bg-gray-50/50 dark:bg-black/20 p-12 rounded-[4rem] border-2 border-gray-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 p-12 opacity-[0.01] pointer-events-none">
           <User size={500} />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-16 relative z-10">
          <div className="lg:w-1/3">
            <h4 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
              <Activity size={32} className="text-emerald-500" /> Pemeriksaan Fisik
            </h4>
            
            <div className="bg-white dark:bg-black/40 rounded-[3rem] p-10 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative group shadow-2xl">
              {/* Body Map Placeholder Illustration */}
              <div className="w-full aspect-[3/4] relative flex items-center justify-center opacity-40 group-hover:opacity-80 transition-all duration-1000 transform group-hover:scale-105">
                 <svg viewBox="0 0 100 100" className="h-full w-auto text-[var(--primary)]">
                    <path d="M50 10c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zM35 30c-5 0-8 4-8 8v20c0 4 3 7 7 7h30c4 0 7-3 7-7V38c0-4-3-8-8-8H35zM40 70c-2 0-4 2-4 4v20c0 2 2 4 4 4s4-2 4-4V74c0-2-2-4-4-4zM60 70c-2 0-4 2-4 4v20c0 2 2 4 4 4s4-2 4-4V74c0-2-2-4-4-4z" fill="currentColor" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-red-500 rounded-full animate-ping opacity-50"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full absolute"></div>
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-variant)] mt-8 opacity-40">Status Lokalis • Interactive Map</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between px-4">
               <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] opacity-40">Keterangan Temuan Klinis (Head to Toe)</label>
               <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">High Accuracy Record</span>
            </div>
            <textarea 
              className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[3.5rem] p-12 text-lg font-bold focus:outline-none focus:ring-16 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[500px] shadow-2xl leading-relaxed placeholder:opacity-20 outline-none"
              placeholder="Tuliskan temuan fisik detail (Head to Toe)..."
              value={formData.physicalExam}
              onChange={(e) => updateField(null, 'physicalExam', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── SUPPORTING EXAMS (ORDERS) ─── */}
      <div className="bg-gray-50/50 dark:bg-black/20 p-12 rounded-[4rem] border-2 border-gray-100 dark:border-white/5">
        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-10 flex items-center gap-4">
          <Microscope size={24} /> Pemeriksaan Penunjang (Supporting Exams)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'ekg', label: 'EKG / ECG', icon: <Heart size={20} /> },
            { id: 'ctscan', label: 'CT Scan', icon: <Activity size={20} /> },
            { id: 'thorax', label: 'Thorax X-Ray', icon: <Activity size={20} /> },
            { id: 'lab', label: 'Laboratorium', icon: <Microscope size={20} /> },
            { id: 'others', label: 'Lain-lain', icon: <Plus size={20} /> }
          ].map(exam => (
            <div key={exam.id} className="bg-white dark:bg-black/40 p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 group hover:border-[var(--primary)] transition-all flex flex-col gap-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500 shadow-inner">
                    {exam.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{exam.label}</span>
                </div>
                <input 
                   type="checkbox" 
                   className="w-6 h-6 rounded-xl border-2 border-gray-200 checked:bg-[var(--primary)] transition-all cursor-pointer" 
                   checked={formData.supportingExams?.[exam.id]}
                   onChange={(e) => updateField('supportingExams', exam.id, e.target.checked)}
                />
              </div>
              <input 
                type="text" 
                placeholder={`Keterangan ${exam.label}...`}
                className="bg-transparent border-b-2 border-gray-100 dark:border-white/10 py-3 text-sm font-bold focus:outline-none focus:border-[var(--primary)] outline-none transition-colors"
                value={formData.supportingExamNotes?.[exam.id] || ''}
                onChange={(e) => updateField('supportingExamNotes', exam.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── ASSESSMENT & PLANNING GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-8">
            <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6 flex items-center gap-3">
                  <BadgeInfo size={20} /> Diagnosis / Kerja
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-8 text-base font-bold min-h-[200px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed"
                  placeholder="Diagnosis kerja / banding..."
                  value={formData.diagnosis}
                  onChange={(e) => updateField(null, 'diagnosis', e.target.value)}
               />
            </div>
            <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6 flex items-center gap-3">
                  <Workflow size={20} /> Rencana Selanjutnya
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-8 text-base font-bold min-h-[200px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed"
                  placeholder="Rencana tindakan operatif, observasi, dll..."
                  value={formData.nextSteps}
                  onChange={(e) => updateField(null, 'nextSteps', e.target.value)}
               />
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6 flex items-center gap-3">
                  <ClipboardCheck size={20} /> Perencanaan Pelayanan
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-8 text-base font-bold min-h-[200px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed"
                  placeholder="Instruksi awal, obat gawat darurat, dll..."
                  value={formData.carePlan}
                  onChange={(e) => updateField(null, 'carePlan', e.target.value)}
               />
            </div>
            <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6 flex items-center gap-3">
                  <LogOut size={20} /> Perencanaan Pulang / Kontrol
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-8 text-base font-bold min-h-[200px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed"
                  placeholder="Kontrol poliklinik, rujukan, dll..."
                  value={formData.dischargePlan}
                  onChange={(e) => updateField(null, 'dischargePlan', e.target.value)}
               />
            </div>
         </div>
      </div>

      {/* ─── THERAPY / E-PRESCRIPTION PREVIEW ─── */}
      <div className="bg-emerald-500/5 border-2 border-emerald-500/10 p-10 rounded-[4rem] flex flex-col lg:flex-row justify-between items-center gap-10 group hover:bg-emerald-500/10 transition-all duration-700 shadow-xl shadow-emerald-500/5">
        <div className="flex items-center gap-8 text-emerald-600">
           <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <Pill size={40} />
           </div>
           <div>
              <h4 className="text-2xl font-black uppercase tracking-tighter m-0">Terapi & Resep Online</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Terintegrasi dengan Farmasi • Digital Sign Ready</p>
           </div>
        </div>
        <button type="button" className="bg-emerald-500 text-white px-12 py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
           <Plus size={20} /> Tambah Order Resep
        </button>
      </div>

    </div>
  );
}
