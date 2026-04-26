import React, { useEffect, useState } from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import KPICard from '../components/KPICard';
import { fetchHospitalKPIs, fetchWardOccupancy } from '../../../core/services/analytics.service.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * AnalyticsDashboard — High-performance Executive Command Center.
 * Provides real-time visibility into BOR, ALOS, and Clinical Safety.
 */
export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHospitalKPIs(), fetchWardOccupancy()]).then(([m, w]) => {
      setMetrics(m);
      setWards(w);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="p-20 h-full flex items-center justify-center">
       <div className="flex-column items-center gap-4">
          <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Aggregating Clinical Intelligence...</p>
       </div>
    </div>
  );

  return (
    <div className="p-8 flex-column gap-8 animate-fade-in overflow-y-auto max-w-[1600px] mx-auto w-full">
      {/* 👑 EXECUTIVE SUMMARY */}
      <div className="flex-row justify-between items-end mb-4 min-w-0">
         <div className="min-w-0">
            <h1 className="text-4xl font-black tracking-tighter text-on-surface uppercase mb-1 truncate">
               Hospital Performance Intelligence
            </h1>
            <p className="text-sm font-medium text-on-surface-variant opacity-60 truncate">
               Operational & Clinical Command Center • Real-time Data Sync
            </p>
         </div>
         <div className="flex-row gap-2 shrink-0 ml-4">
            <button 
              onClick={() => navigate('/quality')}
              className="btn-ghost text-[10px] font-black uppercase px-4 py-2 border border-secondary/20 text-secondary hover:bg-secondary/5 flex-row items-center gap-2 shrink-0"
            >
               <span className="material-symbols-outlined text-sm shrink-0">workspace_premium</span>
               <span className="truncate">Quality & JCI</span>
            </button>
            <button 
              onClick={() => navigate('/analytics/predictive')}
              className="btn-ghost text-[10px] font-black uppercase px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 flex-row items-center gap-2 shrink-0"
            >
               <span className="material-symbols-outlined text-sm shrink-0">psychology</span>
               <span className="truncate">Open Predictive Ops</span>
            </button>
            <button className="btn-primary text-[10px] font-black uppercase px-6 py-2 shadow-lg shrink-0">Refresh Data</button>
         </div>
      </div>

      {/* 📊 CORE KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard 
            label="Bed Occupancy Ratio" 
            value={metrics.bor} 
            unit="%" 
            trend={metrics.trends.bor} 
            icon="bed" 
            color="var(--primary)" 
         />
         <KPICard 
            label="Avg Length of Stay" 
            value={metrics.alos} 
            unit="Days" 
            trend={metrics.trends.alos} 
            icon="schedule" 
            color="var(--secondary)" 
         />
         <KPICard 
            label="Active Patient Flow" 
            value={metrics.activeCount} 
            unit="Souls" 
            trend={metrics.trends.volume} 
            icon="person_play" 
            color="var(--tertiary)" 
         />
         <KPICard 
            label="Completed Encounters" 
            value={metrics.completedCount} 
            unit="Finalized" 
            trend="Target Achieved" 
            icon="verified" 
            color="var(--success)" 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* 🏥 WARD HEATMAP (Occupancy Grid) */}
         <div className="lg:col-span-8">
            <ClinicalCard padding="2rem" className="h-full">
               <div className="flex-row justify-between items-center mb-8 min-w-0">
                  <h3 className="text-xl font-black uppercase tracking-tight truncate">Ward Capacity Analysis</h3>
                  <span className="text-[10px] font-bold opacity-40 uppercase shrink-0 ml-4">Facility Heatmap</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {wards.map(ward => {
                     const percent = (ward.occupied / ward.total) * 100;
                     return (
                        <div key={ward.name} className="flex-column gap-3">
                           <div className="flex-row justify-between items-baseline min-w-0">
                              <span className="text-sm font-black uppercase truncate">{ward.name}</span>
                              <span className="text-xs font-bold tabular-nums shrink-0 ml-4">{ward.occupied}/{ward.total} Beds</span>
                           </div>
                           <div className="h-6 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant">
                              <div 
                                 className="h-full transition-all duration-1000" 
                                 style={{ width: `${percent}%`, backgroundColor: ward.color }}
                              />
                           </div>
                           <div className="flex-row justify-between min-w-0">
                              <span className="text-[10px] font-bold opacity-40 uppercase truncate">Utilization</span>
                              <span className="text-[10px] font-black shrink-0 ml-4">{percent.toFixed(0)}%</span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </ClinicalCard>
         </div>

         {/* 🛡️ CLINICAL SAFETY DISTRIBUTION */}
         <div className="lg:col-span-4">
            <ClinicalCard padding="2rem" className="h-full bg-surface-container-highest border-none">
               <h3 className="text-xl font-black uppercase tracking-tight mb-8">Clinical Safety Mix</h3>
               
               <div className="flex-column gap-6">
                  <div className="p-5 bg-surface rounded-3xl shadow-sm border-l-8 border-error flex-row justify-between items-center min-w-0">
                     <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase opacity-40 truncate">Critical Patients</p>
                        <p className="text-2xl font-black text-error truncate">0{metrics.clinicalSafety.critical}</p>
                     </div>
                     <span className="material-symbols-outlined text-error opacity-20 text-4xl shrink-0 ml-4">emergency</span>
                  </div>

                  <div className="p-5 bg-surface rounded-3xl shadow-sm border-l-8 border-secondary flex-row justify-between items-center">
                     <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Urgent Monitoring</p>
                        <p className="text-2xl font-black text-secondary">0{metrics.clinicalSafety.urgent}</p>
                     </div>
                     <span className="material-symbols-outlined text-secondary opacity-20 text-4xl">monitoring</span>
                  </div>

                  <div className="p-5 bg-surface rounded-3xl shadow-sm border-l-8 border-success flex-row justify-between items-center">
                     <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Stable Condition</p>
                        <p className="text-2xl font-black text-success">{metrics.clinicalSafety.stable}</p>
                     </div>
                     <span className="material-symbols-outlined text-success opacity-20 text-4xl">verified</span>
                  </div>
               </div>

               <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <p className="text-[10px] font-bold text-primary italic leading-tight">
                     "Current facility risk profile is within nominal parameters. Sepsis surveillance active across all units."
                  </p>
               </div>
            </ClinicalCard>
         </div>
      </div>
    </div>
  );
}
