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

const MainLayout = () => {
  const location  = useLocation();
  const { currentUser, role, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard',   path: '/dashboard',  icon: 'dashboard'            },
    { name: 'Patients',    path: '/patients',   icon: 'groups'               },
    { name: 'Encounters',  path: '/encounters', icon: 'local_hospital'       },
    { name: 'Triage IGD',  path: '/triage',     icon: 'emergency'            },
    { name: 'EMR (SOAP)',  path: '/emr',        icon: 'medical_information'  },
  ];

  const adminItems = [
    { name: 'Admin Hub', path: '/admin', icon: 'admin_panel_settings' },
  ];

  const badge = ROLE_BADGE[role] || ROLE_BADGE.NURSE;

  const navLinkStyle = (isActive, danger = false) => ({
    display: 'flex', alignItems: 'center', padding: '0.65rem 1rem',
    textDecoration: 'none', borderRadius: 'var(--radius-md)',
    fontWeight: isActive ? '700' : '500', fontSize: '0.875rem', gap: '0.75rem',
    color:           isActive ? (danger ? 'var(--on-error-container)' : 'var(--on-primary-container)') : (danger ? 'var(--error)' : 'var(--on-surface-variant)'),
    backgroundColor: isActive ? (danger ? 'var(--error-container)' : 'var(--primary-container)') : 'transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <div className="flex-column h-full">
      <TopAppBar />
      <div className="flex-row" style={{ marginTop: '4rem', height: 'calc(100vh - 4rem)' }}>

        {/* ─── Sidebar ─────────────────────────────────── */}
        <div style={{
          width: '240px', display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--surface-container-low)',
          borderRight: '1px solid var(--outline-variant)', flexShrink: 0,
        }}>
          {/* Nav Links */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.75rem', marginTop: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.name} to={item.path} style={navLinkStyle(isActive)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: isActive ? 'var(--primary)' : 'inherit' }}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Section — hanya muncul jika role ADMIN */}
            {isAdmin && (
              <>
                <div style={{
                  margin: '1rem 0 0.4rem', padding: '0 0.5rem',
                  fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em',
                  color: 'var(--on-surface-variant)', textTransform: 'uppercase'
                }}>Administration</div>
                {adminItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link key={item.name} to={item.path} style={navLinkStyle(isActive, true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* ─── Bottom User Card ─────────────────────── */}
          {currentUser && (
            <div style={{
              padding: '0.75rem 1rem', borderTop: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'var(--primary-container)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>person</span>
                }
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '3px', padding: '1px 8px',
                  borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: '800',
                  backgroundColor: badge.bg, color: badge.color,
                }}>{badge.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Main Content ────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--background)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
