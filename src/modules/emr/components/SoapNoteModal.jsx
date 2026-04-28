import React, { useState } from 'react';
import { X, Save, ShieldAlert, Activity, Heart, Thermometer, Wind, Zap, FileText, ClipboardList, PenTool, CheckCircle2 } from 'lucide-react';
import A4Layout from './A4Layout.jsx';

export default function SoapNoteModal({ isOpen, onClose, onSave, patient, encounter, initialData = null }) {
  
  const [formData, setFormData] = useState(initialData || {
    subjective: '',
    objective: {
      vitalSigns: {
        td_systolic: '',
        td_diastolic: '',
        hr: '',
        temp: '',
        rr: '',
        spo2: ''
      },
      physicalExam: ''
    },
    assessment: '',
    plan: '',
    verification: false
  });


  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      objective: {
        ...prev.objective,
        vitalSigns: {
          ...prev.objective.vitalSigns,
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.verification) {
      alert("Harap centang verifikasi data sesuai standar JCI.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-black/40 backdrop-blur-sm">
      <div 
        className="absolute inset-0 cursor-zoom-out" 
        onClick={onClose}
      />
      
      <div className="flex-1 flex items-center justify-center p-4 relative z-10 pointer-events-none">
        <form 
          onSubmit={handleSubmit}
          className="bg-[var(--surface-container-lowest)] rounded-[3rem] w-full max-w-[1400px] h-[90vh] flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-[var(--outline-variant)] overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="px-10 py-6 border-b border-[var(--outline-variant)] bg-gradient-to-r from-[var(--surface-container)] to-[var(--surface-container-low)] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20">
                <ClipboardList size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--on-surface)] tracking-tight">SOAP NOTES (CPPT)</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">{patient?.name || encounter?.patient_name || 'PASIEN'}</span>
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)]">•</span>
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">Encounter: {encounter?.id?.slice(-8) || 'N/A'}</span>
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-high)] flex items-center justify-center transition-colors text-[var(--on-surface-variant)]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[var(--background)] custom-scrollbar">
            <A4Layout 
              title="CATATAN PERKEMBANGAN PASIEN TERINTEGRASI (CPPT)"
              patient={patient || encounter}
            >
              <div className="grid grid-cols-12 gap-8">
                
                {/* SUBJECTIVE & OBJECTIVE (Left 7 Columns) */}
                <div className="col-span-12 lg:col-span-7 space-y-10">
                  
                  {/* Subjective Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-widest text-[var(--on-surface)]">Subjective (S)</h3>
                    </div>
                    <textarea
                      required
                      className="w-full h-48 bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-6 text-base font-bold focus:ring-4 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30 leading-relaxed"
                      placeholder="Keluhan utama, riwayat penyakit sekarang, dll..."
                      value={formData.subjective}
                      onChange={(e) => handleInputChange('subjective', e.target.value)}
                    />
                  </div>

                  {/* Objective Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-widest text-[var(--on-surface)]">Objective (O)</h3>
                    </div>

                    {/* Vital Signs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[
                        { label: 'Tekanan Darah (mmHg)', icon: <Heart size={14} className="text-red-500" />, field: 'td' },
                        { label: 'Nadi (bpm)', icon: <Zap size={14} className="text-amber-500" />, field: 'hr' },
                        { label: 'Suhu (°C)', icon: <Thermometer size={14} className="text-orange-500" />, field: 'temp' },
                        { label: 'Resp (x/mnt)', icon: <Wind size={14} className="text-blue-400" />, field: 'rr' },
                        { label: 'SpO2 (%)', icon: <Activity size={14} className="text-emerald-400" />, field: 'spo2' },
                      ].map(vs => (
                        <div key={vs.field} className="bg-gray-50/50 dark:bg-black/20 p-5 rounded-3xl border border-gray-100 dark:border-white/5 group focus-within:border-[var(--primary)] transition-all">
                          <label className="flex items-center gap-2 text-[11px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-3">
                            {vs.icon} {vs.label}
                          </label>
                          {vs.field === 'td' ? (
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                placeholder="Sys"
                                className="w-full bg-transparent outline-none text-lg font-black text-[var(--on-surface)]"
                                value={formData.objective.vitalSigns.td_systolic}
                                onChange={(e) => handleVitalChange('td_systolic', e.target.value)}
                              />
                              <span className="opacity-30 text-xl font-light">/</span>
                              <input 
                                type="number" 
                                placeholder="Dia"
                                className="w-full bg-transparent outline-none text-lg font-black text-[var(--on-surface)]"
                                value={formData.objective.vitalSigns.td_diastolic}
                                onChange={(e) => handleVitalChange('td_diastolic', e.target.value)}
                              />
                            </div>
                          ) : (
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full bg-transparent outline-none text-lg font-black text-[var(--on-surface)]"
                              value={formData.objective.vitalSigns[vs.field]}
                              onChange={(e) => handleVitalChange(vs.field, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest ml-2">Pemeriksaan Fisik / Status Lokalis</label>
                      <textarea
                        className="w-full h-48 bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-6 text-base font-bold focus:ring-4 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30 leading-relaxed"
                        placeholder="Detail pemeriksaan fisik..."
                        value={formData.objective.physicalExam}
                        onChange={(e) => setFormData(prev => ({ ...prev, objective: { ...prev.objective, physicalExam: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ASSESSMENT & PLAN (Right 5 Columns) */}
                <div className="col-span-12 lg:col-span-5 space-y-10">
                  
                  {/* Assessment Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <PenTool size={20} />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-widest text-[var(--on-surface)]">Assessment (A)</h3>
                    </div>
                    <textarea
                      required
                      className="w-full h-64 bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-6 text-base font-bold focus:ring-4 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30 leading-relaxed"
                      placeholder="Diagnosis kerja, diagnosis banding, dll..."
                      value={formData.assessment}
                      onChange={(e) => handleInputChange('assessment', e.target.value)}
                    />
                  </div>

                  {/* Plan Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <ClipboardList size={20} />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-widest text-[var(--on-surface)]">Plan (P)</h3>
                    </div>
                    <textarea
                      required
                      className="w-full h-64 bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-3xl p-6 text-base font-bold focus:ring-4 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30 leading-relaxed"
                      placeholder="Rencana terapi, instruksi, rencana monitoring..."
                      value={formData.plan}
                      onChange={(e) => handleInputChange('plan', e.target.value)}
                    />
                  </div>

                  {/* JCI Verification */}
                  <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-[2.5rem] p-8 mt-12">
                    <label className="flex items-start gap-5 cursor-pointer group">
                      <div className="relative flex items-center mt-1">
                        <input 
                          type="checkbox" 
                          className="peer h-8 w-8 cursor-pointer appearance-none rounded-xl border-2 border-emerald-500/20 bg-white dark:bg-black/20 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                          checked={formData.verification}
                          onChange={(e) => handleInputChange('verification', e.target.checked)}
                        />
                        <CheckCircle2 size={20} className="absolute left-1.5 top-1.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[var(--on-surface)] uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Verifikasi Rekam Medis (JCI)</span>
                        <p className="text-[11px] font-bold text-[var(--on-surface-variant)] mt-2 opacity-60 leading-relaxed">Saya menyatakan bahwa data rekam medis di atas adalah benar dan sesuai dengan hasil pemeriksaan saat ini.</p>
                      </div>
                    </label>
                  </div>

                </div>
              </div>
            </A4Layout>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-[var(--surface-container)] border-t border-[var(--outline-variant)] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest">Audit Trail Metadata</span>
              <span className="text-[9px] font-bold text-[var(--on-surface-variant)]/60 uppercase">Mode: Professional Clinical Entry • Encrypted</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-all"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="bg-[var(--primary)] hover:brightness-110 text-white px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 transition-all flex items-center gap-3 active:scale-95"
              >
                <Save size={18} /> Simpan Data Klinis
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
