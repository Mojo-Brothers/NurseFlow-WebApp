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
      <section className="glass-panel p-8 rounded-3xl border border-white/10 shadow-premium-soft">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
                <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-headline font-black uppercase tracking-widest text-on-surface">{t('triage_v2.modes.poli')}</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { id: 'weight', label: t('triage_v2.vitals.weight'), unit: t('common.units.kg') },
            { id: 'height', label: t('triage_v2.vitals.height'), unit: t('common.units.cm') },
            { id: 'temp', label: t('triage_v2.vitals.temp'), unit: t('common.units.celcius') },
          ].map(v => (
            <div key={v.id} className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 ml-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(2,107,150,0.8)]"></div>
                {v.label} ({v.unit})
              </label>
              <input 
                type="number"
                value={vitals[v.id] || ''}
                onChange={(e) => setVital(v.id, e.target.value)}
                className="bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl px-5 py-4 text-2xl font-headline font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner placeholder:text-primary/20"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Specialty Screening Logic ─── */}
      <section className="clinical-card group relative p-8 rounded-[2.5rem] border border-white/10 shadow-premium-soft overflow-hidden">
        <div className="flex flex-row justify-between items-center mb-8 relative z-10">
          <h3 className="text-xl font-headline font-black text-on-surface">{t('triage_v2.screening.title')}</h3>
          <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow-primary"></div>
            <span className="text-emerald-500 text-[10px] font-black tracking-wide uppercase">{t('triage_v2.screening.protocol_active')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 relative z-10">
          {QUESTIONS.map(q => (
            <div key={q.id} className="flex flex-row justify-between items-center p-5 rounded-2xl bg-surface-container-low/50 backdrop-blur-sm border border-outline-variant/30 hover:border-primary/50 transition-all hover:bg-surface-container-high/50 group/item shadow-sm">
              <div className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-xl bg-surface-container-highest/50 text-primary group-hover/item:text-primary transition-colors shadow-inner">
                  {q.icon}
                </div>
                <span className="text-sm font-headline font-bold text-on-surface group-hover/item:text-primary transition-colors">{q.label}</span>
              </div>
              <div className="flex flex-row gap-2">
                {[
                  { val: t('common.yes'), color: 'bg-error text-white shadow-glow-error', active: true },
                  { val: t('common.no'), color: 'bg-surface-container-lowest/50 text-on-surface-variant', active: false }
                ].map(opt => (
                  <button 
                    key={opt.val}
                    onClick={() => setScreeningQuestion(q.id, opt.active)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      screeningQuestions[q.id] === opt.active 
                      ? opt.color + ' border-transparent scale-105' 
                      : 'border-outline-variant/30 opacity-40 hover:opacity-100 hover:border-outline-variant/60'
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
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex flex-row items-center gap-6 shadow-[0_10px_30px_rgba(37,99,235,0.3)] relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <ShieldAlert className="w-24 h-24" />
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
            <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('triage_v2.labels.escalation_trigger')}</h4>
          <p className="text-sm font-medium leading-relaxed">{t('triage_v2.screening.escalation_desc')}</p>
        </div>
        <ChevronRight className="w-6 h-6 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}
