import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ClinicalAlertBanner({ riskProfile, trendAlerts }) {
  const { t } = useTranslation();
  if (!riskProfile && (!trendAlerts || trendAlerts.length === 0)) return null;

  const isHighRisk = riskProfile?.level === 'HIGH';
  const isModerateRisk = riskProfile?.level === 'MODERATE';

  return (
    <div className={`p-4 rounded-2xl border-l-8 shadow-lg animate-pulse mb-6 flex-row items-center justify-between
      ${isHighRisk ? 'bg-error-container border-error text-on-error-container' : 
        isModerateRisk ? 'bg-warning-container border-warning text-on-warning-container' : 
        'bg-secondary-container border-secondary text-on-secondary-container'}`}>
       
       <div className="flex-row items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center 
            ${isHighRisk ? 'bg-error text-white' : 'bg-current opacity-20'}`}>
             <span className="material-symbols-outlined text-3xl">
                {isHighRisk ? 'emergency' : 'monitoring'}
             </span>
          </div>
          
          <div>
             <h3 className="text-sm font-black uppercase tracking-widest">
                {isHighRisk ? t('common.alerts.sepsis_alert') : t('common.alerts.surveillance_insight')}
             </h3>
             <div className="flex-row flex-wrap gap-2 mt-1">
                {riskProfile?.indicators.map((ind, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-black/5 rounded uppercase">{ind}</span>
                ))}
                {trendAlerts?.map((trend, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary rounded uppercase">{trend}</span>
                ))}
             </div>
             {riskProfile?.recommendation && (
               <p className="text-xs font-black mt-2 italic">“{riskProfile.recommendation}”</p>
             )}
          </div>
       </div>

       <button className="px-6 py-2 bg-black/10 hover:bg-black/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
          {t('common.alerts.ack_risk')}
       </button>
    </div>
  );
}
