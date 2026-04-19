import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
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
        {/* Operational Metrics */}
        <div className="metrics-group">
          {/* Occupancy */}
          <div className="card metric-card border-primary-left">
            <div>
              <p className="metric-label">Ward Occupancy</p>
              <h3 className="metric-value text-primary">88%</h3>
            </div>
            <div className="flex-row items-center gap-2">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '88%' }}></div>
              </div>
              <span className="progress-text">22/25</span>
            </div>
          </div>

          {/* NEWS2 Score */}
          <div className="card metric-card">
            <div>
              <p className="metric-label">Avg. NEWS2 Score</p>
              <h3 className="metric-value">1.4</h3>
            </div>
            <div className="flex-row items-center gap-1">
              <div className="chip chip-success">Stable</div>
              <span className="progress-text">Ward average</span>
            </div>
          </div>

          {/* Staff on Duty */}
          <div className="card metric-card">
            <div>
              <p className="metric-label">Staff on Duty</p>
              <h3 className="metric-value">06</h3>
            </div>
            <div className="avatar-stack">
              <div className="avatar bg-1"></div>
              <div className="avatar bg-2"></div>
              <div className="avatar bg-3"></div>
              <div className="avatar bg-primary-container text-primary font-bold text-xs flex justify-center items-center">+3</div>
            </div>
          </div>
        </div>

        {/* Immediate Attention Card */}
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
              <span className="badge badge-error">02</span>
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

        {/* Task & Handover Status */}
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

            <div className="task-item">
              <div className="icon-circle bg-primary-fixed text-primary">
                <span className="material-symbols-outlined">swap_horiz</span>
              </div>
              <div className="task-details">
                <h4 className="font-bold text-sm m-0">Night Shift Handover Report</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-1">Pending completion by Charge Nurse</p>
              </div>
              <div className="chip chip-primary">Draft</div>
            </div>

            <div className="task-item">
              <div className="icon-circle bg-surface-highest text-on-surface-variant">
                <span className="material-symbols-outlined">medication</span>
              </div>
              <div className="task-details">
                <h4 className="font-bold text-sm m-0">Mid-day Medication Round</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-1">0/22 Patients Completed</p>
              </div>
              <div className="text-xs font-bold text-on-surface-variant">12:00 PM</div>
            </div>
          </div>
        </div>

        {/* Resource Overview */}
        <div className="resource-group">
          {/* Device Availability */}
          <div className="card">
            <h3 className="headline font-bold text-lg mb-4">Device Availability</h3>
            <div className="device-grid">
              <div className="device-item">
                <span className="material-symbols-outlined text-primary mb-2">monitor_heart</span>
                <p className="device-label">ECG Units</p>
                <p className="text-xl font-bold m-0">03/05</p>
              </div>
              <div className="device-item">
                <span className="material-symbols-outlined text-primary mb-2">vital_signs</span>
                <p className="device-label">Ventilators</p>
                <p className="text-xl font-bold text-error m-0">01/10</p>
              </div>
            </div>
          </div>

          {/* Bed Management */}
          <div className="bed-management-card">
            <div className="bg-decor"></div>
            <div>
              <p className="bed-subtitle">Available Beds</p>
              <div className="flex-row items-baseline gap-2">
                <span className="text-4xl font-extrabold m-0">03</span>
                <span className="text-sm font-bold opacity-80">Reserved: 01</span>
              </div>
            </div>
            <button className="btn-white">Manage Beds</button>
          </div>
        </div>
      </div>

      <section className="timeline-section">
        <h3 className="headline font-bold text-lg mb-4">NEWS2 Trend Distribution</h3>
        <div className="card flex-row justify-between items-center bg-surface-low gap-4 flex-wrap">
          <div className="trend-item">
            <div className="trend-circle circle-green">12</div>
            <div>
              <p className="trend-label">Low Risk</p>
              <p className="trend-sub">Stable Ward</p>
            </div>
          </div>
          <div className="divider"></div>
          <div className="trend-item">
            <div className="trend-circle circle-yellow">06</div>
            <div>
              <p className="trend-label">Monitoring</p>
              <p className="trend-sub">4-hr Observation</p>
            </div>
          </div>
          <div className="divider"></div>
          <div className="trend-item">
            <div className="trend-circle circle-red">04</div>
            <div>
              <p className="trend-label">Escalated</p>
              <p className="trend-sub">Active Triage</p>
            </div>
          </div>
          <div className="vital-stream">
            <div className="stream-bars">
              <div className="bar bar-green h-2"></div>
              <div className="bar bar-green h-3"></div>
              <div className="bar bar-green h-5"></div>
              <div className="bar bar-yellow h-4"></div>
              <div className="bar bar-red h-6"></div>
              <div className="bar bar-yellow h-3"></div>
              <div className="bar bar-green h-4"></div>
            </div>
            <span className="stream-label">Live Vital Stream</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
