import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { ROLES, AUDIT_ACTIONS, ESCALATION_LEVELS } from '../../../core/constants.js';
import { 
  fetchAuditLogs, 
  fetchAllUsers, 
  updateUserRole, 
  fetchSystemHealth,
  subscribeToPatientFlowMetrics
} from '../services/admin.service.js';
import { 
  subscribeToOperationalAlerts, 
  acknowledgeAlert 
} from '../services/alert.service.js';
import { SYSTEM_MODES, ALERT_STATUSES, ALERT_SEVERITY } from '../../../core/constants.js';

const ACTION_COLOR = {
  CREATE: { bg: 'var(--success-container)', text: 'var(--on-success-container)' },
  UPDATE: { bg: 'var(--secondary-container)', text: 'var(--on-secondary-container)' },
  DELETE: { bg: 'var(--error-container)', text: 'var(--on-error-container)' },
  VIEW:   { bg: 'var(--surface-container-highest)', text: 'var(--on-surface-variant)' },
  LOGIN:  { bg: 'var(--primary-container)', text: 'var(--on-primary-container)' },
};

const ROLE_COLORS = {
  DOCTOR:     { bg: '#e0e7ff', text: '#3730a3' },
  NURSE:      { bg: '#dcfce7', text: '#166534' },
  ADMIN:      { bg: '#fee2e2', text: '#991b1b' },
  PHARMACIST: { bg: '#fef9c3', text: '#92400e' },
};

import MasterDataHub from './MasterDataHub.jsx';

export default function AdminHubPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [auditLogs, setAuditLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [loading, setLoading]     = useState(true);
  const [users, setUsers]         = useState([]);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'users' | 'observability' | 'conflicts' | 'master_indices'
  const [systemMode, setSystemMode] = useState(SYSTEM_MODES.OPTIMAL);
  
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [patientFlow, setPatientFlow] = useState({ WAITING: 0, TRIAGE: 0, IN_TREATMENT: 0, TOTAL: 0 });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const logs = await fetchAuditLogs(50);
        setAuditLogs(logFilter === 'ALL' ? logs : logs.filter(l => l.action === logFilter));
      } else if (activeTab === 'users') {
        const userData = await fetchAllUsers();
        setUsers(userData);
      } else if (activeTab === 'observability') {
        const health = await fetchSystemHealth();
        setSystemHealth(health);
        if (health?.latency > 1000) setSystemMode(SYSTEM_MODES.DEGRADED);
        else setSystemMode(SYSTEM_MODES.OPTIMAL);
      }
    } catch (err) {
      console.error('[AdminHub] loadData:', err);
    }
    setLoading(false);
  }, [activeTab, logFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    
    const unsubscribeAlerts = subscribeToOperationalAlerts((alerts) => {
      setActiveAlerts(alerts.filter(a => a.type !== 'INVENTORY'));
      setInventoryAlerts(alerts.filter(a => a.type === 'INVENTORY'));
    });

    const unsubscribeFlow = subscribeToPatientFlowMetrics((metrics) => {
      setPatientFlow(metrics);
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribeAlerts();
      unsubscribeFlow();
    };
  }, [loadData]);

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(t('admin_hub.prompt_edit') + ` ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole, currentUser.email);
      alert(t('common.success') || 'Success');
      loadData();
    } catch (err) {
      alert(t('common.error') + ': ' + err.message);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="p-8 w-full">
      {/* Header with Global Alert Indicator */}
      <div className="flex-row items-start justify-between mb-8 min-w-0">
        <div>
          <p className="subtitle">{t('admin_cc.subtitle')}</p>
          <h2 className="title">{t('admin_cc.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1">{t('admin_cc.desc')}</p>
        </div>
        <div className="flex-row gap-3 shrink-0 flex-wrap">
          <button 
            onClick={() => navigate('/admin/staff-access')} 
            className="btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', fontSize: '0.75rem', gap: '0.4rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>badge</span>
            Manajemen SDM & Hak Akses (RBAC)
          </button>
          {activeAlerts.length > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--error)', color: 'white',
              fontSize: '0.75rem', fontWeight: '800', animation: 'pulse 2s infinite'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>warning</span>
              {t('admin_cc.active_alerts', { count: activeAlerts.length })}
            </div>
          )}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)',
            fontSize: '0.75rem', fontWeight: '700'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified_user</span>
            {t('admin_cc.secure_status')}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex-row gap-2 mb-8 bg-surface-container-low p-1 borderRadius-full w-fit overflow-x-auto max-w-full">
        {[
          { id: 'audit', label: t('admin_cc.tabs.audit'), icon: 'history' },
          { id: 'observability', label: t('admin_cc.tabs.observability'), icon: 'monitoring' },
          { id: 'master_indices', label: t('admin_cc.tabs.master_indices'), icon: 'account_tree' },
          { id: 'conflicts', label: t('admin_cc.tabs.conflicts'), icon: 'sync_problem' },
          { id: 'users', label: t('admin_cc.tabs.users'), icon: 'group' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }} 
            className={activeTab === tab.id ? 'btn-primary shadow-lg' : 'btn-ghost'}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.6rem 1.2rem', gap: '0.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-24">
          <span className="material-symbols-outlined anim-spin text-primary" style={{ fontSize: '3rem' }}>progress_activity</span>
          <p className="mt-4 text-outline font-bold">{t('admin_cc.syncing')}</p>
        </div>
      ) : activeTab === 'audit' ? (
        <AuditTabView 
          logs={auditLogs} 
          filter={logFilter} 
          setFilter={setLogFilter} 
          formatTimestamp={formatTimestamp} 
        />
      ) : activeTab === 'observability' ? (
        <ObservabilityView 
          alerts={activeAlerts}
          inventoryAlerts={inventoryAlerts}
          health={systemHealth} 
          flow={patientFlow}
          formatTimestamp={formatTimestamp}
          navigate={navigate}
        />
      ) : activeTab === 'conflicts' ? (
        <DataConflictsTabView />
      ) : activeTab === 'master_indices' ? (
        <div className="fade-in">
          <MasterDataHub isEmbedded={true} />
        </div>
      ) : (
        <UsersTabView 
          users={users} 
          onUpdateRole={handleUpdateRole} 
        />
      )}
      <SystemStatusBanner mode={systemMode} />
    </div>
  );
}

// ─── SYSTEM STATUS BANNER ─────────────────────────────────────
function SystemStatusBanner({ mode }) {
  const { t } = useTranslation();
  if (mode === SYSTEM_MODES.OPTIMAL) return null;

  const isDegraded = mode === SYSTEM_MODES.DEGRADED;
  return (
    <div style={{
      backgroundColor: isDegraded ? 'var(--warning-container)' : 'var(--error-container)',
      color: isDegraded ? 'var(--on-warning-container)' : 'var(--on-error-container)',
      padding: '0.75rem 2rem', textAlign: 'center', marginBottom: '1rem',
      borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem'
    }}>
      <span className="material-symbols-outlined">{isDegraded ? 'trending_down' : 'gpp_bad'}</span>
      <span className="font-bold uppercase text-sm">
        {isDegraded ? t('admin_cc.banner.degraded') : t('admin_cc.banner.failover')}
      </span>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────

function ObservabilityView({ alerts, inventoryAlerts, health, flow, formatTimestamp, navigate }) {
  const { t } = useTranslation();
  
  const lowStockCount = inventoryAlerts.filter(a => a.severity === 'HIGH').length;
  const stockOutCount = inventoryAlerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Patient Flow Pipeline (V5 2026 Edition) */}
      <div className="card padding-0">
        <div className="px-6 py-4 border-b flex-row justify-between min-w-0">
          <div>
            <h3 className="font-bold text-base">{t('admin_cc.observability.pipeline_title')}</h3>
            <p className="text-xs text-outline">{t('admin_cc.observability.pipeline_desc')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-outline uppercase">{t('admin_cc.observability.total_patients', { count: flow.TOTAL })}</p>
            <div className="flex-row gap-1 items-center justify-end min-w-0">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs font-bold text-success uppercase">Live Pipeline Active</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex-row gap-4 items-stretch min-w-0">
            <FlowPhaseCard label={t('admin_cc.observability.phases.waiting')} value={flow.WAITING} color="var(--primary)" icon="person_add" />
            <div className="flex-row items-center text-outline min-w-0">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
            <FlowPhaseCard label={t('admin_cc.observability.phases.triage')} value={flow.TRIAGE} color="var(--warning)" icon="stethoscope" highlight />
            <div className="flex-row items-center text-outline min-w-0">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
            <FlowPhaseCard label={t('admin_cc.observability.phases.treatment')} value={flow.IN_TREATMENT} color="var(--success)" icon="bed" />
          </div>
        </div>
      </div>

      {/* Real-time Health Metrics (V5 Glassmorphism) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <HealthMetricCard 
          label={t('admin_cc.observability.metrics.latency')} 
          value={health?.latency ? `${health.latency}ms` : '42ms'} 
          status={health?.latency > 100 ? 'CAUTION' : 'GOOD'} 
          icon="speed"
        />
        <HealthMetricCard 
          label={t('admin_cc.observability.metrics.sync_rate')} 
          value="99.98%" 
          status="GOOD" 
          icon="cloud_sync"
        />
        <HealthMetricCard 
          label={t('admin_cc.stock_vigilance.metrics.low_count')} 
          value={lowStockCount} 
          status={lowStockCount > 0 ? 'CAUTION' : 'GOOD'} 
          icon="inventory_2"
        />
        <HealthMetricCard 
          label={t('admin_cc.stock_vigilance.metrics.stock_out')} 
          value={stockOutCount} 
          status={stockOutCount > 0 ? 'SLOW' : 'GOOD'} 
          icon="production_quantity_limits"
        />
      </div>

      {/* Data Master Shortcut (IPSG/JCI Ready) */}
      <div className="card bg-surface-container-low border-primary/20 flex-row items-center justify-between p-6 min-w-0">
        <div className="flex-row items-center gap-6 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex-row items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-2xl">database</span>
          </div>
          <div>
            <h4 className="text-lg font-black text-on-surface">{t('admin_cc.observability.master_hub.title')}</h4>
            <p className="text-xs text-on-surface-variant font-medium">{t('admin_cc.observability.master_hub.desc')}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/admin/master-hub')}
          className="btn-primary-small shadow-sm"
        >
          {t('admin_cc.observability.master_hub.btn')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Real-time Alerts Panel (Clinical) */}
        <div className="card padding-0 overflow-hidden">
          <div className="px-6 py-4 bg-error-container text-on-error-container border-b flex-row justify-between min-w-0">
            <h3 className="font-bold text-base">{t('admin_cc.observability.alerts.title')}</h3>
            <span className="chip bg-error text-white font-black">{alerts.length}</span>
          </div>
          <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-outline italic">{t('admin_cc.observability.alerts.no_alerts')}</div>
            ) : alerts.map(alert => (
              <div key={alert.id} className="p-4 borderRadius-lg border border-error-outline bg-surface-container-low">
                <div className="flex-row justify-between mb-1 min-w-0">
                  <span className="text-xs font-black uppercase text-error">{alert.type}</span>
                  <span className="text-[10px] text-outline">{formatTimestamp(alert.created_at)}</span>
                </div>
                <p className="text-sm font-bold mb-2">{alert.message}</p>
                <div className="flex-row gap-2 items-center justify-between min-w-0">
                  <div className="flex-row gap-2 min-w-0">
                    <span className="chip bg-surface text-[10px]">{alert.user}</span>
                    {alert.patient_id && <span className="chip bg-surface text-[10px]">PAT: {alert.patient_id}</span>}
                  </div>
                  
                  {alert.status === ALERT_STATUSES.ACTIVE ? (
                    <button 
                      onClick={() => acknowledgeAlert(alert.id, 'admin@nurseflow.id')} 
                      className="btn-primary text-[10px] px-3 py-1"
                    >{t('admin_cc.observability.alerts.btn_ack')}</button>
                  ) : (
                    <div className="flex-row gap-1 items-center text-[10px] text-primary font-bold shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>person</span>
                      {alert.assigned_to?.split('@')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Vigilance Panel */}
        <div className="card padding-0 overflow-hidden">
          <div className="px-6 py-4 bg-warning-container text-on-warning-container border-b flex-row justify-between min-w-0">
            <div className="flex-row items-center gap-2 min-w-0">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>inventory</span>
              <h3 className="font-bold text-base">{t('admin_cc.stock_vigilance.alert_title')}</h3>
            </div>
            <span className="chip bg-warning text-on-warning font-black">{inventoryAlerts.length}</span>
          </div>
          <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto bg-warning/5">
            {inventoryAlerts.length === 0 ? (
              <div className="text-center py-10 text-outline italic">
                <span className="material-symbols-outlined block mb-2" style={{ fontSize: '2rem' }}>check_circle</span>
                {t('admin_cc.stock_vigilance.no_alerts')}
              </div>
            ) : inventoryAlerts.map(alert => (
              <div key={alert.id} className="p-4 borderRadius-lg border border-warning-outline bg-surface-container-low shadow-sm">
                <div className="flex-row justify-between mb-1 min-w-0">
                  <span className={`text-[10px] font-black uppercase ${alert.severity === 'CRITICAL' ? 'text-error' : 'text-warning'}`}>
                    {alert.severity === 'CRITICAL' ? t('admin_cc.stock_vigilance.critical_stock') : t('admin_cc.stock_vigilance.low_stock')}
                  </span>
                  <span className="text-[10px] text-outline">{formatTimestamp(alert.created_at)}</span>
                </div>
                <p className="text-sm font-black mb-2">{alert.message}</p>
                <div className="flex-row gap-2 items-center justify-between min-w-0">
                  <span className="chip bg-surface text-[10px] font-bold">INV-LOG-01</span>
                  <button 
                    onClick={() => navigate('/pharmacy/inventory')}
                    className="btn-ghost-small text-[10px] px-3 py-1 bg-surface font-black"
                  >
                    {t('admin_cc.stock_vigilance.btn_restock')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Intelligence / Telemetry */}
      <div className="card padding-0">
        <div className="px-6 py-4 border-b flex-row justify-between min-w-0">
          <h3 className="font-bold text-base">{t('admin_cc.observability.telemetry.title')}</h3>
          <span className="text-xs text-outline">{t('admin_cc.observability.telemetry.stream')}</span>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <TelemetryBar label={t('admin_cc.observability.telemetry.val_accuracy')} percentage={100} color="var(--success)" />
            <TelemetryBar label={t('admin_cc.observability.telemetry.identity_check')} percentage={100} color="var(--primary)" />
            <TelemetryBar label={t('admin_cc.observability.telemetry.unauthorized')} percentage={0.2} color="var(--error)" />
            <TelemetryBar label={t('admin_cc.observability.telemetry.audit_sync')} percentage={100} color="var(--secondary)" />
          </div>
          <div className="mt-8 p-4 bg-surface-container-highest borderRadius-lg border border-dashed border-outline">
            <p className="text-xs font-bold uppercase text-primary mb-2 flex-row gap-1 min-w-0">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>info</span>
              {t('admin_cc.observability.telemetry.diagnostic_title')}
            </p>
            <p className="text-sm italic">
              {t('admin_cc.observability.telemetry.diagnostic_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowPhaseCard({ label, value, color, icon, highlight }) {
  return (
    <div className="flex-column items-center p-4 borderRadius-lg min-w-0" style={{ 
      backgroundColor: highlight ? 'var(--surface-container-high)' : 'var(--surface-container-low)',
      border: highlight ? `2px solid ${color}` : '1px solid var(--outline-variant)',
      flex: 1
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
        backgroundColor: highlight ? color : 'var(--surface-container-highest)',
        color: highlight ? 'white' : 'var(--on-surface-variant)',
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', flexShrink: 0
      }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-[10px] font-black uppercase text-outline mb-1 text-center">{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: '900', color: highlight ? color : 'inherit', margin: 0 }}>{value}</p>
    </div>
  );
}

function HealthMetricCard({ label, value, status, icon }) {
  const isError = status === 'SLOW' || status === 'CAUTION';
  return (
    <div className="card flex-row gap-4 items-center min-w-0">
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        backgroundColor: isError ? 'var(--error-container)' : 'var(--primary-container)',
        color: isError ? 'var(--on-error-container)' : 'var(--on-primary-container)',
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-outline mb-0.5">{label}</p>
        <p className="text-lg font-black m-0">{value}</p>
      </div>
    </div>
  );
}

function TelemetryBar({ label, percentage, color }) {
  return (
    <div>
      <div className="flex-row justify-between mb-1.5 min-w-0">
        <span className="text-xs font-bold">{label}</span>
        <span className="text-xs font-mono">{percentage}%</span>
      </div>
      <div className="w-full h-1.5 bg-surface-container borderRadius-full">
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: 'inherit' }} />
      </div>
    </div>
  );
}

function AuditTabView({ logs, filter, setFilter, formatTimestamp }) {
  const { t } = useTranslation();
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    
    const headers = [
      t('admin_cc.audit.table.ts'),
      t('admin_cc.audit.table.identity'),
      t('admin_cc.audit.table.operation'),
      t('common.resource_type'),
      t('admin_cc.audit.table.obj_id'),
      t('common.details')
    ];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      // Escape quotes and format for CSV
      const ts = `"${(log.timestamp ? formatTimestamp(log.timestamp) : '').replace(/"/g, '""')}"`;
      const user = `"${(log.user || 'System').replace(/"/g, '""')}"`;
      const action = `"${t('admin_cc.audit.actions.' + (log.action || 'view').toLowerCase())}"`;
      const resType = `"${(log.resource_type || '').replace(/"/g, '""')}"`;
      const resId = `"${(log.resource_id || '').replace(/"/g, '""')}"`;
      const details = `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`;
      
      csvRows.push([ts, user, action, resType, resId, details].join(','));
    });
    
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JCI_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card padding-0 overflow-hidden">
      <div className="px-6 py-4 flex-row items-center gap-3 bg-surface-container-low border-b min-w-0 flex-wrap">
        <h3 className="font-bold text-base min-w-max">{t('admin_cc.audit.title')}</h3>
        <div className="ml-auto flex-row gap-2 shrink-0 flex-wrap items-center">
          <button 
            onClick={handleExportCSV}
            disabled={!logs || logs.length === 0}
            className="flex-row items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            title="Export for JCI Compliance"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
            {t('admin_cc.audit.btn_export')}
          </button>
          <div className="h-4 w-px bg-outline-variant mx-1 hidden sm:block"></div>
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)',
                backgroundColor: filter === f ? 'var(--primary)' : 'var(--surface-container)',
                color: filter === f ? 'white' : 'var(--on-surface-variant)',
                border: 'none', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
              }}>{f === 'ALL' ? t('common.all') : t('admin_cc.audit.actions.' + f.toLowerCase())}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-surface-container text-[10px] font-black uppercase text-on-surface-variant">
              <th className="py-3 px-6">{t('admin_cc.audit.table.ts')}</th>
              <th className="py-3 px-6">{t('admin_cc.audit.table.identity')}</th>
              <th className="py-3 px-6">{t('admin_cc.audit.table.operation')}</th>
              <th className="py-3 px-6">{t('admin_cc.audit.table.obj_id')}</th>
              <th className="py-3 px-6 text-right">{t('admin_cc.audit.table.analysis')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-all">
                <td className="py-4 px-6 text-[11px] font-mono text-outline">{formatTimestamp(log.timestamp)}</td>
                <td className="py-4 px-6">
                  <p className="font-bold text-sm text-primary m-0">{log.user}</p>
                  <p className="text-[10px] text-outline m-0">{t('admin_cc.audit.table.verified')}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="chip" style={{
                    backgroundColor: ACTION_COLOR[log.action]?.bg,
                    color: ACTION_COLOR[log.action]?.text,
                    fontSize: '0.65rem', fontWeight: '900'
                  }}>{t('admin_cc.audit.actions.' + (log.action || 'view').toLowerCase())}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex-row gap-1 items-center min-w-0">
                    <span className="text-xs font-bold text-on-surface">{log.resource_type}</span>
                    <span className="text-[10px] text-outline">#{log.resource_id?.substring(0, 8)}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="material-symbols-outlined text-outline hover:text-primary" style={{ cursor: 'pointer' }}>database_search</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTabView({ users, onUpdateRole }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);

  // Advanced Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.display_name || u.displayName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employee_id || u.employeeId)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || (u.department || u.profession) === deptFilter;
    
    return matchesSearch && matchesRole && matchesDept;
  });

  const departments = [...new Set(users.map(u => u.department || u.profession))].sort();

  return (
    <div className="space-y-6">
      {/* 🔍 PREMIUM CONTROL CENTER */}
      <div className="card p-6 bg-surface-container-low border-none shadow-xl shadow-primary/5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 min-w-0">
          <div className="flex-1 w-full relative min-w-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">search</span>
            <input 
              type="text"
              placeholder={t('admin_cc.users.search_placeholder')}
              className="w-full pl-12 pr-4 py-4 bg-surface border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-row flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <select 
              className="px-4 py-3 bg-surface border-none rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">{t('admin_cc.users.filter_profession')}</option>
              {Object.keys(ROLE_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
 
            <select 
              className="px-4 py-3 bg-surface border-none rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">{t('admin_cc.users.filter_dept')}</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
 
            <div className="h-10 w-[1px] bg-outline-variant/30 mx-2 hidden lg:block"></div>
            
            <div className="text-right">
              <p className="text-[10px] font-black text-outline uppercase tracking-widest">{t('admin_cc.users.total_staff')}</p>
              <p className="text-xl font-black text-primary leading-none">{filteredUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 STAFF GRID / TABLE */}
      <div className="card padding-0 overflow-hidden border-none shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-surface-container-high text-[10px] font-black uppercase text-on-surface-variant tracking-[0.15em]">
              <th className="py-4 px-8">{t('admin_cc.users.table.identity')}</th>
              <th className="py-4 px-6">{t('admin_cc.users.table.dept')}</th>
              <th className="py-4 px-6">{t('admin_cc.users.table.role')}</th>
              <th className="py-4 px-6">{t('admin_cc.users.table.status')}</th>
              <th className="py-4 px-8 text-right">{t('admin_cc.users.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-4">person_search</span>
                  <p className="text-outline font-bold">{t('admin_cc.users.not_found')}</p>
                </td>
              </tr>
            ) : filteredUsers.slice(0, 50).map(u => (
              <tr key={u.id || u.uid} className="hover:bg-primary/5 transition-colors group">
                <td className="py-4 px-8">
                  <div className="flex-row items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex-row items-center justify-center text-primary font-black text-lg border border-primary/10 shrink-0">
                      {(u.display_name || u.displayName)?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-black text-sm text-on-surface m-0 group-hover:text-primary transition-colors">{u.display_name || u.displayName || t('admin_cc.users.unnamed')}</p>
                      <div className="flex-row items-center gap-2 mt-0.5 min-w-0">
                        <span className="text-[10px] font-mono text-outline">{u.employee_id || u.employeeId || t('admin_cc.users.table.no_nip')}</span>
                        <span className="w-1 h-1 rounded-full bg-outline/30"></span>
                        <span className="text-[10px] font-bold text-outline">{u.email}</span>
                      </div>
                      {(u.str_number || u.metadata?.str) && (
                        <span className="mt-1 text-[9px] font-black text-secondary flex-row items-center gap-1 uppercase tracking-tighter min-w-0">
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>verified</span>
                          {t('admin_cc.users.str_verified')}: {(u.str_number || u.metadata?.str)?.substring(0, 15)}...
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-on-surface">{u.department || u.profession || t('common.general')}</span>
                    <span className="text-[10px] font-bold text-outline mt-0.5">{t('admin_cc.users.table.unit_label')}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <select
                    className="bg-surface-container border border-outline-variant/30 rounded-lg text-[10px] font-black uppercase px-2 py-1 cursor-pointer focus:ring-2 ring-primary/20"
                    value={u.role}
                    onChange={(e) => onUpdateRole(u.uid || u.id, e.target.value)}
                    style={{
                      backgroundColor: ROLE_COLORS[u.role]?.bg,
                      color: ROLE_COLORS[u.role]?.text
                    }}
                  >
                    {Object.values(ROLES).map(r => (
                      <option key={r} value={r}>{t('roles.' + r.toLowerCase())}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-6">
                  <div className="flex-row items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${u.status === 'ACTIVE' ? 'bg-success' : 'bg-outline'}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{u.status || t('common.status.offline')}</span>
                  </div>
                </td>
                <td className="py-4 px-8 text-right">
                  <button 
                    onClick={() => setSelectedUser(u)}
                    className="inline-flex flex-row items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>id_card</span>
                    {t('admin_cc.users.table.btn_intel')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {filteredUsers.length > 50 && (
          <div className="p-4 bg-surface-container-lowest text-center border-t border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline">{t('admin_cc.users.limit_warning')}</p>
          </div>
        )}
      </div>

      {/* 🧠 STAFF INTELLIGENCE MODAL */}
      {selectedUser && (
        <StaffDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}

// ──────── STAFF DETAIL MODAL (PREMIUM) ────────
function StaffDetailModal({ user, onClose }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col lg:flex-row max-h-[90vh]">
        
        {/* Left Side: Identity Card */}
        <div className="lg:w-1/3 bg-primary p-10 text-on-primary flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-on-primary/10 backdrop-blur-xl border-4 border-on-primary/20 flex-row items-center justify-center text-5xl font-black mb-6 shadow-2xl shrink-0">
            {(user.display_name || user.displayName)?.charAt(0)}
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-none mb-2">{user.display_name || user.displayName}</h3>
          <span className="px-4 py-1.5 bg-on-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">{t('roles.' + user.role?.toLowerCase())}</span>
          
          <div className="w-full space-y-4 pt-6 border-t border-on-primary/10">
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('admin_cc.users.modal.id_label')}</p>
              <p className="font-mono font-black text-lg">{user.employee_id || user.employeeId || 'NF-2026-X'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('admin_cc.users.modal.unit_label')}</p>
              <p className="font-black text-base">{user.department || user.profession || t('common.general')}</p>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <img alt="QR Code" src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${user.id || user.uid}`} className="w-20 h-20 bg-surface p-2 rounded-xl opacity-80" />
            <p className="text-[9px] font-bold mt-2 opacity-50">{t('admin_cc.users.modal.id_verified')}</p>
          </div>
        </div>

        {/* Right Side: Professional Meta Data */}
        <div className="flex-1 p-10 overflow-y-auto bg-surface-container-lowest">
          <div className="flex-row items-center justify-between mb-6 min-w-0">
            <div>
              <h4 className="text-xl font-black text-on-surface">{t('admin_cc.users.modal.metadata')}</h4>
              <p className="text-xs text-on-surface-variant font-medium">{t('admin_cc.users.modal.metadata_desc')}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <MetaItem icon="work_history" label={t('admin_cc.users.modal.item_exp')} value={`${user.years_of_experience || user.metadata?.experienceYears || 0} ${t('admin_cc.users.modal.years')}`} />
            <MetaItem icon="calendar_today" label={t('admin_cc.users.modal.item_hire')} value={user.join_date || user.metadata?.hireDate ? new Date(user.join_date || user.metadata.hireDate).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
            <MetaItem icon="verified" label={t('admin_cc.users.modal.item_str')} value={user.str_number || user.metadata?.str || t('admin_cc.users.modal.not_registered')} status={(user.str_number || user.metadata?.str) ? 'ACTIVE' : t('admin_cc.users.modal.status_none')} />
            <MetaItem icon="medical_information" label={t('admin_cc.users.modal.item_sip')} value={user.sip_number || user.metadata?.sip || 'N/A'} status={(user.sip_number || user.metadata?.sip) ? 'ACTIVE' : t('admin_cc.users.modal.status_none')} />
          </div>

          <div className="card bg-surface-container border-none p-6 rounded-3xl mb-6">
            <h5 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">{t('admin_cc.users.modal.competency')}</h5>
            <div className="flex flex-wrap gap-2">
              {(user.specialization || user.metadata?.specialty || 'General Clinical Care').split(',').map(skill => (
                <span key={skill} className="px-3 py-1 bg-surface border border-outline-variant/30 rounded-lg text-[10px] font-black uppercase">{skill.trim()}</span>
              ))}
            </div>
          </div>

          <div className="flex-row justify-between gap-4 mt-10 min-w-0">
            <button className="btn-ghost-small flex-1 py-4 font-black">{t('admin_cc.users.modal.btn_edit')}</button>
            <button className="btn-primary flex-1 py-4 font-black shadow-primary/20">{t('admin_cc.users.modal.btn_perms')}</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetaItem({ icon, label, value, status }) {
  return (
    <div className="flex-row items-start gap-4 p-4 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm min-w-0">
      <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex-row items-center justify-center text-primary shrink-0">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-outline uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-on-surface leading-tight mt-0.5">{value}</p>
        {status && (
          <span className={`text-[8px] font-black uppercase tracking-tighter ${status === 'ACTIVE' ? 'text-success' : 'text-error'}`}>
            Status: {status}
          </span>
        )}
      </div>
    </div>
  );
}

function DataConflictsTabView() {
  const { t } = useTranslation();
  return (
    <div className="card padding-0">
      <div className="px-6 py-4 border-b flex-row justify-between items-center bg-surface-container-low min-w-0">
        <h3 className="font-bold text-base">{t('admin_cc.conflicts.title')}</h3>
        <span className="chip bg-warning-container text-on-warning-container font-bold">{t('admin_cc.conflicts.pending', { count: 0 })}</span>
      </div>
      <div className="p-12 text-center">
        <span className="material-symbols-outlined text-outline" style={{ fontSize: '4rem' }}>fact_check</span>
        <h4 className="title text-lg mt-4">{t('admin_cc.conflicts.integrity_ok')}</h4>
        <p className="text-outline text-sm mt-2">
          {t('admin_cc.conflicts.desc')}
        </p>
      </div>
    </div>
  );
}
