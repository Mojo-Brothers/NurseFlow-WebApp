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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* ─── Clinical Risk: NEWS2 Score ─── */}
      <div className={`p-8 rounded-3xl flex flex-row flex-wrap justify-between items-center gap-6 transition-all border ${
        news2.score >= 5 
        ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
        : 'bg-surface-container-low border-outline-variant text-on-surface'
      }`}>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('triage_v2.labels.parameters')}</h3>
          <p className="text-3xl font-black truncate">NEWS2: {news2.score}</p>
          <p className="text-sm font-bold opacity-80 whitespace-nowrap">
            {t('common.status.risk')}: {t(`triage_v2.news2.risk.${news2.riskLevel.toLowerCase()}`)} - {t(`triage_v2.news2.freq.${news2.frequency}`)}
          </p>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md shrink-0 border ${
            news2.score >= 5 ? 'bg-rose-500/20 border-rose-500/50' : 'bg-surface-container border-outline-variant'
        }`}>
          <AlertTriangle className={`w-8 h-8 ${news2.score >= 5 ? 'text-rose-500' : 'text-on-surface-variant'}`} />
        </div>
      </div>

      {/* ─── Categorical Systems Review ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(s => (
          <button 
            key={s.id}
            onClick={() => toggleCondition(s.id)}
            className={`p-6 rounded-3xl border-2 flex flex-col items-start text-left transition-all min-w-0 ${
              secondaryAssessment[s.id] === 'ABNORMAL' 
              ? 'border-rose-500 bg-rose-500/10' 
              : 'border-outline-variant bg-surface-container hover:border-outline'
            }`}
          >
            <div className={`p-3 rounded-xl mb-4 shrink-0 ${secondaryAssessment[s.id] === 'ABNORMAL' ? 'bg-rose-500/20 text-rose-500' : 'bg-surface-container text-primary'}`}>
              {s.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 whitespace-nowrap text-on-surface-variant">{s.label}</span>
            <span className={`text-lg font-bold truncate w-full ${secondaryAssessment[s.id] === 'ABNORMAL' ? 'text-rose-500' : 'text-on-surface'}`}>
              {secondaryAssessment[s.id] === 'ABNORMAL' ? t('common.status.abnormal') : t('common.status.normal')}
            </span>
          </button>
        ))}
      </section>

      {/* ─── Clinical Safety: Allergies & Meds ─── */}
      <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant shadow-lg">
        <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">{t('triage_v2.labels.safety_check')}</h3>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('patients_v2.wizard.fields.allergy_history')}</label>
            <textarea 
              value={secondaryAssessment.allergies || ''}
              onChange={(e) => setSecondaryField('allergies', e.target.value)}
              placeholder={t('patients_v2.wizard.fields.allergy_history_placeholder') || "List all allergies..."}
              className="w-full min-h-[100px] resize-none bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('triage_v2.labels.current_meds')}</label>
            <textarea 
              value={secondaryAssessment.currentMeds || ''}
              onChange={(e) => setSecondaryField('currentMeds', e.target.value)}
              placeholder={t('triage_v2.labels.current_meds_placeholder')}
              className="w-full min-h-[100px] resize-none bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ─── Detailed Physical: Pain & GCS ─── */}
      <section className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant shadow-lg">
        <div className="flex flex-row flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">{t('triage_v2.labels.additional_assessment')}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('triage_v2.labels.pain_scale')}</label>
            <input 
              type="number"
              value={vitals.painScale || ''}
              onChange={(e) => setVital('painScale', e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-2xl py-4 text-2xl font-black text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              min="0" max="10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('triage_v2.labels.neurological')} (GCS 3-15)</label>
            <input 
              type="number"
              value={vitals.gcs || ''}
              onChange={(e) => setVital('gcs', e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-2xl py-4 text-2xl font-black text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              min="3" max="15"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
