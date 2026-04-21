import React, { useState, useEffect } from 'react';
import { listenToWardMetrics, listenToAlerts } from '../services/dashboard.service.js';
import { useTranslation } from 'react-i18next';
import { useConnectionStatus } from '../../../core/hooks/useConnectionStatus.js';
import { getTriageColor } from '../../../utils/clinicalCalculators.js'; // V5 Fix: Import color utility
import '../styles/Dashboard.css';

import { useAuth } from '../../../contexts/useAuth.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { isOnline, statusMessage } = useConnectionStatus();
  const { currentUser, isLoading: authLoading } = useAuth();
  
  const [metrics, setMetrics] = useState({ occupancy: 0, avg_news_score: 0.0, staff_on_duty: 0 });
  const [alertsInfo, setAlertsInfo] = useState({ total: 0, highRiskCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🔥 Resilience Guard: Don't start listeners until Auth is settled
    if (authLoading || !currentUser) return;

    console.log('[Dashboard] Starting Clinical Listeners (Sentinel Active)');
    
    const unsubscribeMetrics = listenToWardMetrics('central_medical', (data) => {
      if (data) {
        setMetrics(data);
        setIsLoading(false);
      }
    });

    const unsubscribeAlerts = listenToAlerts((data) => {
      setAlertsInfo(data);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, [authLoading, currentUser]);

  // V5 logic for Dashboard Color Coding
  const wardStatus = getTriageColor(metrics.avg_news_score);

  if (authLoading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <main className="dashboard-main">
      {!isOnline && (
        <div className="bg-error text-on-error p-2 text-center text-xs font-bold animate-pulse" style={{ marginBottom: '1rem', borderRadius: '4px' }}>
           {statusMessage}
        </div>
      )}
      
      <section className="editorial-header">
        <div className="flex-row justify-between items-baseline flex-wrap gap-4">
          <div>
            <div className="flex-row items-center gap-2">
              <p className="subtitle m-0">{t('dashboard.overview')}</p>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`}></span>
            </div>
            <h2 className="title">NurseFlow</h2>
          </div>
          <div className="date-chip">
            <span className="material-symbols-outlined icon-small text-primary">calendar_today</span>
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} • 2026 Shift</span>
          </div>
        </div>
      </section>

      <div className="bento-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)', 
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {/* --- Hero Metric: Ward Occupancy --- */}
        <PresentationCard style={{ gridColumn: 'span 4', height: '14rem', padding: '1.5rem', justifyContent: 'space-between' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 m-0">{t('dashboard.ward_occupancy')}</span>
            <h3 className="text-5xl font-black text-primary tabular-nums m-0 mt-2">{isLoading ? '--' : metrics.occupancy}<small className="text-xl">%</small></h3>
          </div>
          <div className="w-full">
            <div className="progress-bar-bg" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <div className="progress-bar-fill" style={{ width: `${isLoading ? 0 : metrics.occupancy}%`, background: 'var(--primary)' }}></div>
            </div>
            <p className="text-[9px] font-bold uppercase mt-3 opacity-60 tracking-tight">{isOnline ? t('dashboard.live_sync') : t('dashboard.offline_cache')}</p>
          </div>
        </PresentationCard>

        {/* --- Critical Intelligence: NEWS2 --- */}
        <ClinicalCard style={{ gridColumn: 'span 4', height: '14rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: `6px solid var(--status-${wardStatus})` }}>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('dashboard.avg_news')}</span>
          <div className={`text-6xl font-black text-${wardStatus} tabular-nums my-2`}>{isLoading ? '--' : metrics.avg_news_score}</div>
          <div className={`chip chip-${wardStatus} font-black px-4 py-1 rounded-full text-[10px]`}>
            {metrics.avg_news_score > 5 ? t('dashboard.critical') : t('dashboard.stable')}
          </div>
        </ClinicalCard>

        {/* --- Team Presence --- */}
        <PresentationCard style={{ gridColumn: 'span 4', height: '14rem', padding: '1.5rem', justifyContent: 'space-between' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('dashboard.staff_on_duty')}</span>
            <h3 className="text-4xl font-black m-0 mt-2 tabular-nums">{isLoading ? '--' : String(metrics.staff_on_duty).padStart(2, '0')}</h3>
          </div>
          <div className="avatar-stack" style={{ marginBottom: '0.5rem' }}>
            <div className="avatar bg-1" style={{ width: '42px', height: '42px', border: '3px solid white' }}></div>
            <div className="avatar bg-2" style={{ width: '42px', height: '42px', border: '3px solid white' }}></div>
            <div className="avatar bg-3" style={{ width: '42px', height: '42px', border: '3px solid white' }}></div>
            <div className="avatar text-primary font-black text-xs flex justify-center items-center" style={{ width: '42px', height: '42px', border: '3px solid white', backgroundColor: 'var(--primary-container)', borderRadius: '50%' }}>+3</div>
          </div>
        </PresentationCard>

        {/* --- EXCALATION SENTINEL (The Anchor) --- */}
        <ClinicalCard style={{ gridColumn: 'span 5', minHeight: '18rem', padding: '2rem', position: 'relative', overflow: 'hidden', background: '#ba1a1a', color: 'white', border: 'none' }}>
           <div style={{ position: 'absolute', right: '-2rem', bottom: '-2rem', opacity: 0.1, transform: 'rotate(-15deg)' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '12rem' }}>emergency</span>
           </div>
           <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter mb-8">
             <span className="material-symbols-outlined">notifications_active</span>
             {t('dashboard.escalations')}
           </h3>
           <div className="attention-list" style={{ gap: '1rem' }}>
             <div className="attention-item" style={{ background: 'rgba(255,255,255,0.15)', padding: '1.25rem', borderRadius: '12px' }}>
               <span className="font-bold">{t('dashboard.critical')} (Bypass)</span>
               <span className={`badge ${alertsInfo.highRiskCount > 0 ? 'badge-error animate-pulse' : 'badge-outline'}`} style={{ backgroundColor: alertsInfo.highRiskCount > 0 ? 'white' : 'transparent', color: alertsInfo.highRiskCount > 0 ? '#ba1a1a' : 'white', border: '1px solid white' }}>
                 {String(alertsInfo.highRiskCount).padStart(2, '0')}
               </span>
             </div>
             <div className="attention-item" style={{ background: 'rgba(255,255,255,0.1)', padding: '1.25rem', borderRadius: '12px' }}>
               <span className="font-bold">{t('dashboard.urgent')} Response</span>
               <span className="badge badge-warning" style={{ backgroundColor: '#ff9800', color: 'white' }}>
                 {String(alertsInfo.total - alertsInfo.highRiskCount).padStart(2, '0')}
               </span>
             </div>
           </div>
           <button className="btn-primary" style={{ width: '100%', marginTop: '2rem', backgroundColor: 'white', color: '#ba1a1a', boxShadow: 'none' }}>
             {t('dashboard.bypass_triage')}
             <span className="material-symbols-outlined ml-2">bolt</span>
           </button>
        </ClinicalCard>

        {/* --- Clinical Tasks & Continuity --- */}
        <ClinicalCard style={{ gridColumn: 'span 7', minHeight: '18rem', padding: '2rem' }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight m-0">{t('dashboard.handovers')}</h3>
            <button className="text-primary text-xs font-bold uppercase tracking-widest">{t('dashboard.view_logs')}</button>
          </div>
          <div className="task-list">
            <ClinicalCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--border-clinical)', boxShadow: 'none', background: 'var(--surface-container-low)' }}>
              <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="font-bold text-sm m-0">Shift Transition</h4>
                <p className="text-[10px] text-on-surface-variant m-0 mt-1 font-medium">Ready for signature • 12 patients</p>
              </div>
              <div className="chip chip-outline font-black text-[9px] opacity-60">PENDING</div>
            </ClinicalCard>
          </div>
        </ClinicalCard>
      </div>
    </main>
  );
};

export default DashboardPage;
