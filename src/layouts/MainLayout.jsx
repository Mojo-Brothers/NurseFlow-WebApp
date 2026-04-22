import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopAppBar from '../components/TopAppBar';
import { useAuth } from '../contexts/useAuth.js';
import VersionDisplay from '../components/VersionDisplay';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import OfflineStatusIndicator from '../components/ui/OfflineStatusIndicator';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';
import { getStaffCredentials } from '../modules/enterprise/services/sqe.service.js';

const ROLE_BADGE = {
  DOCTOR:     { label: 'roles.doctor',  color: '#3730a3', bg: '#e0e7ff' },
  NURSE:      { label: 'roles.nurse',   color: '#166534', bg: '#dcfce7' },
  ADMIN:      { label: 'roles.admin',   color: '#991b1b', bg: '#fee2e2' },
  PHARMACIST: { label: 'roles.pharmacist', color: '#92400e', bg: '#fef9c3' },
};

// Role-based nav visibility
const NAV_SCHEMA = [
  { label: 'nav.clinical', items: [
    { name: 'nav.dashboard',   path: '/dashboard',  icon: 'dashboard',           roles: null },
    { name: 'nav.patients',    path: '/patients',   icon: 'groups',              roles: null },
    { name: 'nav.encounters',  path: '/encounters', icon: 'local_hospital',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.triage',      path: '/triage',     icon: 'emergency',           roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr',         path: '/emr',        icon: 'medical_information', roles: ['DOCTOR','ADMIN'] },
    { name: 'nav.surgery',     path: '/surgery',    icon: 'theater_comedy',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.credentials', path: '/credentials', icon: 'badge',              roles: null },
  ]},
  { label: 'nav.operational', items: [
    { name: 'nav.worklist',    path: '/worklist',   icon: 'task_alt',            roles: ['NURSE','ADMIN'] },
    { name: 'nav.pharmacy',    path: '/pharmacy',   icon: 'local_pharmacy',      roles: ['PHARMACIST','DOCTOR','ADMIN'] },
    { name: 'nav.billing',     path: '/billing',    icon: 'receipt_long',        roles: ['DOCTOR','ADMIN'] },
  ]},
  { label: 'nav.administration', admin: true, items: [
    { name: 'nav.admin',       path: '/admin',      icon: 'admin_panel_settings', roles: ['ADMIN'] },
    { name: 'nav.surveillance', path: '/surveillance', icon: 'biosecurity',       roles: ['ADMIN','DOCTOR'] },
    { name: 'nav.executive',    path: '/executive',    icon: 'monitoring',        roles: ['ADMIN'] },
    { name: 'nav.governance',   path: '/governance',   icon: 'verified',          roles: ['ADMIN'] },
    { name: 'Map Config',      path: '/wayfinding-admin', icon: 'map',            roles: ['ADMIN'] },
    { name: 'Design Lab',      path: '/lab',        icon: 'biotech',              roles: ['ADMIN'] },
  ]},
];

const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const { currentUser, role } = useAuth();
  const { stressLevel, focusMode, classicUI, isPeeking, setIsPeeking } = useStressMonitor();
  const [credentials, setCredentials] = React.useState(null);
  const badge = ROLE_BADGE[role] || ROLE_BADGE.NURSE;

  React.useEffect(() => {
    if (currentUser) {
      getStaffCredentials(currentUser.email).then(setCredentials).catch(console.error);
    }
  }, [currentUser]);
  
  const isVisible = (item) => !item.roles || item.roles.includes(role);
  
  // Adaptive Depth Logic
  const activeStressClass = classicUI ? '' : (stressLevel === 'critical' ? 'stress-critical' : (stressLevel === 'warning' ? 'stress-warning' : ''));
  const isFocusMode       = focusMode && !classicUI;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Responsive check
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showExpanded = !collapsed && (!isFocusMode || isPeeking);

  // Auto-collapse on mobile initial load
  React.useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const navLink = (item) => {
    const isActive  = location.pathname.startsWith(item.path);
    const isDanger  = item.path === '/admin';
    return (
      <Link 
        key={item.name} 
        to={item.path} 
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', padding: '0.6rem 0.875rem',
          textDecoration: 'none', borderRadius: 'var(--radius-md)', gap: '0.625rem',
          fontWeight: isActive ? '700' : '500', fontSize: '0.875rem',
          color:           isActive ? (isDanger ? 'var(--on-error-container)' : 'var(--on-primary-container)') : (isDanger ? 'var(--error)' : 'var(--on-surface-variant)'),
          backgroundColor: isActive ? (isDanger ? 'var(--error-container)' : 'var(--primary-container)') : 'transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{
          fontSize: '1.15rem',
          color: isActive ? (isDanger ? 'var(--error)' : 'var(--primary)') : 'inherit'
        }}>{item.icon}</span>
        {(showExpanded || (isMobile && isMobileMenuOpen)) && t(item.name)}
      </Link>
    );
  };

  return (
    <div 
      className={`flex-column h-full w-full ${activeStressClass} ${isFocusMode ? 'focus-mode' : ''}`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      <div className="flex-row w-full" style={{ marginTop: '3.25rem', height: 'calc(100vh - 3.25rem)', padding: isMobile ? '0' : '1rem', gap: isMobile ? '0' : '1rem' }}>

        {/* ═══ Sidebar (Desktop & Mobile Drawer) ═══════════════ */}
        <nav 
          className={`
            ${isFocusMode ? 'hide-on-focus' : ''} 
            ${isPeeking ? 'peek-overlay' : ''}
            ${isMobile && !isMobileMenuOpen ? 'hide-on-mobile' : ''}
          `}
          onMouseEnter={() => isFocusMode && setIsPeeking(true)}
          onMouseLeave={() => setIsPeeking(false)}
          style={{
            width: (isMobile && isMobileMenuOpen) ? '280px' : (showExpanded ? '240px' : '72px'), 
            flexShrink: 0, display: 'flex', flexDirection: 'column',
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--outline-variant)',
            borderRadius: isMobile ? '0' : '0 var(--radius-lg) var(--radius-lg) 0',
            transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease',
            overflow: 'hidden',
            position: (isMobile && isMobileMenuOpen) ? 'fixed' : (isPeeking ? 'absolute' : 'relative'),
            height: '100%',
            zIndex: 1000,
            left: 0,
            top: 0
          }}
        >
          {/* ─── Toggle Button (Desktop Only) ─────────────── */}
          {!isMobile && (
            <div style={{ 
              display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', 
              padding: '0.75rem', borderBottom: '1px solid var(--outline-variant)' 
            }}>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="btn-icon"
                style={{
                  width: '32px', height: '32px', minWidth: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-container-highest)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: 'none', color: 'var(--on-surface-variant)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  {collapsed ? 'menu' : 'menu_open'}
                </span>
              </button>
            </div>
          )}

          {isMobile && isMobileMenuOpen && (
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-primary">NurseFlow</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="material-symbols-outlined">close</button>
            </div>
          )}

          <div style={{ flex: 1, padding: (collapsed && !isMobile) ? '0.5rem' : '0.75rem', marginTop: '0.5rem', overflowY: 'auto' }}>
            {NAV_SCHEMA.map(section => {
              const visibleItems = section.items.filter(isVisible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.label} style={{ marginBottom: '0.5rem' }}>
                  {(showExpanded || isMobileMenuOpen) && (
                    <div style={{
                      padding: '0.5rem 0.875rem 0.25rem',
                      fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.1em',
                      color: section.admin ? 'var(--error)' : 'var(--on-surface-variant)',
                      textTransform: 'uppercase', opacity: 0.7,
                    }}>{t(section.label)}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleItems.map(navLink)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '0.5rem 0.75rem' }}>
             <LanguageSwitcher />
          </div>

          {/* ─── User Card ──────────────────────────────── */}
          {currentUser && (
            <div style={{
              padding: '0.75rem', borderTop: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start'
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
              {(showExpanded || isMobileMenuOpen) && (
                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--on-surface)' }}>
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <div className="flex-row items-center gap-1">
                    <span style={{
                      display: 'inline-block', marginTop: '2px', padding: '1px 7px',
                      borderRadius: 'var(--radius-full)', fontSize: '0.6rem', fontWeight: '800',
                      backgroundColor: badge.bg, color: badge.color,
                    }}>{t(badge.label)}</span>
                    {credentials?.license?.status === 'EXPIRED' && (
                      <span className="material-symbols-outlined text-[12px] text-error animate-pulse" title="LICENSE EXPIRED">report</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {(showExpanded || isMobileMenuOpen) && <VersionDisplay />}
        </nav>

        {/* Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 900 }} 
          />
        )}

        {/* ═══ Main Content ══════════════════════════════════ */}
        <main 
          key={location.pathname}
          className="dashboard-main-container w-full"
          style={{ 
            flexGrow: 1,
            width: '100%',
            maxWidth: '100%',
            overflowY: 'auto', 
            backgroundColor: isMobile ? 'var(--background)' : 'transparent',
            borderRadius: isMobile ? '0' : 'var(--radius-lg)',
            animation: 'fadeIn 0.18s ease-out forwards',
            padding: isMobile ? '1rem' : '0'
          }}
        >
          <Outlet />
        </main>
      </div>
      <OfflineStatusIndicator />
    </div>
  );
};

export default MainLayout;
