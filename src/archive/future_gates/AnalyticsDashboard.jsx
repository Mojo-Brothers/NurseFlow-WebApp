/**
 * ARCHIVED FOR FUTURE GATE 1F.6 (Quality Indicators & Clinical Analytics)
 * Original: src/modules/dashboard/pages/AnalyticsDashboard.jsx
 */

import React, { useEffect, useState } from 'react';
import ClinicalCard from '../../components/ui/ClinicalCard';
import KPICard from '../../modules/dashboard/components/KPICard';
import { fetchHospitalKPIs, fetchWardOccupancy } from '../../core/services/analytics.service.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
      <div className="flex-row justify-between items-end mb-4 min-w-0">
         <div className="min-w-0">
            <h1 className="text-4xl font-black tracking-tighter text-on-surface uppercase mb-1 truncate">
               Hospital Performance Intelligence
            </h1>
            <p className="text-sm font-medium text-on-surface-variant opacity-60 truncate">
               Operational & Clinical Command Center • Real-time Data Sync
            </p>
         </div>
      </div>

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
    </div>
  );
}
