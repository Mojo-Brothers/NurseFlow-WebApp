/**
 * Admin Hub — Audit Trail Viewer + User Management
 * Refactored: System-first architecture (Decoupled from Firebase)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { ROLES, AUDIT_ACTIONS } from '../../../core/constants.js';
import { fetchAuditLogs, fetchAllUsers, updateUserRole } from '../services/admin.service.js';

const ACTION_COLOR = {
  CREATE: { bg: '#dcfce7', text: '#166534' },
  UPDATE: { bg: '#dbeafe', text: '#1e40af' },
  DELETE: { bg: '#fee2e2', text: '#991b1b' },
  VIEW:   { bg: '#f3f4f6', text: '#374151' },
  LOGIN:  { bg: '#fef9c3', text: '#92400e' },
  LOGOUT: { bg: '#f3f4f6', text: '#6b7280' },
};

const ROLE_COLORS = {
  DOCTOR:     { bg: '#e0e7ff', text: '#3730a3' },
  NURSE:      { bg: '#dcfce7', text: '#166534' },
  ADMIN:      { bg: '#fee2e2', text: '#991b1b' },
  PHARMACIST: { bg: '#fef9c3', text: '#92400e' },
};

export default function AdminHubPage() {
  const { currentUser } = useAuth();

  const [auditLogs, setAuditLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [loading, setLoading]     = useState(true);
  const [users, setUsers]         = useState([]);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'users'

  useEffect(() => {
    loadData();
  }, [activeTab, logFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const logs = await fetchAuditLogs(50);
        setAuditLogs(logFilter === 'ALL' ? logs : logs.filter(l => l.action === logFilter));
      } else {
        const userData = await fetchAllUsers();
        setUsers(userData);
      }
    } catch (err) {
      console.error('[AdminHub] loadData:', err);
    }
    setLoading(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Ubah role user ini menjadi ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole, currentUser.email);
      alert('Role diperbarui (Sync via Audit Trail).');
      loadData();
    } catch (err) {
      alert('Gagal update role: ' + err.message);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-start justify-between mb-8">
        <div>
          <p className="subtitle">Governance & Control</p>
          <h2 className="title">Admin Command Center</h2>
          <p className="text-on-surface-variant text-sm mt-1">JCI Audit Dashboard · Modular Service Layer · RBAC Management</p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)',
          fontSize: '0.75rem', fontWeight: '700'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>shield</span>
          ADMIN ACCESS ONLY
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <p className="metric-label">Audit Visibility</p>
          <p className="title">{auditLogs.length} Recent Logs</p>
        </div>
        <div className="card">
          <p className="metric-label">Staff Registry</p>
          <p className="title">{users.length} Active Users</p>
        </div>
        <div className="card">
          <p className="metric-label">Security Protocol</p>
          <p className="title">JCI Append-Only</p>
        </div>
      </div>

      <div className="flex-row gap-2 mb-6">
        <button onClick={() => setActiveTab('audit')} className={activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}>
          Audit Trail
        </button>
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}>
          User Roles
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-20">
          <span className="material-symbols-outlined anim-spin text-primary">progress_activity</span>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="card padding-0 overflow-hidden">
          <div className="px-6 py-4 flex-row items-center gap-3 bg-surface-container-low border-b">
            <h3 className="font-bold text-base">Immutable Activity Log</h3>
            <div className="ml-auto flex-row gap-2">
              {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  style={{
                    padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                    backgroundColor: logFilter === f ? 'var(--primary)' : 'var(--surface-container)',
                    color: logFilter === f ? 'white' : 'var(--on-surface-variant)',
                    border: 'none', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                  }}>{f}</button>
              ))}
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container text-xs font-bold uppercase text-on-surface-variant">
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Resource</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} className="border-b border-outline-variant">
                  <td className="py-4 px-6 text-xs font-mono">{formatTimestamp(log.timestamp)}</td>
                  <td className="py-4 px-6 font-bold text-sm text-primary">{log.user}</td>
                  <td className="py-4 px-6">
                    <span className="chip" style={{
                      backgroundColor: ACTION_COLOR[log.action]?.bg,
                      color: ACTION_COLOR[log.action]?.text,
                      fontSize: '0.65rem'
                    }}>{log.action}</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-on-surface-variant">
                    {log.resource_type} <span className="text-outline">/{log.resource_id}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
             <span className="material-symbols-outlined text-outline" style={{ cursor: 'pointer' }}>info</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card padding-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container text-xs font-bold uppercase text-on-surface-variant">
                <th className="py-3 px-6">Staff</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-outline-variant">
                  <td className="py-4 px-6">
                    <p className="font-bold text-sm m-0">{u.displayName || u.email}</p>
                    <p className="text-xs text-on-surface-variant m-0">{u.email}</p>
                  </td>
                  <td className="py-4 px-6 text-sm">{u.department || '—'}</td>
                  <td className="py-4 px-6">
                    <span className="chip" style={{
                      backgroundColor: ROLE_COLORS[u.role]?.bg,
                      color: ROLE_COLORS[u.role]?.text
                    }}>{u.role}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <select
                      className="form-input text-xs"
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                    >
                      {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
