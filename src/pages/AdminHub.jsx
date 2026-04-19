/**
 * Admin Hub — Audit Trail Viewer + User Management (Step 3 + 4)
 * Hanya bisa diakses oleh role ADMIN.
 */
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../core/firebase.js';
import { COLLECTIONS, ROLES, AUDIT_ACTIONS } from '../core/constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';

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

export default function AdminHub() {
  const { currentUser } = useAuth();

  // ─── Audit Logs State ─────────────────────────────────────
  const [auditLogs, setAuditLogs]     = useState([]);
  const [logFilter, setLogFilter]     = useState('ALL');
  const [logLoading, setLogLoading]   = useState(true);

  // ─── Users State ──────────────────────────────────────────
  const [users, setUsers]             = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activeTab, setActiveTab]     = useState('audit'); // 'audit' | 'users'

  useEffect(() => {
    fetchAuditLogs();
    fetchUsers();
  }, []);

  const fetchAuditLogs = async (filterAction = 'ALL') => {
    setLogLoading(true);
    try {
      let q;
      if (filterAction === 'ALL') {
        q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('timestamp', 'desc'), limit(50));
      } else {
        q = query(
          collection(db, COLLECTIONS.AUDIT_LOGS),
          where('action', '==', filterAction),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
      }
      const snap = await getDocs(q);
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[AdminHub] fetchAuditLogs:', err);
    }
    setLogLoading(false);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.USERS));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[AdminHub] fetchUsers:', err);
    }
    setUsersLoading(false);
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Ubah role user ini menjadi ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Gagal update role: ' + err.message);
    }
  };

  const handleFilterChange = (f) => {
    setLogFilter(f);
    fetchAuditLogs(f);
  };

  const formatTimestamp = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex-row items-start justify-between mb-8">
        <div>
          <p className="subtitle">Administrator</p>
          <h2 className="title">Admin Command Center</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            JCI Audit Dashboard · Immutable Log · RBAC Management
          </p>
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

      {/* ─── Analytics Row ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Audit Logs',    value: auditLogs.length + '+', icon: 'database',          color: 'var(--primary)' },
          { label: 'Total Registered Users', value: users.length,        icon: 'manage_accounts',   color: 'var(--secondary)' },
          { label: 'Log Kritis (DELETE)', value: auditLogs.filter(l => l.action === 'DELETE').length, icon: 'warning', color: 'var(--error)' },
          { label: 'Sumber Cloud Fn',
            value: auditLogs.filter(l => l.source === 'CLOUD_FUNCTION').length,
            icon: 'cloud_sync', color: '#7c3aed' },
        ].map(m => (
          <div key={m.label} className="card">
            <div className="flex-row items-center gap-3 mb-2">
              <span className="material-symbols-outlined" style={{ color: m.color }}>{m.icon}</span>
              <p className="metric-label">{m.label}</p>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: m.color, margin: 0, fontFamily: 'var(--font-headline)' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Tab Navigation ─────────────────────────────────── */}
      <div className="flex-row gap-2 mb-6">
        {[
          { id: 'audit', label: 'Audit Trail Log',   icon: 'history' },
          { id: 'users', label: 'User & Role Management', icon: 'manage_accounts' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={activeTab === t.id ? 'btn-primary' : 'btn-ghost'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: AUDIT TRAIL ──────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="card padding-0 overflow-hidden">
          {/* Sub-header dengan filter */}
          <div className="px-6 py-4 flex-row items-center gap-3 flex-wrap"
            style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-primary">lock</span>
            <h3 className="font-bold text-base">Immutable Audit Trail</h3>
            <div className="chip" style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', fontSize: '0.7rem' }}>
              JCI Compliant · Append-Only
            </div>
            <div className="ml-auto flex-row gap-2 flex-wrap">
              {['ALL', ...Object.keys(ACTION_COLOR)].map(f => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  style={{
                    padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                    border: 'none', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                    backgroundColor: logFilter === f ? 'var(--primary)' : 'var(--surface-container)',
                    color: logFilter === f ? 'white' : 'var(--on-surface-variant)',
                    transition: 'all 0.2s'
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-container)' }}>
                  {['Timestamp', 'Staff (Email)', 'Action', 'Resource', 'Resource ID', 'Source'].map(h => (
                    <th key={h} className="py-3 px-4 font-bold text-xs uppercase text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logLoading ? (
                  <tr><td colSpan="6" className="py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined anim-spin">progress_activity</span>
                  </td></tr>
                ) : auditLogs.length === 0 ? (
                  <tr><td colSpan="6" className="py-10 text-center text-on-surface-variant">
                    Belum ada audit log.
                  </td></tr>
                ) : auditLogs.map((log, i) => {
                  const actionStyle = ACTION_COLOR[log.action] || ACTION_COLOR.VIEW;
                  return (
                    <tr key={log.id}
                      style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)' }}>
                      <td className="py-3 px-4 text-xs text-on-surface-variant font-mono">{formatTimestamp(log.timestamp)}</td>
                      <td className="py-3 px-4 text-sm font-bold" style={{ color: 'var(--primary)' }}>
                        {log.user || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: '800',
                          backgroundColor: actionStyle.bg, color: actionStyle.text,
                          letterSpacing: '0.05em'
                        }}>{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-on-surface-variant">{log.resource_type}</td>
                      <td className="py-3 px-4 text-xs font-mono text-on-surface-variant" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.resource_id || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span style={{
                          fontSize: '0.7rem', fontWeight: '600',
                          color: log.source === 'CLOUD_FUNCTION' ? '#7c3aed' : 'var(--on-surface-variant)'
                        }}>
                          {log.source === 'CLOUD_FUNCTION' ? '☁️ Cloud Fn' : '💻 Client'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: USER MANAGEMENT ─────────────────────────── */}
      {activeTab === 'users' && (
        <div className="card padding-0 overflow-hidden">
          <div className="px-6 py-4 flex-row items-center gap-3"
            style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-primary">manage_accounts</span>
            <h3 className="font-bold text-base">User & Role Management</h3>
            <p className="text-xs text-on-surface-variant ml-2">Ubah role → efektif setelah user login ulang</p>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container)' }}>
                {['Nama', 'Email', 'Role Saat Ini', 'Department', 'Status', 'Ubah Role'].map(h => (
                  <th key={h} className="py-3 px-5 font-bold text-xs uppercase text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr><td colSpan="6" className="py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined anim-spin">progress_activity</span>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">
                  Belum ada user terdaftar. User akan muncul setelah login pertama kali.
                </td></tr>
              ) : users.map(user => {
                const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.NURSE;
                return (
                  <tr key={user.id} className="border-b" style={{ borderColor: 'var(--outline-variant)' }}>
                    <td className="py-4 px-5 font-bold text-sm">{user.displayName || '—'}</td>
                    <td className="py-4 px-5 text-sm text-primary">{user.email}</td>
                    <td className="py-4 px-5">
                      <span className="chip" style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}>
                        {user.role || 'NURSE'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-sm text-on-surface-variant">{user.department || '—'}</td>
                    <td className="py-4 px-5">
                      <span className={`chip ${user.is_active ? 'chip-success' : 'chip-error'}`}>
                        {user.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {user.email !== currentUser?.email && (
                        <select
                          className="form-input"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                          value={user.role || 'NURSE'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}>
                          {Object.values(ROLES).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                      {user.email === currentUser?.email && (
                        <span className="text-xs text-on-surface-variant italic">Akun Anda</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* RBAC Matrix */}
          <div className="p-6" style={{ borderTop: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}>
            <h4 className="font-bold text-sm mb-4 flex-row items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.1rem' }}>grid_view</span>
              RBAC Permission Matrix
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: '0.75rem', borderCollapse: 'separate', borderSpacing: '4px' }}>
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left text-on-surface-variant">Module</th>
                    {Object.values(ROLES).map(r => (
                      <th key={r} className="py-2 px-4 text-center font-bold" style={{ color: ROLE_COLORS[r]?.text }}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { mod: 'Dashboard',  perms: { DOCTOR: 'Read', NURSE: 'Read', ADMIN: 'Full', PHARMACIST: 'Read' } },
                    { mod: 'Patients',   perms: { DOCTOR: 'R+W', NURSE: 'Read', ADMIN: 'Full', PHARMACIST: 'Read' } },
                    { mod: 'Encounters', perms: { DOCTOR: 'Full', NURSE: 'Read', ADMIN: 'Full', PHARMACIST: '—' } },
                    { mod: 'Triage IGD', perms: { DOCTOR: 'R+W', NURSE: 'Full', ADMIN: 'Full', PHARMACIST: '—' } },
                    { mod: 'EMR (SOAP)', perms: { DOCTOR: 'Full', NURSE: 'Read', ADMIN: 'Full', PHARMACIST: 'Read' } },
                    { mod: 'Audit Logs', perms: { DOCTOR: '—', NURSE: '—', ADMIN: 'Full', PHARMACIST: '—' } },
                    { mod: 'Pharmacy',   perms: { DOCTOR: 'Read', NURSE: '—', ADMIN: 'Full', PHARMACIST: 'Full' } },
                  ].map(row => (
                    <tr key={row.mod}>
                      <td className="py-2 px-3 font-bold" style={{ color: 'var(--on-surface)' }}>{row.mod}</td>
                      {Object.values(ROLES).map(r => (
                        <td key={r} className="py-2 px-4 text-center" style={{
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: row.perms[r] === '—' ? 'transparent' : row.perms[r] === 'Full' ? '#dcfce7' : '#dbeafe',
                          color: row.perms[r] === '—' ? 'var(--on-surface-variant)' : row.perms[r] === 'Full' ? '#166534' : '#1e40af',
                          fontWeight: '600'
                        }}>
                          {row.perms[r]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
