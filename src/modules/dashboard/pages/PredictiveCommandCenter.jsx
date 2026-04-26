import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import StaffingOptimizationCard from '../components/StaffingOptimizationCard';
import { fetchSurgeForecast, getStaffingRatios } from '../../../core/services/predictive.service.js';

/**
 * PredictiveCommandCenter — The futuristic resource intelligence hub.
 */
export default function PredictiveCommandCenter() {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [ratios] = useState(getStaffingRatios());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurgeForecast().then(data => {
      setForecast(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="p-20 flex items-center justify-center">
       <div className="animate-spin material-symbols-outlined text-4xl text-primary">psychology</div>
    </div>
  );

  const maxPredicted = Math.max(...forecast.timeline.map(d => d.predicted));

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in overflow-y-auto max-w-[1600px] mx-auto w-full">
       <header className="flex-row justify-between items-end">
          <div>
             <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Resource Intelligence</h1>
             <p className="text-on-surface-variant font-medium opacity-60">Forecasting Patient Surges & Clinical Load Requirements</p>
          </div>
          <div className="bg-primary/5 px-6 py-3 rounded-full border border-primary/20 flex-row items-center gap-3">
             <span className="material-symbols-outlined text-primary">auto_graph</span>
             <span className="text-xs font-black uppercase tracking-widest text-primary">{forecast.weeklyTrend} Accuracy</span>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 📈 SURGE FORECAST VISUALIZATION */}
          <div className="lg:col-span-8 flex-column gap-6">
             <ClinicalCard padding="2.5rem" className="bg-surface">
                <div className="flex-row justify-between items-center mb-10">
                   <h3 className="text-xl font-black uppercase tracking-tight">24h Patient Volume Forecast</h3>
                   <div className="flex-row gap-4">
                      <div className="flex-row items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-primary/20" />
                         <span className="text-[10px] font-bold opacity-40 uppercase">Baseline</span>
                      </div>
                      <div className="flex-row items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-primary" />
                         <span className="text-[10px] font-bold opacity-40 uppercase">AI Forecast</span>
                      </div>
                   </div>
                </div>

                <div className="h-[300px] w-full flex-row items-end gap-2 relative">
                   {forecast.timeline.map((data, i) => {
                      const height = (data.predicted / maxPredicted) * 100;
                      return (
                         <div key={i} className="flex-1 flex-column items-center group relative h-full justify-end">
                            {/* Forecast Bar */}
                            <div 
                               className={`w-full rounded-t-lg transition-all duration-1000 delay-${i * 50} 
                                 ${data.intensity === 'HIGH' ? 'bg-error shadow-lg shadow-error/20' : 'bg-primary/40 group-hover:bg-primary'}`}
                               style={{ height: `${height}%` }}
                            />
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface text-surface px-2 py-1 rounded text-[10px] font-black z-10 whitespace-nowrap">
                               {data.predicted} Patients
                            </div>
                            <span className="text-[8px] font-black opacity-20 uppercase mt-4 rotate-45 origin-left">
                               {data.hour}
                            </span>
                         </div>
                      );
                   })}
                </div>
             </ClinicalCard>

             <div className="grid grid-cols-3 gap-6">
                {Object.entries(ratios).map(([key, value]) => (
                   <ClinicalCard key={key} padding="1.5rem" className="bg-surface-container border-none flex-row justify-between items-center">
                      <div>
                         <p className="text-[8px] font-black uppercase opacity-40 mb-1">{key} Safety Ratio</p>
                         <p className="text-2xl font-black text-primary">{value}</p>
                      </div>
                      <span className="material-symbols-outlined opacity-10 text-3xl">verified_user</span>
                   </ClinicalCard>
                ))}
             </div>
          </div>

          {/* ⚡ ACTIONABLE OPTIMIZATION */}
          <div className="lg:col-span-4">
             <StaffingOptimizationCard recommendation={forecast.nextShiftRecommendation} />
             
             <div className="mt-8 flex-column gap-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Capacity Insights</h4>
                <div className="p-6 bg-surface-container rounded-[2rem] border border-outline-variant flex-column gap-3">
                   <div className="flex-row justify-between items-center">
                      <span className="text-xs font-bold uppercase">Weekend Surge Risk</span>
                      <span className="badge badge-error">MODERATE</span>
                   </div>
                   <div className="flex-row justify-between items-center">
                      <span className="text-xs font-bold uppercase">Discharge Throughput</span>
                      <span className="text-xs font-black text-success">+12% Efficient</span>
                   </div>
                   <p className="text-[10px] opacity-40 leading-relaxed mt-2 italic">
                      "Historical data suggests a 14% increase in respiratory cases during the upcoming night shift. Recommend stocking secondary oxygen units."
                   </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
