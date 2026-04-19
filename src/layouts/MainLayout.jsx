import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import { useAuth } from '../contexts/AuthContext';

const ROLE_BADGE = {
  DOCTOR:     { label: 'Dokter',  color: '#3730a3', bg: '#e0e7ff' },
  NURSE:      { label: 'Perawat', color: '#166534', bg: '#dcfce7' },
  ADMIN:      { label: 'Admin',   color: '#991b1b', bg: '#fee2e2' },
  PHARMACIST: { label: 'Farmasi', color: '#92400e', bg: '#fef9c3' },
};

// Role-based nav visibility
const NAV_SCHEMA = [
  { label: 'Klinis', items: [
    { name: 'Dashboard',   path: '/dashboard',  icon: 'dashboard',           roles: null },
    { name: 'Patients',    path: '/patients',   icon: 'groups',              roles: null },
    { name: 'Encounters',  path: '/encounters', icon: 'local_hospital',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'Triage IGD',  path: '/triage',     icon: 'emergency',           roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'EMR (SOAP)',  path: '/emr',        icon: 'medical_information', roles: ['DOCTOR','ADMIN'] },
  ]},
  { label: 'Operasional', items: [
    { name: 'Worklist',    path: '/worklist',   icon: 'task_alt',            roles: ['NURSE','ADMIN'] },
    { name: 'Pharmacy',    path: '/pharmacy',   icon: 'local_pharmacy',      roles: ['PHARMACIST','DOCTOR','ADMIN'] },
    { name: 'Billing',     path: '/billing',    icon: 'receipt_long',        roles: ['DOCTOR','ADMIN'] },
  ]},
  { label: 'Administrasi', admin: true, items: [
    { name: 'Admin Hub',   path: '/admin',      icon: 'admin_panel_settings', roles: ['ADMIN'] },
  ]},
];

const MainLayout = () => {
  const location = useLocation();
  const { currentUser, role } = useAuth();
  const badge = ROLE_BADGE[role] || ROLE_BADGE.NURSE;

  const isVisible = (item) => !item.roles || item.roles.includes(role);

  const navLink = (item) => {
    const isActive  = location.pathname.startsWith(item.path);
    const isDanger  = item.path === '/admin';
    return (
      <Link key={item.name} to={item.path} style={{
        display: 'flex', alignItems: 'center', padding: '0.6rem 0.875rem',
        textDecoration: 'none', borderRadius: 'var(--radius-md)', gap: '0.625rem',
        fontWeight: isActive ? '700' : '500', fontSize: '0.875rem',
        color:           isActive ? (isDanger ? 'var(--on-error-container)' : 'var(--on-primary-container)') : (isDanger ? 'var(--error)' : 'var(--on-surface-variant)'),
        backgroundColor: isActive ? (isDanger ? 'var(--error-container)' : 'var(--primary-container)') : 'transparent',
        transition: 'all 0.15s ease',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: '1.15rem',
          color: isActive ? (isDanger ? 'var(--error)' : 'var(--primary)') : 'inherit'
        }}>{item.icon}</span>
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex-column h-full">
      <TopAppBar />
      <div className="flex-row" style={{ marginTop: '4rem', height: 'calc(100vh - 4rem)' }}>

        {/* ═══ Sidebar ═══════════════════════════════════════ */}
        <nav style={{
          width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--surface-container-low)',
          borderRight: '1px solid var(--outline-variant)',
        }}>
          <div style={{ flex: 1, padding: '0.75rem', marginTop: '0.5rem', overflowY: 'auto' }}>
            {NAV_SCHEMA.map(section => {
              const visibleItems = section.items.filter(isVisible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.label} style={{ marginBottom: '0.5rem' }}>
                  {section.label !== 'Klinis' && (
                    <div style={{
                      padding: '0.5rem 0.875rem 0.25rem',
                      fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.1em',
                      color: section.admin ? 'var(--error)' : 'var(--on-surface-variant)',
                      textTransform: 'uppercase', opacity: 0.7,
                    }}>{section.label}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleItems.map(navLink)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── User Card ──────────────────────────────── */}
          {currentUser && (
            <div style={{
              padding: '0.75rem', borderTop: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', gap: '0.625rem',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'var(--primary-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>person</span>
                }
              </div>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--on-surface)' }}>
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '2px', padding: '1px 7px',
                  borderRadius: 'var(--radius-full)', fontSize: '0.6rem', fontWeight: '800',
                  backgroundColor: badge.bg, color: badge.color,
                }}>{badge.label}</span>
              </div>
            </div>
          )}
        </nav>

        {/* ═══ Main Content ══════════════════════════════════ */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--background)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
