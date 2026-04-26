import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../triage.store.js';
import { Thermometer, Activity, Heart, Plane, ShieldAlert, ChevronRight } from 'lucide-react';

export default function PoliTriage() {
  const { t } = useTranslation();
  const { vitals, setVital, screeningQuestions, setScreeningQuestion } = useTriageStore();

  const QUESTIONS = [
    { id: 'fever', label: t('triage_v2.screening.fever'), icon: <Thermometer className="w-4 h-4" /> },
    { id: 'travel', label: t('triage_v2.screening.travel'), icon: <Plane className="w-4 h-4" /> },
    { id: 'contact', label: t('triage_v2.screening.contact'), icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'chestPain', label: t('triage_v2.screening.chest_pain'), icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* ─── Standard Clinic Vitals ─── */}
      <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant shadow-lg">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">{t('triage_v2.modes.poli')}</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { id: 'weight', label: t('triage_v2.vitals.weight'), unit: t('common.units.kg') },
            { id: 'height', label: t('triage_v2.vitals.height'), unit: t('common.units.cm') },
            { id: 'temp', label: t('triage_v2.vitals.temp'), unit: t('common.units.celcius') },
          ].map(v => (
            <div key={v.id} className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                {v.label} ({v.unit})
              </label>
              <input 
                type="number"
                value={vitals[v.id] || ''}
                onChange={(e) => setVital(v.id, e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Specialty Screening Logic ─── */}
      <section className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant shadow-xl">
        <div className="flex flex-row justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-on-surface">{t('triage_v2.screening.title')}</h3>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-emerald-400 text-[10px] font-black tracking-wide uppercase">{t('triage_v2.screening.protocol_active')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {QUESTIONS.map(q => (
            <div key={q.id} className="flex flex-row justify-between items-center p-5 rounded-2xl bg-surface-container border border-outline-variant hover:border-outline transition-all group">
              <div className="flex flex-row items-center gap-4">
                <div className="p-2.5 rounded-xl bg-surface-container-high text-primary group-hover:text-primary/80 transition-colors">
                  {q.icon}
                </div>
                <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{q.label}</span>
              </div>
              <div className="flex flex-row gap-2">
                {[
                  { val: t('common.yes'), color: 'bg-rose-600 border-rose-400 text-white', active: true },
                  { val: t('common.no'), color: 'bg-surface-container-high border-outline-variant text-on-surface-variant', active: false }
                ].map(opt => (
                  <button 
                    key={opt.val}
                    onClick={() => setScreeningQuestion(q.id, opt.active)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all border ${
                      screeningQuestions[q.id] === opt.active 
                      ? opt.color + ' scale-105 shadow-lg' 
                      : 'bg-surface-container-high border-transparent text-on-surface-variant opacity-40 hover:opacity-100'
                    }`}
                  >
                    {opt.val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Escalation Logic ─── */}
      <div className="p-6 rounded-3xl bg-blue-600 text-white flex flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
        </div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('triage_v2.labels.escalation_trigger')}</h4>
          <p className="text-sm font-medium">{t('triage_v2.screening.escalation_desc')}</p>
        </div>
        <ChevronRight className="w-6 h-6 ml-auto opacity-40" />
      </div>
    </div>
  );
}
