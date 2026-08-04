import React, { useState } from 'react';
import { useTriageStore } from '../triage.store';
import { useTranslation } from 'react-i18next';
import { Activity, Wind, Heart, Brain, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RapidIntake() {
  const { t } = useTranslation();
  const { 
    vitals, setVital, 
    esiLevel, setEsiLevel, 
    secondaryAssessment, setSecondaryField,
    chiefComplaint, setChiefComplaint 
  } = useTriageStore();
  
  const [activeVital, setActiveVital] = useState('heartRate');

  const VITAL_CONFIG = {
    heartRate:   { label: t('triage_v2.vitals.hr'), unit: t('common.units.bpm'), icon: <Heart className="w-4 h-4" />, presets: [60, 80, 100, 120] },
    systolicBP:  { label: t('triage_v2.vitals.bp'), unit: t('common.units.mmhg'), icon: <Activity className="w-4 h-4" />, presets: [100, 120, 140, 160] },
    respRate:    { label: t('triage_v2.vitals.rr'), unit: t('common.units.per_min'), icon: <Wind className="w-4 h-4" />, presets: [16, 20, 24, 28] },
    spo2:        { label: t('triage_v2.vitals.spo2'), unit: t('common.units.percent'), icon: <Activity className="w-4 h-4" />, presets: [95, 98, 100] },
  };

  const emergencyTagMapping = [
    { id: 'chest_pain', label: t('triage_v2.tags.chest_pain') },
    { id: 'shortness_of_breath', label: t('triage_v2.tags.shortness_of_breath') },
    { id: 'bleeding', label: t('triage_v2.tags.bleeding') },
    { id: 'major_trauma', label: t('triage_v2.tags.major_trauma') },
    { id: 'seizure', label: t('triage_v2.tags.seizure') },
    { id: 'unconscious', label: t('triage_v2.tags.unconscious') }
  ];

  const surveyPrimerFields = [
    { key: 'airway', label: t('triage_v2.labels.survey_airway'), options: ['PATENT', 'OBSTRUCTED', 'STRIDOR'] },
    { key: 'breathing', label: t('triage_v2.labels.survey_breathing'), options: ['ADEQUATE', 'LABORED', 'APNEIC'] },
    { key: 'circulation', label: t('triage_v2.labels.survey_circulation'), options: ['PRESENT', 'WEAK', 'ABSENT'] },
    { key: 'neurological', label: t('triage_v2.labels.survey_disability'), options: ['ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE'] }
  ];

  const handleVitalChange = (field, value) => {
    setVital(field, value);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Chief Complaint: Initial Contact ─── */}
      <section className="glass-panel p-8 rounded-3xl border border-white/10 shadow-premium-soft relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-8 opacity-[0.02] transform rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <AlertTriangle className="w-64 h-64 text-error" />
        </div>
        
        <div className="flex flex-row justify-between items-center mb-6 relative z-10">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-error/20 to-error/5 text-error flex items-center justify-center shadow-inner border border-error/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-headline font-black text-on-surface tracking-tight">{t('triage_v2.labels.chief_complaint')}</h3>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('triage_v2.labels.jci_evidence')}</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <textarea 
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Ketik keluhan utama pasien di sini, atau gunakan tag cepat di bawah..."
            className="w-full min-h-[120px] text-lg font-medium leading-relaxed bg-surface-container-lowest/40 backdrop-blur-xl border border-outline-variant/30 rounded-2xl px-6 py-5 text-on-surface focus:outline-none focus:ring-2 focus:ring-error/40 focus:border-error transition-all placeholder:text-on-surface-variant/40 shadow-inner resize-none"
          />
          
          <div className="flex flex-row flex-wrap gap-2 mt-4">
            {emergencyTagMapping.map(tag => (
              <button 
                key={tag.id}
                onClick={() => {
                  const current = chiefComplaint ? String(chiefComplaint) : '';
                  if (!current.includes(tag.label)) {
                    setChiefComplaint(current ? `${current}, ${tag.label}` : tag.label);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-surface-container/50 backdrop-blur-sm text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-all border border-outline-variant/20 hover:border-error/30 shadow-sm flex items-center gap-2 active:scale-95"
              >
                <span className="text-[10px] opacity-50">+</span> {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Phase 0: Primary Survey (ABC) ─── */}
        <section className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/10 shadow-premium-soft flex flex-col h-full">
          <div className="flex flex-row items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-headline font-black uppercase tracking-widest text-primary">
                {t('triage_v2.labels.survey_primer')}
              </h3>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase">Cek Keselamatan JCI</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-5 flex-1 justify-center">
            {surveyPrimerFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 ml-1">
                  {field.label}
                </span>
                <div className="flex flex-row bg-surface-container-lowest/50 p-1 rounded-xl border border-outline-variant/30">
                  {field.options.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setSecondaryField(field.key, opt)}
                      className={`flex-1 px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        secondaryAssessment[field.key] === opt 
                        ? 'bg-primary border border-primary-container text-on-primary shadow-glow-primary' 
                        : 'text-on-surface-variant hover:bg-surface-container-high/50 border border-transparent'
                      }`}
                    >
                      {t(`triage_v2.options.${field.key}.${opt}`) || opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Phase 1: Physiological Status (Vitals) ─── */}
        <section className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 shadow-premium-soft">
          <div className="flex flex-row justify-between items-center mb-6">
            <div className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-headline font-black uppercase tracking-widest text-blue-500">
                  {t('triage_v2.labels.physiological_status')}
                </h3>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">Parameter Klinis TTV</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(VITAL_CONFIG).map(([key, cfg]) => (
              <div key={key} className="bg-surface-container-lowest/40 border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-3 group focus-within:border-primary/50 focus-within:bg-primary/5 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    {cfg.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
                  </div>
                  <span className="text-[9px] font-bold text-on-surface-variant/50">{cfg.unit}</span>
                </div>
                
                <div className="flex flex-row items-center gap-3">
                  {key === 'systolicBP' ? (
                    <div className="flex flex-1 items-center gap-2 text-3xl font-headline font-black text-on-surface">
                      <input
                        type="number"
                        value={vitals.systolicBP || ''}
                        onChange={(e) => handleVitalChange('systolicBP', e.target.value)}
                        placeholder="--"
                        className="w-20 bg-transparent text-center focus:outline-none placeholder:text-on-surface-variant/30 text-3xl font-headline font-black text-on-surface"
                      />
                      <span className="text-on-surface-variant/50 text-2xl">/</span>
                      <input
                        type="number"
                        value={vitals.diastolicBP || ''}
                        onChange={(e) => handleVitalChange('diastolicBP', e.target.value)}
                        placeholder="--"
                        className="w-20 bg-transparent text-center focus:outline-none placeholder:text-on-surface-variant/30 text-3xl font-headline font-black text-on-surface"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={vitals[key] || ''}
                      onChange={(e) => handleVitalChange(key, e.target.value)}
                      placeholder="--"
                      className="flex-1 bg-transparent text-3xl font-headline font-black text-on-surface w-full focus:outline-none placeholder:text-on-surface-variant/30"
                    />
                  )}
                  
                  {/* Preset Pills */}
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {cfg.presets.slice(0, 2).map(val => (
                        <button 
                          key={val}
                          onClick={() => handleVitalChange(key, val)}
                          className="w-10 h-7 rounded-md bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-all border border-transparent hover:border-primary/30"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    {cfg.presets.length > 2 && (
                      <div className="flex gap-1">
                        {cfg.presets.slice(2, 4).map(val => (
                          <button 
                            key={val}
                            onClick={() => handleVitalChange(key, val)}
                            className="w-10 h-7 rounded-md bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-all border border-transparent hover:border-primary/30"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── Decision Support: ESI Suggestion ─── */}
      <section className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-premium-soft mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 relative z-10">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shadow-inner border border-primary/20">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-headline font-black text-on-surface tracking-tight">{t('triage_v2.labels.esi_score')}</h3>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Penetapan Skala Prioritas Medis</p>
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-wrap md:flex-nowrap gap-4 relative z-10">
          {[
            { level: 1, label: 'RESUSCITATION', color: 'error', styles: 'bg-error/10 border-error/30 text-error hover:bg-error/20' },
            { level: 2, label: 'EMERGENT', color: 'orange-500', styles: 'bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20' },
            { level: 3, label: 'URGENT', color: 'yellow-500', styles: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20' },
            { level: 4, label: 'LESS URGENT', color: 'emerald-500', styles: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' },
            { level: 5, label: 'NON URGENT', color: 'blue-500', styles: 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20' }
          ].map(({ level, label, styles }) => {
             const isSelected = esiLevel === level;
             const selectedStyles = level === 1 ? 'bg-error text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] border-error' :
                                    level === 2 ? 'bg-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] border-orange-500' :
                                    level === 3 ? 'bg-yellow-500 text-white shadow-[0_0_30px_rgba(234,179,8,0.4)] border-yellow-500' :
                                    level === 4 ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border-emerald-500' :
                                    'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] border-blue-500';
             
             return (
              <button
                key={level}
                onClick={() => setEsiLevel(level)}
                className={`flex-1 py-6 px-2 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                  isSelected ? selectedStyles : `bg-surface-container-lowest/30 border-outline-variant/30 text-on-surface-variant hover:border-current hover:bg-current/5`
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'opacity-90' : 'opacity-60 group-hover:text-current'}`}>ESI Level</span>
                <span className={`text-4xl font-headline font-black ${isSelected ? '' : 'group-hover:text-current'}`}>{level}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isSelected ? 'opacity-90' : 'opacity-50 group-hover:text-current'}`}>{label}</span>
              </button>
             );
          })}
        </div>
      </section>
    </div>
  );
}
