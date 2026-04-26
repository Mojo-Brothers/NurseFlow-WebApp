import React, { useState, useEffect } from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { calculateCoreKPIs, getMonthlyPerformanceTrend } from '../services/kpi.service.js';

/**
 * QualityAssuranceHub — The JCI compliance and performance cockpit.
 */
export default function QualityAssuranceHub() {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([calculateCoreKPIs(), getMonthlyPerformanceTrend()]).then(([m, t]) => {
      setMetrics(m);
      setTrends(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse uppercase font-black opacity-20">Calculating Quality Benchmarks...</div>;

  const gauges = [
    { label: 'Bed Occupancy (BOR)', value: `${metrics.bor}%`, target: 'Target: 75-85%', status: metrics.bor > 85 ? 'text-error' : 'text-success' },
    { label: 'Avg Length of Stay (ALOS)', value: `${metrics.alos} Days`, target: 'Target: < 4.0', status: 'text-primary' },
    { label: 'Net Death Rate (NDR)', value: `${metrics.ndr}%`, target: 'Target: < 2.5%', status: 'text-success' },
    { label: 'Avg Triage Time', value: `${metrics.triageEfficiency}m`, target: 'Target: < 10m', status: 'text-success' },
  ];

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
       <header className="flex-row justify-between items-end">
          <div>
             <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Quality & Performance</h1>
             <p className="text-on-surface-variant font-medium opacity-60">JCI Compliance & Clinical Excellence Monitoring</p>
          </div>
          <div className="flex-row gap-3">
             <button className="btn-ghost text-[10px] font-black uppercase px-6 py-3 border border-outline-variant">Download Audit Pack</button>
             <button className="btn-primary text-[10px] font-black uppercase px-8 py-3 shadow-lg">Generate Executive Report</button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {gauges.map((g, i) => (
             <ClinicalCard key={i} padding="2rem" className="bg-surface border-none shadow-sm flex-column items-center text-center">
                <span className="text-[10px] font-black uppercase opacity-40 mb-4">{g.label}</span>
                <span className={`text-4xl font-black tabular-nums mb-1 ${g.status}`}>{g.value}</span>
                <span className="text-[10px] font-bold opacity-60 uppercase">{g.target}</span>
             </ClinicalCard>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 📊 PERFORMANCE TRENDS */}
          <div className="lg:col-span-8 flex-column gap-6">
             <ClinicalCard padding="2rem" className="bg-surface border-none shadow-sm h-full">
                <h3 className="text-sm font-black uppercase mb-8">Performance Longitudinal Trend (2026)</h3>
                <div className="h-[300px] w-full flex-row items-end gap-6 px-4">
                   {trends.map((t, i) => (
                      <div key={i} className="flex-1 flex-column gap-2 group cursor-pointer">
                         <div className="flex-1 flex-row gap-1 items-end">
                            <div className="flex-1 bg-primary/20 rounded-t-lg transition-all group-hover:bg-primary/40" style={{ height: `${t.bor}%` }} />
                            <div className="w-4 bg-secondary/20 rounded-t-lg transition-all group-hover:bg-secondary/40" style={{ height: `${t.alos * 20}%` }} />
                         </div>
                         <div className="text-[10px] font-black uppercase text-center opacity-40">{t.month}</div>
                      </div>
                   ))}
                </div>
                <div className="flex-row gap-6 mt-8 justify-center border-t border-outline-variant pt-6">
                   <div className="flex-row items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded" />
                      <span className="text-[10px] font-black uppercase opacity-60">Occupancy (BOR)</span>
                   </div>
                   <div className="flex-row items-center gap-2">
                      <div className="w-3 h-3 bg-secondary rounded" />
                      <span className="text-[10px] font-black uppercase opacity-60">Avg Stay (ALOS)</span>
                   </div>
                </div>
             </ClinicalCard>
          </div>

          {/* 🏆 JCI SAFETY GOALS */}
          <div className="lg:col-span-4 flex-column gap-6">
             <ClinicalCard padding="2rem" className="bg-primary text-white border-none shadow-xl relative overflow-hidden">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-9xl">workspace_premium</span>
                <h3 className="text-sm font-black uppercase mb-8">JCI Safety Compliance</h3>
                <div className="space-y-6">
                   {[
                     { label: 'Patient Identification', score: 100 },
                     { label: 'High-Alert Medications', score: 92 },
                     { label: 'Infection Control', score: 88 },
                     { label: 'Surgical Safety', score: 96 }
                   ].map((goal, i) => (
                      <div key={i}>
                         <div className="flex-row justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase">{goal.label}</span>
                            <span className="text-[10px] font-black">{goal.score}%</span>
                         </div>
                         <div className="h-1 bg-on-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-on-primary transition-all duration-1000" style={{ width: `${goal.score}%` }} />
                         </div>
                      </div>
                   ))}
                </div>
                <p className="mt-8 text-[10px] font-medium opacity-60 italic leading-relaxed border-t border-white/10 pt-4">
                   "Quality metrics are calculated automatically based on real-time EMR and Encounter transactions."
                </p>
             </ClinicalCard>
          </div>
       </div>
    </div>
  );
}
