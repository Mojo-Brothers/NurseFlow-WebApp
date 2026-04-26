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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Chief Complaint: Initial Contact ─── */}
      <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant shadow-lg">
        <div className="flex flex-row justify-between items-center mb-6">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-on-surface">{t('triage_v2.labels.chief_complaint')}</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('triage_v2.labels.jci_evidence')}</p>
            </div>
          </div>
          <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter border border-rose-500/20">
            {t('triage_v2.labels.emergency_protocol')}
          </span>
        </div>
        
        <textarea 
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder={t('patients_v2.admission.reason_placeholder')}
          className="w-full min-h-[100px] text-lg font-medium leading-relaxed bg-surface-container-highest/30 border border-outline-variant rounded-2xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
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
              className="px-4 py-2 rounded-xl bg-surface-container-high text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-all border border-outline-variant hover:border-primary text-on-surface-variant shadow-sm active:scale-95"
            >
              + {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Phase 0: Primary Survey (ABC) ─── */}
      <section className="bg-surface-container-low p-6 rounded-3xl border-l-4 border-primary border-y border-r border-outline-variant shadow-md">
        <div className="flex flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">
              {t('triage_v2.labels.survey_primer')}
            </h3>
          </div>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase">
            {t('triage_v2.labels.safety_check')}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {surveyPrimerFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant ml-1">
                {field.label}
              </span>
              <div className="flex flex-wrap gap-1">
                {field.options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setSecondaryField(field.key, opt)}
                    className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                      secondaryAssessment[field.key] === opt 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline'
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

      {/* ─── Phase 1: Physiological Status ─── */}
      <section className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="w-32 h-32 text-primary" />
        </div>
        
        <div className="flex flex-row justify-between items-center mb-8 relative z-10">
          <h3 className="text-2xl font-bold text-on-surface">{t('triage_v2.labels.physiological_status')}</h3>
          <div className="flex flex-row items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-primary text-[10px] font-bold tracking-wide uppercase">{t('triage_v2.labels.phase_1_active')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
          {Object.entries(VITAL_CONFIG).map(([key, cfg]) => (
            <button 
              key={key}
              onClick={() => setActiveVital(key)}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-start gap-1 group ${
                activeVital === key 
                ? 'bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] text-on-primary' 
                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              <div className="flex items-center gap-2 opacity-60">
                {cfg.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </div>
              <div className="flex flex-row items-baseline gap-1">
                <span className={`text-2xl font-black ${activeVital === key ? 'text-on-primary' : 'text-on-surface'}`}>
                    {vitals[key] || '--'}
                </span>
                <span className="text-[10px] font-bold opacity-40">{cfg.unit}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Rapid Touch Input Pad */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant relative z-10">
          <div className="flex flex-row justify-between items-center mb-6 px-2">
            <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
              {t('triage_v2.labels.entry')}: {VITAL_CONFIG[activeVital].label}
            </span>
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary">{vitals[activeVital] || '0'}</span>
                <span className="text-xs font-bold text-on-surface-variant">{VITAL_CONFIG[activeVital].unit}</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {VITAL_CONFIG[activeVital].presets.map(val => (
              <button 
                key={val}
                onClick={() => handleVitalChange(activeVital, val)}
                className="py-4 bg-surface-container-high hover:bg-primary rounded-xl font-black text-lg text-on-surface hover:text-on-primary transition-all border border-outline-variant hover:border-primary shadow-sm"
              >
                {val}
              </button>
            ))}
            <button 
              onClick={() => handleVitalChange(activeVital, '')}
              className="py-4 bg-error/10 text-error rounded-xl font-black text-lg hover:bg-error hover:text-on-error transition-all border border-error/20"
            >
              {t('triage_v2.labels.clr')}
            </button>
          </div>
        </div>
      </section>

      {/* Decision Support: ESI Suggestion */}
      <section className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant shadow-lg mb-10">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-8">
            {t('triage_v2.labels.esi_score')}
        </h3>
        <div className="flex flex-row flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setEsiLevel(level)}
              className={`flex-1 min-w-[100px] py-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 ${
                esiLevel === level 
                ? `bg-primary border-surface-container-lowest shadow-xl scale-105 text-on-primary` 
                : 'bg-surface-container border-outline-variant opacity-40 hover:opacity-100 text-on-surface-variant'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{t('triage_v2.labels.esi_level')}</span>
              <span className="text-4xl font-black">{level}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
