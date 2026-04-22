import React, { useState, useEffect } from 'react';
import { getHospitalKPIs, getJciComplianceOverview } from '../services/gld.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import '../styles/Executive.css';

const ExecutiveDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kpiData = await getHospitalKPIs();
        setKpis(kpiData);
        setCompliance(getJciComplianceOverview());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse opacity-20">Aggregating Institutional Data...</div>;

  return (
    <main className="executive-war-room">
      <header className="flex-row justify-between items-end mb-12">
        <div>
          <p className="subtitle m-0">GLD - Governance & Leadership</p>
          <h2 className="title text-6xl font-black tracking-tighter">Executive Command</h2>
        </div>
        <div className="flex-row gap-4">
           <div className="date-chip bg-surface-container border-outline-variant">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              <span className="text-[10px] font-black uppercase">JCI Audit-Ready</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Strategic KPIs */}
        <PresentationCard style={{ gridColumn: 'span 4' }} className="bg-primary text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8" />
           <span className="text-[10px] font-black uppercase tracking-widest opacity-60">JCI Compliance Index</span>
           <h3 className="text-8xl font-black mt-4">{kpis.quality_index}<small className="text-2xl">%</small></h3>
           <p className="text-[10px] font-bold uppercase mt-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Institutional Excellence
           </p>
        </PresentationCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }} className="flex-column justify-between border-t-8 border-error">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Safety Sentinel Events</span>
           <div className="flex-row items-baseline gap-4 mt-4">
              <h3 className="text-7xl font-black text-error">{kpis.patient_safety_events.sentinel}</h3>
              <p className="text-xs font-black uppercase text-error opacity-60">Critical Events</p>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant">
              <div>
                 <p className="text-[10px] font-black opacity-40 uppercase">Near Misses</p>
                 <p className="text-xl font-black">{kpis.patient_safety_events.near_miss}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black opacity-40 uppercase">Adverse Events</p>
                 <p className="text-xl font-black text-warning">{kpis.patient_safety_events.adverse}</p>
              </div>
           </div>
        </ClinicalCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }} className="flex-column justify-between">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Operational Efficiency</span>
           <div className="space-y-4 mt-6">
              <div className="flex-row justify-between border-b pb-2">
                 <span className="text-xs font-bold opacity-60">Avg. Bed Turnover</span>
                 <span className="text-sm font-black">{kpis.efficiency.avg_bed_turnover}</span>
              </div>
              <div className="flex-row justify-between border-b pb-2">
                 <span className="text-xs font-bold opacity-60">Theatre Utilization</span>
                 <span className="text-sm font-black text-primary">{kpis.efficiency.theatre_utilization}</span>
              </div>
              <div className="flex-row justify-between">
                 <span className="text-xs font-bold opacity-60">Revenue Trend</span>
                 <span className="text-sm font-black text-success">{kpis.financial_health.revenue_growth}</span>
              </div>
           </div>
        </ClinicalCard>

        {/* JCI Roadmap */}
        <div style={{ gridColumn: 'span 12' }} className="mt-8">
           <div className="flex-row justify-between items-center mb-8">
              <h4 className="text-2xl font-black tracking-tight uppercase">Chapter Compliance Roadmap</h4>
              <button className="btn-ghost text-[10px] font-black border border-outline-variant">Generate JCI Audit Export</button>
           </div>
           <div className="grid grid-cols-7 gap-4">
              {compliance.map(item => (
                 <div key={item.chapter} className="p-6 bg-surface-container rounded-3xl border border-outline-variant hover:border-primary transition-all">
                    <p className="text-[10px] font-black opacity-40 mb-2">{item.chapter}</p>
                    <h5 className="text-3xl font-black mb-4">{item.score}%</h5>
                    <span className={`chip chip-outline text-[8px] font-black uppercase tracking-widest ${item.status === 'PLATINUM' ? 'text-primary border-primary' : ''}`}>
                       {item.status}
                    </span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </main>
  );
};

export default ExecutiveDashboard;
