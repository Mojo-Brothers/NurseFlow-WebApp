import React, { useState, useEffect } from 'react';
import { listenToWardMetrics, listenToAlerts } from '../services/dashboard.service.js';
import { useTranslation } from 'react-i18next';
import { useConnectionStatus } from '../../../core/hooks/useConnectionStatus.js';
import { getTriageColor } from '../../../utils/clinicalCalculators.js'; // V5 Fix: Import color utility
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { isOnline, statusMessage } = useConnectionStatus();
  const [metrics, setMetrics] = useState({ occupancy: 0, avg_news_score: 0.0, staff_on_duty: 0 });
  const [alertsInfo, setAlertsInfo] = useState({ total: 0, highRiskCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  // V5 logic for Dashboard Color Coding
  const wardStatus = getTriageColor(metrics.avg_news_score);

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

      <div className="bento-grid">
        <div className="metrics-group">
          <div className="card metric-card border-primary-left">
            <div>
              <p className="metric-label">{t('dashboard.ward_occupancy')}</p>
              <h3 className="metric-value text-primary">{isLoading ? '--' : metrics.occupancy}%</h3>
            </div>
            <div className="flex-row items-center gap-2">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${isLoading ? 0 : metrics.occupancy}%` }}></div>
              </div>
              <span className="progress-text">{isOnline ? t('dashboard.live_sync') : t('dashboard.offline_cache')}</span>
            </div>
          </div>
          <div className="card metric-card">
            <div>
              <p className="metric-label">{t('dashboard.avg_news')}</p>
              <h3 className={`metric-value text-${wardStatus}`}>{isLoading ? '--' : metrics.avg_news_score}</h3>
            </div>
            <div className="flex-row items-center gap-1">
              <div className={`chip chip-${wardStatus}`}>
                {metrics.avg_news_score > 5 ? t('dashboard.critical') : t('dashboard.stable')}
              </div>
              <span className="progress-text">Ward average</span>
            </div>
          </div>
          <div className="card metric-card">
            <div>
              <p className="metric-label">{t('dashboard.staff_on_duty')}</p>
              <h3 className="metric-value">{isLoading ? '--' : String(metrics.staff_on_duty).padStart(2, '0')}</h3>
            </div>
            <div className="avatar-stack">
              <div className="avatar bg-1"></div>
              <div className="avatar bg-2"></div>
              <div className="avatar bg-3"></div>
              <div className="avatar bg-primary-container text-primary font-bold text-xs flex justify-center items-center">+3</div>
            </div>
          </div>
        </div>

        {/* --- EXCALATION SENTINEL (V5 Addition) --- */}
        <div className="card attention-card">
          <div className="attention-bg-icon">
            <span className="material-symbols-outlined text-huge">emergency_home</span>
          </div>
          <h3 className="attention-title">
            <span className="material-symbols-outlined icon-fill">notifications_active</span>
            {t('dashboard.escalations')}
          </h3>
          <div className="attention-list">
            <div className="attention-item">
              <span>{t('dashboard.critical')} (Bypass)</span>
              <span className={`badge ${alertsInfo.highRiskCount > 0 ? 'badge-error animate-pulse' : 'badge-outline'}`}>
                {String(alertsInfo.highRiskCount).padStart(2, '0')}
              </span>
            </div>
            <div className="attention-item">
              <span>{t('dashboard.urgent')} Response</span>
              <span className="badge badge-warning">
                {String(alertsInfo.total - alertsInfo.highRiskCount).padStart(2, '0')}
              </span>
            </div>
          </div>
          <button className="btn-full-error">
            {t('dashboard.bypass_triage')}
            <span className="material-symbols-outlined icon-small">bolt</span>
          </button>
        </div>

        <div className="card task-card">
          <div className="flex-row justify-between items-center mb-6">
            <h3 className="headline font-bold text-lg">{t('dashboard.handovers')}</h3>
            <button className="text-primary text-sm font-bold bg-transparent">{t('dashboard.view_logs')}</button>
          </div>
          <div className="task-list">
            <div className="task-item">
              <div className="icon-circle bg-primary-container text-primary">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
              <div className="task-details">
                <h4 className="font-bold text-sm m-0">Shift Transition</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-1">Ready for signature • 12 patients</p>
              </div>
              <div className="chip chip-outline">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
