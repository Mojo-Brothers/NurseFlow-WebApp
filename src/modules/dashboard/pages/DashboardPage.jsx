import React, { useState, useEffect } from 'react';
import { listenToWardMetrics, listenToAlerts } from '../services/dashboard.service.js';
import '../styles/Dashboard.css';

const DashboardPage = () => {
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

  return (
    <main className="dashboard-main">
      <section className="editorial-header">
        <div className="flex-row justify-between items-baseline flex-wrap gap-4">
          <div>
            <p className="subtitle">Clinical Overview</p>
            <h2 className="title">NurseFlow</h2>
          </div>
          <div className="date-chip">
            <span className="material-symbols-outlined icon-small text-primary">calendar_today</span>
            <span>Wednesday, 24 May • Morning Shift</span>
          </div>
        </div>
      </section>

      <div className="bento-grid">
        <div className="metrics-group">
          <div className="card metric-card border-primary-left">
            <div>
              <p className="metric-label">Ward Occupancy</p>
              <h3 className="metric-value text-primary">{isLoading ? '--' : metrics.occupancy}%</h3>
            </div>
            <div className="flex-row items-center gap-2">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${isLoading ? 0 : metrics.occupancy}%` }}></div>
              </div>
              <span className="progress-text">Live Sync</span>
            </div>
          </div>
          <div className="card metric-card">
            <div>
              <p className="metric-label">Avg. NEWS2 Score</p>
              <h3 className="metric-value">{isLoading ? '--' : metrics.avg_news_score}</h3>
            </div>
            <div className="flex-row items-center gap-1">
              <div className="chip chip-success">Stable</div>
              <span className="progress-text">Ward average</span>
            </div>
          </div>
          <div className="card metric-card">
            <div>
              <p className="metric-label">Staff on Duty</p>
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

        <div className="card attention-card">
          <div className="attention-bg-icon">
            <span className="material-symbols-outlined text-huge">notification_important</span>
          </div>
          <h3 className="attention-title">
            <span className="material-symbols-outlined icon-fill">warning</span>
            Immediate Attention
          </h3>
          <div className="attention-list">
            <div className="attention-item">
              <span>High Risk Patients</span>
              <span className="badge badge-error">{isLoading ? '0' : String(alertsInfo.highRiskCount).padStart(2, '0')}</span>
            </div>
            <div className="attention-item semi-transparent">
              <span>Moderate Risk</span>
              <span className="badge badge-warning">05</span>
            </div>
          </div>
          <button className="btn-full-error">
            Review Triage
            <span className="material-symbols-outlined icon-small">arrow_forward</span>
          </button>
        </div>

        <div className="card task-card">
          <div className="flex-row justify-between items-center mb-6">
            <h3 className="headline font-bold text-lg">Task & Handover Status</h3>
            <button className="text-primary text-sm font-bold bg-transparent">View All</button>
          </div>
          <div className="task-list">
            <div className="task-item">
              <div className="icon-circle bg-error-container text-error">
                <span className="material-symbols-outlined">emergency</span>
              </div>
              <div className="task-details">
                <h4 className="font-bold text-sm m-0">Urgent ECG: Bed 12-A</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-1">Assigned to: Nurse J. Doe • 15m ago</p>
              </div>
              <div className="chip chip-error">Overdue</div>
            </div>
            {/* Shortened for brevity in migration */}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
