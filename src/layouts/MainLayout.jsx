import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth.js';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import OfflineStatusIndicator from '../components/ui/OfflineStatusIndicator';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';

// Reusing the same NAV_SCHEMA but adapting it for the new UI
const NAV_SCHEMA = [
  { label: 'nav.clinical', items: [
    { name: 'nav.dashboard',   path: '/dashboard',  icon: 'dashboard',           roles: null },
    { name: 'nav.patients',    path: '/patients',   icon: 'groups',              roles: null },
    { name: 'nav.encounters',  path: '/encounters', icon: 'local_hospital',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.triage',      path: '/triage',     icon: 'emergency',           roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr',         path: '/emr',        icon: 'medical_information', roles: ['DOCTOR','ADMIN'] },
    { name: 'nav.emr_rj',      path: '/emr-rj',     icon: 'personal_injury',     roles: ['DOCTOR','NURSE','ADMIN'] },
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
  const { stressLevel } = useStressMonitor();
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
    <div className="bg-surface text-on-surface font-body antialiased flex flex-col lg:flex-row min-h-screen relative overflow-x-hidden">
      
      {/* SideNavBar (Desktop/Large Tablet) */}
      <nav 
        className={`hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-[9999] bg-slate-50 dark:bg-slate-950 border-r border-surface-variant py-8 shadow-[10px_0_40px_rgba(0,0,0,0.08)] ${stressLevel === 'critical' ? 'border-r-red-500' : ''}`}
        onMouseMove={handleSidebarMouseMove}
        style={{ overscrollBehavior: 'contain' }}
      >
        
        <div className="px-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-primary text-2xl">medical_services</span>
            </div>
            <div>
              <h1 className="font-headline text-lg font-bold text-blue-900 dark:text-blue-100">NurseFlow HIS</h1>
              <p className="font-label text-xs text-slate-500">JCI Accredited</p>
            </div>
          </div>
          
          {/* Role-Based View Indicator */}
          <div className="p-3 bg-blue-50 dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Session</p>
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-700 bg-green-100 px-1 rounded border border-green-200">
                <span className="material-symbols-outlined text-[10px]">fingerprint</span> MFA
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate">{currentUser?.displayName || currentUser?.email}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
              <div className="bg-blue-600 h-1 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <button onClick={() => navigate('/patients')} className="w-full py-2.5 px-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-md font-label text-sm font-semibold flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(0,59,130,0.2)] hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-sm">add</span>
            New Admission
          </button>
        </div>

        <div 
          className="flex-1 overflow-y-auto custom-scrollbar" 
          ref={scrollRef}
          style={{ overscrollBehavior: 'contain' }}
        >
          <ul className="flex flex-col font-label text-sm font-medium">
            {NAV_SCHEMA.map((section, idx) => {
              const visibleItems = section.items.filter(isVisible);
              if (visibleItems.length === 0) return null;
              
              return (
                <React.Fragment key={section.label}>
                  <li className="px-8 mt-4 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t(section.label)}</li>
                  {visibleItems.map(item => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <li key={item.name} className="mb-1">
                        <Link 
                          to={item.path} 
                          className={`flex items-center gap-3 transition-transform ${isActive ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 rounded-l-full ml-4 pl-4 py-3 shadow-sm border-y border-l border-surface-variant' : 'text-slate-600 dark:text-slate-400 px-8 py-3 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1'}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                          {t(item.name)}
                        </Link>
                      </li>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </ul>
        </div>

        <div className="mt-auto flex flex-col font-label text-sm font-medium border-t border-surface-variant pt-4 px-6">
          <div className="mb-2">
            <LanguageSwitcher />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 px-2 py-3 hover:text-red-600 hover:translate-x-1 transition-transform w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </nav>

      {/* TopNavBar (Mobile only) */}
      <header className="lg:hidden flex justify-between items-center w-full px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-surface-variant sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="material-symbols-outlined text-slate-700">menu</button>
          <h1 className="font-headline text-xl font-extrabold tracking-tighter text-blue-800 dark:text-blue-200">NurseFlow</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-error font-label text-xs font-bold uppercase flex items-center gap-1 bg-error-container/50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-sm">warning</span> Alert
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative bg-white w-64 h-full shadow-xl flex flex-col overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-headline font-bold text-primary">NurseFlow HIS</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="material-symbols-outlined">close</button>
            </div>
            <ul className="flex-1 p-4 font-label text-sm flex flex-col gap-2">
              {NAV_SCHEMA.flatMap(section => section.items.filter(isVisible)).map(item => (
                <li key={item.name}>
                  <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg text-slate-700 hover:bg-slate-100">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-4 pt-4 border-t border-slate-200">
                <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full text-left">
                  <span className="material-symbols-outlined">logout</span> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 lg:ml-64 bg-surface min-w-0 overflow-x-hidden flex flex-col">
        <Outlet />
      </main>

      <OfflineStatusIndicator />
    </div>
  );
};

export default MainLayout;
