import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../triage.store.js';
import { calculateNEWS2, getTriageColor } from '../../../utils/clinicalCalculators.js';
import { Activity, AlertTriangle, ShieldCheck, Thermometer, Brain, Scissors, Stethoscope, ClipboardList } from 'lucide-react';

export default function DetailedAssessment() {
  const { t } = useTranslation();
  const { vitals, setVital, secondaryAssessment, setSecondaryField } = useTriageStore();
  const news2 = calculateNEWS2(vitals);
  const triageColor = getTriageColor(news2.score);

  const toggleCondition = (field) => {
    setSecondaryField(field, secondaryAssessment[field] === 'NORMAL' ? 'ABNORMAL' : 'NORMAL');
  };

  const SECTIONS = [
    { id: 'neurological', label: t('triage_v2.labels.neurological'), icon: <Brain className="w-5 h-5" /> },
    { id: 'integumentary', label: t('triage_v2.labels.integumentary'), icon: <Scissors className="w-5 h-5" /> },
    { id: 'musculoskeletal', label: t('triage_v2.labels.musculoskeletal'), icon: <Activity className="w-5 h-5" /> },
    { id: 'gastrointestinal', label: t('triage_v2.labels.gastrointestinal'), icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* ─── Clinical Risk: NEWS2 Score ─── */}
      <div className={`glass-panel p-8 rounded-[2.5rem] flex flex-row flex-wrap justify-between items-center gap-6 transition-all border shadow-premium-soft overflow-hidden relative ${
        news2.score >= 5 
        ? 'border-error/30 bg-error/10' 
        : 'border-white/10'
      }`}>
        {news2.score >= 5 && <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-error/20 rounded-full blur-3xl pointer-events-none"></div>}
        
        <div className="flex flex-col gap-1 min-w-0 relative z-10">
          <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-80 ${news2.score >= 5 ? 'text-error' : 'text-on-surface-variant'}`}>
             {t('triage_v2.labels.parameters')}
          </h3>
          <p className={`text-4xl font-headline font-black truncate ${news2.score >= 5 ? 'text-error' : 'text-on-surface'}`}>
             NEWS2: {news2.score}
          </p>
          <p className={`text-sm font-bold opacity-90 whitespace-nowrap ${news2.score >= 5 ? 'text-error' : 'text-on-surface-variant'}`}>
            {t('common.status.risk')}: {t(`triage_v2.news2.risk.${news2.riskLevel.toLowerCase()}`)} - {t(`triage_v2.news2.freq.${news2.frequency}`)}
          </p>
        </div>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0 border relative z-10 shadow-inner ${
            news2.score >= 5 ? 'bg-error/20 border-error/50 shadow-glow-error' : 'bg-surface-container-low/50 border-outline-variant/30'
        }`}>
          <AlertTriangle className={`w-10 h-10 ${news2.score >= 5 ? 'text-error' : 'text-on-surface-variant'}`} />
        </div>
      </div>

      {/* ─── Categorical Systems Review ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SECTIONS.map(s => (
          <button 
            key={s.id}
            onClick={() => toggleCondition(s.id)}
            className={`clinical-card p-6 rounded-3xl border flex flex-col items-start text-left transition-all min-w-0 shadow-premium-soft group relative overflow-hidden ${
              secondaryAssessment[s.id] === 'ABNORMAL' 
              ? 'border-error/40 bg-error/5 shadow-glow-error' 
              : 'border-white/10 bg-surface-container-lowest/40 hover:border-primary/30 hover:bg-surface-container-low/50'
            }`}
          >
            {secondaryAssessment[s.id] === 'ABNORMAL' && <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-2xl pointer-events-none"></div>}
            
            <div className={`p-4 rounded-2xl mb-6 shrink-0 relative z-10 shadow-inner transition-colors ${
               secondaryAssessment[s.id] === 'ABNORMAL' 
               ? 'bg-error/20 text-error border border-error/30' 
               : 'bg-surface-container-low/50 text-primary border border-outline-variant/30 group-hover:bg-primary/10 group-hover:border-primary/20'
            }`}>
              {s.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80 whitespace-nowrap text-on-surface-variant relative z-10">{s.label}</span>
            <span className={`text-xl font-headline font-black truncate w-full relative z-10 ${
               secondaryAssessment[s.id] === 'ABNORMAL' ? 'text-error' : 'text-on-surface'
            }`}>
              {secondaryAssessment[s.id] === 'ABNORMAL' ? t('common.status.abnormal') : t('common.status.normal')}
            </span>
          </button>
        ))}
      </section>

      {/* ─── Clinical Safety: Allergies & Meds ─── */}
      <section className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-premium-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldCheck className="w-48 h-48 text-primary" />
        </div>
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-inner">
               <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-headline font-black uppercase tracking-widest text-primary">{t('triage_v2.labels.safety_check')}</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-error shadow-glow-error"></div>
               {t('patients_v2.wizard.fields.allergy_history')}
            </label>
            <textarea 
              value={secondaryAssessment.allergies || ''}
              onChange={(e) => setSecondaryField('allergies', e.target.value)}
              placeholder={t('patients_v2.wizard.fields.allergy_history_placeholder') || "List all allergies..."}
              className="w-full min-h-[120px] resize-none bg-surface-container-lowest/50 backdrop-blur-md border border-error/20 rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-error/30 focus:border-error transition-all shadow-inner font-medium text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary"></div>
               {t('triage_v2.labels.current_meds')}
            </label>
            <textarea 
              value={secondaryAssessment.currentMeds || ''}
              onChange={(e) => setSecondaryField('currentMeds', e.target.value)}
              placeholder={t('triage_v2.labels.current_meds_placeholder')}
              className="w-full min-h-[120px] resize-none bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner font-medium text-sm"
            />
          </div>
        </div>
      </section>

      {/* ─── Detailed Physical: Pain & GCS ─── */}
      <section className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-premium-soft relative overflow-hidden">
        <div className="flex flex-row flex-wrap justify-between items-center mb-8 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-inner">
               <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-headline font-black uppercase tracking-widest text-primary">{t('triage_v2.labels.additional_assessment')}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('triage_v2.labels.pain_scale')} (0-10)</label>
            <input 
              type="number"
              value={vitals.painScale || ''}
              onChange={(e) => setVital('painScale', e.target.value)}
              className="bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl py-5 text-3xl font-headline font-black text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner"
              min="0" max="10"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('triage_v2.labels.neurological')} (GCS 3-15)</label>
            <input 
              type="number"
              value={vitals.gcs || ''}
              onChange={(e) => setVital('gcs', e.target.value)}
              className="bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl py-5 text-3xl font-headline font-black text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner"
              min="3" max="15"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
