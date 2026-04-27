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
      <div className="bg-[var(--surface-container-low)] p-8 rounded-[3rem] border border-[var(--outline-variant)] shadow-2xl shadow-[var(--primary)]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <Zap size={180} className="rotate-12" />
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                ER Priority Protocol
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-black text-[var(--on-surface)] uppercase tracking-tighter leading-none">Emergency Severity Index (ESI)</h3>
            <p className="text-xs font-bold opacity-50 mt-2">Tentukan level kegawatdaruratan pasien segera setelah triage.</p>
          </div>

          <div className="grid grid-cols-5 gap-3 w-full lg:w-auto">
            {ESI_LEVELS.map((esi) => (
              <button
                key={esi.level}
                type="button"
                onClick={() => updateField(null, 'esi', esi.level)}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-500 group relative
                  ${formData.esi === esi.level 
                    ? `${esi.color} ${esi.text} shadow-2xl scale-110 ring-4 ring-offset-4 ring-[var(--surface-container-lowest)]` 
                    : 'bg-white dark:bg-black/20 border border-[var(--outline-variant)] hover:border-[var(--primary)]'}
                `}
              >
                <span className="text-2xl font-black mb-1">{esi.level}</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{esi.label}</span>
                {formData.esi === esi.level && (
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-[var(--on-surface)] uppercase tracking-widest">{esi.description}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HANDLING METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--surface-container-low)] p-6 rounded-[2.5rem] border border-[var(--outline-variant)] group">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] opacity-50 block mb-4 flex items-center gap-2">
            <Clock size={14} className="text-[var(--primary)]" /> Waktu Penanganan (ER Entry)
          </label>
          <input 
            type="datetime-local" 
            defaultValue={new Date().toISOString().slice(0, 16)}
            className="w-full bg-white/50 dark:bg-black/20 border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-[var(--primary)]/5 transition-all outline-none"
            value={formData.handlingTime}
            onChange={(e) => updateField(null, 'handlingTime', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 bg-gradient-to-r from-[var(--primary)] to-blue-700 p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-[var(--primary)]/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30">
               <Stethoscope size={32} />
            </div>
            <div>
               <h4 className="text-lg font-black uppercase tracking-tighter m-0">Pengkajian Medis UGD</h4>
               <p className="text-xs font-bold opacity-70 m-0">Standar Internasional JCI COP.3.1 (Pelayanan Gawat Darurat)</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['PERAWAT', 'DOKTER', 'TINDAKAN'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[var(--primary)] shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SUBJECTIVE ANALYSIS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div> Anamnesis / Keluhan Utama *
            </label>
            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Wajib Diisi</span>
          </div>
          <textarea 
            className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-[2.5rem] p-8 text-base font-bold focus:outline-none focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[220px] shadow-inner leading-relaxed outline-none"
            placeholder="Tuliskan keluhan utama dan riwayat penyakit sekarang..."
            value={formData.anamnesis}
            onChange={(e) => updateField(null, 'anamnesis', e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div> Riwayat Penyakit Dahulu & Operasi
            </label>
          </div>
          <textarea 
            className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-[2.5rem] p-8 text-base font-bold focus:outline-none focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[220px] shadow-inner leading-relaxed outline-none"
            placeholder="Riwayat medis masa lalu, operasi, asma, DM, HT, dll..."
            value={formData.pastHistory}
            onChange={(e) => updateField(null, 'pastHistory', e.target.value)}
          />
        </div>
      </div>

      {/* ─── PHYSICAL EXAMINATION (PREMIUM BODY MAP SECTION) ─── */}
      <div className="bg-[var(--surface-container-low)] p-8 lg:p-12 rounded-[4rem] border border-[var(--outline-variant)] relative overflow-hidden shadow-sm">
        <div className="absolute bottom-0 right-0 p-12 opacity-[0.02] pointer-events-none">
           <User size={400} />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          <div className="lg:w-1/3">
            <h4 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Activity size={24} className="text-emerald-500" /> Pemeriksaan Fisik
            </h4>
            
            <div className="bg-white/40 dark:bg-black/10 rounded-[3rem] p-8 border border-white/20 flex flex-col items-center justify-center relative group">
              {/* Body Map Placeholder Illustration */}
              <div className="w-full aspect-[3/4] relative flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity duration-1000">
                 <svg viewBox="0 0 100 100" className="h-full w-auto">
                    <path d="M50 10c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zM35 30c-5 0-8 4-8 8v20c0 4 3 7 7 7h30c4 0 7-3 7-7V38c0-4-3-8-8-8H35zM40 70c-2 0-4 2-4 4v20c0 2 2 4 4 4s4-2 4-4V74c0-2-2-4-4-4zM60 70c-2 0-4 2-4 4v20c0 2 2 4 4 4s4-2 4-4V74c0-2-2-4-4-4z" fill="currentColor" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] mt-6 opacity-40">Status Lokalis • Interactive Body Map</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] opacity-50">Keterangan Temuan Klinis</label>
               <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest">High Accuracy Record</span>
            </div>
            <textarea 
              className="w-full bg-white dark:bg-black/20 border border-[var(--outline-variant)] rounded-[3rem] p-10 text-base font-bold focus:outline-none focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[400px] shadow-2xl leading-relaxed placeholder:opacity-20 outline-none"
              placeholder="Tuliskan temuan fisik detail (Head to Toe)..."
              value={formData.physicalExam}
              onChange={(e) => updateField(null, 'physicalExam', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── SUPPORTING EXAMS (ORDERS) ─── */}
      <div className="bg-[var(--surface-container-low)] p-8 lg:p-10 rounded-[3rem] border border-[var(--outline-variant)]">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-8 flex items-center gap-3">
          <Microscope size={18} /> Pemeriksaan Penunjang (Supporting Exams)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'ekg', label: 'EKG / ECG', icon: <Heart size={16} /> },
            { id: 'ctscan', label: 'CT Scan', icon: <Activity size={16} /> },
            { id: 'thorax', label: 'Thorax X-Ray', icon: <Activity size={16} /> },
            { id: 'lab', label: 'Laboratorium', icon: <Microscope size={16} /> },
            { id: 'others', label: 'Lain-lain', icon: <Plus size={16} /> }
          ].map(exam => (
            <div key={exam.id} className="bg-white dark:bg-black/20 p-6 rounded-[2.5rem] border border-[var(--outline-variant)] group hover:border-[var(--primary)] transition-all flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    {exam.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{exam.label}</span>
                </div>
                <input 
                   type="checkbox" 
                   className="w-5 h-5 rounded-lg border-2 border-[var(--outline-variant)] checked:bg-[var(--primary)] transition-all cursor-pointer" 
                   checked={formData.supportingExams?.[exam.id]}
                   onChange={(e) => updateField('supportingExams', exam.id, e.target.checked)}
                />
              </div>
              <input 
                type="text" 
                placeholder={`Keterangan ${exam.label}...`}
                className="bg-transparent border-b border-[var(--outline-variant)] py-2 text-xs font-bold focus:outline-none focus:border-[var(--primary)] outline-none"
                value={formData.supportingExamNotes?.[exam.id] || ''}
                onChange={(e) => updateField('supportingExamNotes', exam.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── ASSESSMENT & PLANNING GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="bg-[var(--surface-container-low)] p-8 rounded-[3rem] border border-[var(--outline-variant)] shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                  <BadgeInfo size={16} /> Diagnosis / Kerja
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/10 border border-[var(--outline-variant)] rounded-2xl p-6 text-sm font-bold min-h-[150px] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all outline-none"
                  placeholder="Diagnosis kerja / banding..."
                  value={formData.diagnosis}
                  onChange={(e) => updateField(null, 'diagnosis', e.target.value)}
               />
            </div>
            <div className="bg-[var(--surface-container-low)] p-8 rounded-[3rem] border border-[var(--outline-variant)] shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                  <Workflow size={16} /> Rencana Selanjutnya
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/10 border border-[var(--outline-variant)] rounded-2xl p-6 text-sm font-bold min-h-[150px] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all outline-none"
                  placeholder="Rencana tindakan operatif, observasi, dll..."
                  value={formData.nextSteps}
                  onChange={(e) => updateField(null, 'nextSteps', e.target.value)}
               />
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-[var(--surface-container-low)] p-8 rounded-[3rem] border border-[var(--outline-variant)] shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                  <ClipboardCheck size={16} /> Perencanaan Pelayanan
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/10 border border-[var(--outline-variant)] rounded-2xl p-6 text-sm font-bold min-h-[150px] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all outline-none"
                  placeholder="Instruksi awal, obat gawat darurat, dll..."
                  value={formData.carePlan}
                  onChange={(e) => updateField(null, 'carePlan', e.target.value)}
               />
            </div>
            <div className="bg-[var(--surface-container-low)] p-8 rounded-[3rem] border border-[var(--outline-variant)] shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                  <LogOut size={16} /> Perencanaan Pulang / Kontrol
               </h4>
               <textarea 
                  className="w-full bg-white dark:bg-black/10 border border-[var(--outline-variant)] rounded-2xl p-6 text-sm font-bold min-h-[150px] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all outline-none"
                  placeholder="Kontrol poliklinik, rujukan, dll..."
                  value={formData.dischargePlan}
                  onChange={(e) => updateField(null, 'dischargePlan', e.target.value)}
               />
            </div>
         </div>
      </div>

      {/* ─── THERAPY / E-PRESCRIPTION PREVIEW ─── */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-emerald-500/10 transition-all duration-500">
        <div className="flex items-center gap-6 text-emerald-600">
           <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Pill size={28} />
           </div>
           <div>
              <h4 className="text-lg font-black uppercase tracking-tight m-0">Terapi & Resep Online</h4>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Terintegrasi dengan Farmasi • Digital Sign Ready</p>
           </div>
        </div>
        <button type="button" className="bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
           <Plus size={16} /> Tambah Order Resep
        </button>
      </div>

    </div>
  );
}
