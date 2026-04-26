import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth.js';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import OfflineStatusIndicator from '../components/ui/OfflineStatusIndicator';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';

// Reusing the same NAV_SCHEMA but adapting it for the new UI
const NAV_SCHEMA = [
  { label: 'nav.clinical', items: [
    { name: 'nav.dashboard',   path: '/dashboard',  icon: 'dashboard',           roles: null },
    { name: 'nav.patients',    path: '/patients',   icon: 'groups',              roles: null },
    { name: 'nav.encounters',  path: '/encounters', icon: 'local_hospital',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.triage',      path: '/triage',     icon: 'emergency',           roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr_rj',      path: '/emr-rj',     icon: 'personal_injury',     roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr_ri',      path: '/emr-ri',     icon: 'bed',                 roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.surgery',     path: '/surgery',    icon: 'theater_comedy',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.credentials', path: '/credentials', icon: 'badge',              roles: null },
  ]},
  { label: 'nav.operational', items: [
    { name: 'nav.worklist',    path: '/worklist',   icon: 'task_alt',            roles: ['NURSE','ADMIN'] },
    { name: 'nav.pharmacy',    path: '/pharmacy',   icon: 'local_pharmacy',      roles: ['PHARMACIST','DOCTOR','ADMIN'] },
    { name: 'nav.billing',     path: '/billing',    icon: 'receipt_long',        roles: ['DOCTOR','ADMIN'] },
    { name: 'nav.guide',      path: '/guide',      icon: 'menu_book',           roles: null },
  ]},
  { label: 'nav.administration', admin: true, items: [
    { name: 'nav.admin',       path: '/admin',      icon: 'admin_panel_settings', roles: ['ADMIN'] },
    { name: 'nav.master_hub',   path: '/admin/master-hub', icon: 'account_tree',        roles: ['ADMIN'] },
    { name: 'nav.executive',    path: '/executive',    icon: 'monitoring',        roles: ['ADMIN', 'SUPERVISOR'] },
    { name: 'nav.moi',          path: '/information-governance', icon: 'shield_lock', roles: ['ADMIN', 'SUPERVISOR', 'DOCTOR'] },
    { name: 'nav.pfr',          path: '/pfr/dashboard', icon: 'gavel', roles: ['ADMIN', 'SUPERVISOR', 'DOCTOR', 'NURSE'] },
    { name: 'nav.gld_report',   path: '/gld-report',   icon: 'warning',           roles: null }, // Anyone can report
  ]},
];

const MainLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const { stressLevel, focusMode } = useStressMonitor();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const scrollRef = React.useRef(null);
  
  // 👑 EMERGENCY FALLBACK (Ensures visibility even if Auth State is stale)
  const ADMIN_WHITELIST = ['obbyvior@gmail.com', 'ivoryperfumecoorp@gmail.com', 'admin@nurseflow.id', 'patient.test@nurseflow.local'];
  const effectiveRole = (currentUser?.email && ADMIN_WHITELIST.includes(currentUser.email.toLowerCase())) ? 'ADMIN' : (role || 'GUEST');
  
  // Hardened visibility: Always show if role matches, OR if we are literally ON an admin path
  const isVisible = (item) => {
    if (effectiveRole === 'ADMIN') return true;
    if (location.pathname.startsWith('/admin')) return true; // Nuclear option: Show all if in Admin Zone
    return !item.roles || item.roles.includes(effectiveRole);
  };

  // 🖱️ SMART SCROLL (Follow Mouse Location to prevent collisions/hidden items)
  const handleSidebarMouseMove = (e) => {
    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    
    // Near top? Scroll up. Near bottom? Scroll down. (Slow and smooth)
    if (mouseY < 80) {
      scrollRef.current.scrollTop -= 5;
    } else if (mouseY > height - 80) {
      scrollRef.current.scrollTop += 5;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`bg-background text-on-surface font-body antialiased flex flex-col lg:flex-row h-screen relative overflow-hidden ${focusMode ? 'focus-mode-active' : ''}`}>
      
      {/* Simulator Focus Overlay */}
      <div className="focus-mode-overlay" />

      {/* SideNavBar (Desktop/Large Tablet) */}
      <nav 
        className={`hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low border-r border-outline-variant pt-8 shadow-[10px_0_40px_rgba(0,0,0,0.08)] ${stressLevel === 'critical' ? 'border-r-red-500' : ''} transition-colors duration-500`}
        onMouseMove={handleSidebarMouseMove}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Sidebar Header & Branding */}
        <div className="px-6 mb-8">
          <div className="flex-row items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex-row items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-2xl">emergency</span>
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold text-on-surface tracking-tight leading-none mb-1">NurseFlow</h1>
              <div className="flex-row items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">JCI Command Center</span>
              </div>
            </div>
          </div>

          {/* Role-Based View Indicator */}
          <div className="mt-4 p-3 bg-surface-container rounded-lg border border-outline-variant relative overflow-hidden shadow-sm">
            <div className="flex-row items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-on-surface/50 uppercase tracking-wider">Active Session</p>
              <span className="flex-row items-center gap-0.5 text-[9px] font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-1 rounded border border-green-200 dark:border-green-800">
                <span className="material-symbols-outlined text-[10px]">fingerprint</span> MFA
              </span>
            </div>
            <div className="flex-row items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-on-surface truncate">{currentUser?.displayName || currentUser?.email}</span>
            </div>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto custom-scrollbar px-2" 
          ref={scrollRef}
          style={{ overscrollBehavior: 'contain' }}
        >
          <ul className="flex flex-col font-label text-sm font-medium">
            {NAV_SCHEMA.map((section, idx) => {
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <li className="h-px bg-outline-variant/30 my-4 mx-4"></li>}
                  <li className="px-6 mb-2">
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{t(section.label)}</p>
                  </li>
                  {section.items.filter(isVisible).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.name} className="px-2 mb-1">
                        <Link
                          to={item.path}
                          className={`flex-row items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative ${
                            isActive 
                              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                          }`}
                        >
                          <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
                            {item.icon}
                          </span>
                          <span className="font-semibold">{t(item.name)}</span>
                          {isActive && (
                            <span className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </ul>
        </div>

        {/* System & Profile Footer */}
        <div className="mt-auto flex flex-col font-label text-sm font-medium border-t border-outline-variant py-6 px-4 bg-surface-container-low shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          
          {/* Unified System Preferences */}
          <div className="mb-4 flex-row items-center justify-around p-1.5 bg-surface-container rounded-2xl border border-outline-variant shadow-sm">
            <LanguageSwitcher compact />
            <div className="h-4 w-px bg-outline-variant/50"></div>
            <ThemeToggle />
          </div>

          <button onClick={handleLogout} className="flex-row items-center gap-3 text-on-surface-variant px-3 py-2.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all w-full text-left font-bold">
            <span className="material-symbols-outlined">logout</span>
            {t('nav.logout')}
          </button>
        </div>
      </nav>

      {/* TopNavBar (Mobile only) */}
      <header className="lg:hidden flex-row items-center justify-between w-full px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline-variant sticky top-0 z-40">
        <div className="flex-row items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="material-symbols-outlined text-slate-700">menu</button>
          <h1 className="font-headline text-xl font-extrabold tracking-tighter text-blue-800 dark:text-blue-200">NurseFlow</h1>
        </div>
        <div className="flex-row items-center gap-3">
          <ThemeToggle />
          <button className="text-error font-label text-xs font-bold uppercase flex-row items-center gap-1 bg-error-container/50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-sm">warning</span> Alert
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative bg-surface w-64 h-full shadow-xl flex flex-col overflow-y-auto">
            <div className="p-4 border-b flex-row items-center justify-between">
              <h2 className="font-headline font-bold text-primary">NurseFlow HIS</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="material-symbols-outlined">close</button>
            </div>
            <ul className="flex-1 p-4 font-label text-sm flex flex-col gap-2">
              {NAV_SCHEMA.flatMap(section => section.items.filter(isVisible)).map(item => (
                <li key={item.name}>
                  <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="flex-row items-center gap-3 p-3 rounded-lg text-on-surface hover:bg-surface-container">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-4 pt-4 border-t border-outline-variant">
                <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full text-left">
                  <span className="material-symbols-outlined">logout</span> {t('nav.logout')}
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 lg:ml-64 bg-background min-w-0 h-screen overflow-hidden flex flex-col transition-colors duration-500 relative">
        <Outlet />
      </main>

      <OfflineStatusIndicator />
    </div>
  );
};

export default MainLayout;
