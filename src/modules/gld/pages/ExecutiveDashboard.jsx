import React, { useState, useEffect } from 'react';
import { getExecutiveKPIs, getRecentIncidents } from '../services/gld.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import KPICard from '../../dashboard/components/KPICard.jsx';
import { useAuth } from '../../../contexts/useAuth.js';
import '../styles/ExecutiveDashboard.css';

/**
 * ExecutiveDashboard — The Strategic Command Center (GLD).
 * High-density analytics for hospital leadership.
 */
export default function ExecutiveDashboard() {
  const { currentUser } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiData, incidentData] = await Promise.all([
          getExecutiveKPIs(),
          getRecentIncidents()
        ]);
        setKpis(kpiData);
        setIncidents(incidentData);
      } catch (err) {
        console.error('[ExecutiveDashboard] Load failure:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center opacity-50">Loading Strategic Data...</div>;

  return (
    <div className="gld-dashboard-container animate-fade-in">
      <header className="gld-header mb-12">
        <div className="flex-column">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
            Governance, Leadership, & Direction
          </span>
          <h1 className="text-5xl font-black tracking-tight leading-none">
            Executive Command <span className="text-primary">Center</span>
          </h1>
          <p className="opacity-40 mt-4 max-w-xl text-lg font-medium leading-relaxed">
            Real-time strategic oversight of hospital operations, safety metrics, and financial performance.
          </p>
        </div>
        <div className="gld-user-meta flex-row gap-6 items-center">
          <div className="text-right">
            <span className="block text-sm font-black uppercase tracking-widest">{currentUser?.displayName || 'Executive User'}</span>
            <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Hospital Administrator</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary-container flex-row items-center justify-center border-4 border-surface shadow-xl">
             <span className="material-symbols-outlined text-white text-3xl">shield_person</span>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="gld-kpi-grid mb-12">
        <KPICard 
          label="Bed Occupancy Rate" 
          value={kpis.bor} 
          unit="%" 
          trend="+4.2%" 
          icon="bed" 
          color="#005EB8" 
        />
        <KPICard 
          label="Patient Satisfaction" 
          value={kpis.satisfaction} 
          unit="/ 5.0" 
          trend="+0.1" 
          icon="sentiment_satisfied" 
          color="#008080" 
        />
        <KPICard 
          label="Safety Incidents" 
          value={kpis.incidentCount} 
          unit="ACTIVE" 
          trend="-12%" 
          icon="emergency_home" 
          color="#BA1A1A" 
        />
        <KPICard 
          label="Annual Revenue" 
          value={kpis.totalRevenue.replace('IDR', '')} 
          unit="IDR" 
          trend="+8.4%" 
          icon="payments" 
          color="#2E7D32" 
        />
      </section>

      <div className="gld-main-grid">
        {/* Left Column: Risk Management */}
        <div className="flex-column gap-6">
          <PresentationCard padding="2rem" height="100%">
            <div className="flex-row justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase tracking-widest">Recent Safety Incidents</h2>
              <button className="gld-action-btn flex-row items-center gap-2 px-4 py-2 rounded-full bg-error-container text-on-error-container text-xs font-black uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">warning</span> View All
              </button>
            </div>
            
            <div className="flex-column gap-4">
              {incidents.length > 0 ? incidents.map(incident => (
                <div key={incident.id} className="incident-row flex-row gap-4 p-4 rounded-2xl bg-surface-container-low border border-transparent hover:border-outline-variant transition-all cursor-pointer">
                  <div className={`w-2 rounded-full ${incident.severity === 'HIGH' ? 'bg-error' : 'bg-warning'}`} />
                  <div className="flex-column flex-1">
                    <span className="text-sm font-black tracking-tight">{incident.type}</span>
                    <span className="text-[10px] opacity-50 uppercase font-black">{incident.location} — {incident.reporterRole}</span>
                  </div>
                  <div className="flex-column items-end">
                    <span className="text-[10px] font-black opacity-30">{new Date(incident.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[9px] font-black uppercase tracking-widest mt-1">
                      {incident.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center p-12 opacity-30 border-2 border-dashed border-outline-variant rounded-3xl">
                  <span className="material-symbols-outlined text-4xl mb-4">check_circle</span>
                  <p className="text-sm font-bold uppercase tracking-widest">No active incidents reported</p>
                </div>
              )}
            </div>
          </PresentationCard>
        </div>

        {/* Right Column: Strategic Quality Tracker */}
        <div className="flex-column gap-6">
          <PresentationCard padding="2rem">
             <h2 className="text-xl font-black uppercase tracking-widest mb-8">JCI Quality Compliance</h2>
             <div className="flex-column gap-6">
                <div className="quality-metric">
                  <div className="flex-row justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest">Patient Safety Goals</span>
                    <span className="text-xs font-black text-primary">94%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '94%' }} />
                  </div>
                </div>
                <div className="quality-metric">
                  <div className="flex-row justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest">Medication Accuracy</span>
                    <span className="text-xs font-black text-success">98.2%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: '98.2%' }} />
                  </div>
                </div>
                <div className="quality-metric">
                  <div className="flex-row justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest">Documentation Compliance</span>
                    <span className="text-xs font-black text-warning">87%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: '87%' }} />
                  </div>
                </div>
             </div>
          </PresentationCard>

          <PresentationCard padding="2rem" className="bg-primary text-white" style={{ background: 'linear-gradient(135deg, #00478d, #005eb8)' }}>
             <h2 className="text-xl font-black uppercase tracking-widest mb-2">Facility Insights</h2>
             <p className="text-xs opacity-70 mb-6">Aggregate performance across all departments.</p>
             <div className="flex-row gap-4">
                <div className="flex-column flex-1 p-4 rounded-2xl bg-on-surface/5 backdrop-blur-md border border-on-surface/10">
                   <span className="text-2xl font-black leading-none mb-1">12</span>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Active ORs</span>
                </div>
                <div className="flex-column flex-1 p-4 rounded-2xl bg-on-surface/5 backdrop-blur-md border border-on-surface/10">
                   <span className="text-2xl font-black leading-none mb-1">84%</span>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Staff Util</span>
                </div>
             </div>
          </PresentationCard>
        </div>
      </div>
    </div>
  );
}
