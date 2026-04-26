import React, { useState } from 'react';
import { X, Save, ShieldAlert, Activity, Heart, Thermometer, Wind, Zap, FileText, ClipboardList, PenTool, CheckCircle2 } from 'lucide-react';

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
                  <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">{patient?.name || 'Pasien'}</span>
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
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[var(--surface-container-lowest)]">
            <div className="grid grid-cols-12 gap-8">
              
              {/* SUBJECTIVE & OBJECTIVE (Left 7 Columns) */}
              <div className="col-span-12 lg:col-span-7 space-y-8">
                
                {/* Subjective Section */}
                <div className="bg-[var(--surface-container-low)]/50 rounded-3xl border border-[var(--outline-variant)] p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)]">Subjective (S)</h3>
                  </div>
                  <textarea
                    required
                    className="w-full h-32 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30"
                    placeholder="Keluhan utama, riwayat penyakit sekarang, dll..."
                    value={formData.subjective}
                    onChange={(e) => handleInputChange('subjective', e.target.value)}
                  />
                </div>

                {/* Objective Section */}
                <div className="bg-[var(--surface-container-low)]/50 rounded-3xl border border-[var(--outline-variant)] p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Activity size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)]">Objective (O)</h3>
                  </div>

                  {/* Vital Signs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--surface-container-lowest)] p-4 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                      <label className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">
                        <Heart size={12} className="text-red-500" /> Tekanan Darah (mmHg)
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          placeholder="Sys"
                          className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                          value={formData.objective.vitalSigns.td_systolic}
                          onChange={(e) => handleVitalChange('td_systolic', e.target.value)}
                        />
                        <span className="opacity-30">/</span>
                        <input 
                          type="number" 
                          placeholder="Dia"
                          className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                          value={formData.objective.vitalSigns.td_diastolic}
                          onChange={(e) => handleVitalChange('td_diastolic', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-[var(--surface-container-lowest)] p-4 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                      <label className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">
                        <Zap size={12} className="text-amber-500" /> Nadi (bpm)
                      </label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                        value={formData.objective.vitalSigns.hr}
                        onChange={(e) => handleVitalChange('hr', e.target.value)}
                      />
                    </div>

                    <div className="bg-[var(--surface-container-lowest)] p-4 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                      <label className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">
                        <Thermometer size={12} className="text-orange-500" /> Suhu (°C)
                      </label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="36.5"
                        className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                        value={formData.objective.vitalSigns.temp}
                        onChange={(e) => handleVitalChange('temp', e.target.value)}
                      />
                    </div>

                    <div className="bg-[var(--surface-container-lowest)] p-4 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                      <label className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">
                        <Wind size={12} className="text-blue-400" /> Resp (x/mnt)
                      </label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                        value={formData.objective.vitalSigns.rr}
                        onChange={(e) => handleVitalChange('rr', e.target.value)}
                      />
                    </div>

                    <div className="bg-[var(--surface-container-lowest)] p-4 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                      <label className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">
                        <Activity size={12} className="text-emerald-400" /> SpO2 (%)
                      </label>
                      <input 
                        type="number" 
                        placeholder="99"
                        className="w-full bg-transparent outline-none text-sm font-black text-[var(--on-surface)]"
                        value={formData.objective.vitalSigns.spo2}
                        onChange={(e) => handleVitalChange('spo2', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest">Pemeriksaan Fisik / Status Lokalis</label>
                    <textarea
                      className="w-full h-32 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30"
                      placeholder="Detail pemeriksaan fisik..."
                      value={formData.objective.physicalExam}
                      onChange={(e) => setFormData(prev => ({ ...prev, objective: { ...prev.objective, physicalExam: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>

              {/* ASSESSMENT & PLAN (Right 5 Columns) */}
              <div className="col-span-12 lg:col-span-5 space-y-8">
                
                {/* Assessment Section */}
                <div className="bg-[var(--surface-container-low)]/50 rounded-3xl border border-[var(--outline-variant)] p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <PenTool size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)]">Assessment (A)</h3>
                  </div>
                  <textarea
                    required
                    className="w-full h-40 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30"
                    placeholder="Diagnosis kerja, diagnosis banding, dll..."
                    value={formData.assessment}
                    onChange={(e) => handleInputChange('assessment', e.target.value)}
                  />
                </div>

                {/* Plan Section */}
                <div className="bg-[var(--surface-container-low)]/50 rounded-3xl border border-[var(--outline-variant)] p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <ClipboardList size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)]">Plan (P)</h3>
                  </div>
                  <textarea
                    required
                    className="w-full h-40 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none placeholder:opacity-30"
                    placeholder="Rencana terapi, instruksi, rencana monitoring..."
                    value={formData.plan}
                    onChange={(e) => handleInputChange('plan', e.target.value)}
                  />
                </div>

                {/* JCI Verification */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input 
                        type="checkbox" 
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                        checked={formData.verification}
                        onChange={(e) => handleInputChange('verification', e.target.checked)}
                      />
                      <CheckCircle2 size={16} className="absolute left-1.25 top-1.25 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--on-surface)] uppercase tracking-wider group-hover:text-emerald-500 transition-colors">Verifikasi Rekam Medis (JCI)</span>
                      <p className="text-[10px] font-bold text-[var(--on-surface-variant)] mt-1">Saya menyatakan bahwa data rekam medis di atas adalah benar dan sesuai dengan hasil pemeriksaan saat ini.</p>
                    </div>
                  </label>
                </div>

              </div>
            </div>
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
