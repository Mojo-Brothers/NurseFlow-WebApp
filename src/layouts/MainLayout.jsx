import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth.js';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import OfflineStatusIndicator from '../components/ui/OfflineStatusIndicator';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { useEncounterStore } from '../modules/encounter/encounter.store.js';
import { useTriageStore } from '../modules/triage/triage.store.js';
import { usePatientClipboardShortcuts } from '../hooks/usePatientClipboardShortcuts.js';

const NAV_SCHEMA = [
  { label: 'nav.clinical', items: [
    { name: 'nav.dashboard',   path: '/dashboard',  icon: 'dashboard',           roles: null },
    { name: 'nav.patients',    path: '/patients',   icon: 'groups',              roles: null },
    { name: 'nav.appointments',path: '/appointments', icon: 'calendar_month',    roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'Review Design UI Modul!', path: '/review-design-ui-modul', icon: 'palette', roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'Galeri Komponen Modular', path: '/modular-design-review', icon: 'widgets', roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.encounters',  path: '/encounters', icon: 'local_hospital',      roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.triage',      path: '/triage',     icon: 'emergency',           roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.patient_care', path: '/patient-care', icon: 'medical_services',    roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr_rj',      path: '/emr-rj',     icon: 'personal_injury',     roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.emr_ri',      path: '/emr-ri',     icon: 'bed',                 roles: ['DOCTOR','NURSE','ADMIN'] },
    { name: 'nav.surgery',     path: '/surgery',    icon: 'theater_comedy',      roles: ['DOCTOR','NURSE','ADMIN'] },
  ]},
  { label: 'nav.operational', items: [
    { name: 'nav.worklist',    path: '/worklist',   icon: 'task_alt',            roles: ['NURSE','ADMIN'] },
    { name: 'nav.pharmacy',    path: '/pharmacy',   icon: 'local_pharmacy',      roles: ['PHARMACIST','DOCTOR','ADMIN'] },
    { 
      name: 'nav.inventory',   
      path: '/inventory',  
      icon: 'inventory_2',         
      roles: ['NURSE','PHARMACIST','DOCTOR','ADMIN'],
      children: [
        { name: 'nav.inv_material_request', path: '/inventory/material-request', icon: 'assignment' },
        { name: 'nav.inv_item_department',  path: '/inventory/item-department',  icon: 'inventory' },
        { name: 'nav.inv_mutasi_barang',    path: '/inventory/mutasi-barang',    icon: 'swap_horiz' },
        { name: 'nav.inv_receive_mutasi',   path: '/inventory/receive-mutasi',   icon: 'local_shipping' },
        { name: 'nav.inv_internal_use',     path: '/inventory/internal-use',     icon: 'corporate_fare' },
        { name: 'nav.inv_kartu_stock',      path: '/inventory/kartu-stock',      icon: 'menu_book' },
        { name: 'nav.inv_stock_adjustment', path: '/inventory/stock-adjustment', icon: 'balance' },
      ]
    },
    { name: 'nav.billing',     path: '/billing',    icon: 'receipt_long',        roles: ['DOCTOR','ADMIN'] },
    { name: 'nav.master_services', path: '/admin/services', icon: 'medical_information', roles: ['DOCTOR','ADMIN'] },
  ]},
  { label: 'nav.administration', items: [
    { name: 'nav.admin',       path: '/admin',      icon: 'admin_panel_settings', roles: ['ADMIN'] },
    { name: 'Manajemen Data Dummy HIS', path: '/admin/dummy-data', icon: 'tune', roles: null },
    { name: 'SDM & Hak Akses (RBAC)', path: '/admin/staff-access', icon: 'badge', roles: ['ADMIN', 'SUPERVISOR'] },
    { name: 'nav.executive',    path: '/executive',    icon: 'monitoring',        roles: ['ADMIN', 'SUPERVISOR'] },
    { name: 'System Performance Suite', path: '/performance-diagnostics', icon: 'speed', roles: null },
  ]},
];

const MainLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const { stressLevel } = useStressMonitor();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollRef = useRef(null);
  const { addPatient } = usePatientStore();
  const { openEncounter, setLiveContext } = useEncounterStore();
  const { setOperationalMode } = useTriageStore();
  const [isCreatingEmergency, setIsCreatingEmergency] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+A scope protection, Ctrl+C MRN copy, Ctrl+V MRN paste)
  usePatientClipboardShortcuts();
  
  const ADMIN_WHITELIST = ['obbyvior@gmail.com', 'ivoryperfumecoorp@gmail.com', 'admin@nurseflow.id'];
  const effectiveRole = (currentUser?.email && ADMIN_WHITELIST.includes(currentUser.email.toLowerCase())) ? 'ADMIN' : (role || 'DOCTOR');
  
  const isVisible = (item) => {
    // Always show all enterprise menus in development / demo mode
    return true;
  };

  // Global Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEmergencyPatient = async () => {
    if (isCreatingEmergency) return;
    setIsCreatingEmergency(true);
    try {
      // 1. Buat Pasien Anonim
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const uniqueCode = Math.random().toString(36).substring(2, 5).toUpperCase();
      
      const newPatient = await addPatient({
        name: `Mr. X (${dateStr}, ${timeStr}) - #${uniqueCode}`,
        demographics: {
          dob: '1970-01-01',
          gender: 'U'
        },
        mrn: `MRX-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${uniqueCode}`,
        status: 'EMERGENCY'
      }, currentUser?.email || 'system');
      
      // 2. Buat Encounter
      const encounterId = await openEncounter({
        patientId: newPatient.id,
        encounterType: 'emergency',
        chiefComplaint: '', // Provide empty string to prevent undefined crash
        status: 'TRIAGE',
        triageStatus: 'PENDING',
        department: 'IGD'
      }, currentUser?.email || 'system');

      // 3. Set Context & Navigate
      setLiveContext(newPatient.id, encounterId);
      setOperationalMode('RAPID');
      setIsSearchOpen(false);
      navigate('/triage');
    } catch (error) {
      console.error("Gagal membuat pasien darurat:", error);
    } finally {
      setIsCreatingEmergency(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body antialiased flex flex-col lg:flex-row h-screen relative overflow-hidden">
      
      {/* ─── Premium Sidebar Matching Screenshot ─── */}
      <nav 
        className={`hidden lg:flex flex-col h-screen w-[260px] fixed left-0 top-0 z-40 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 shadow-sm ${stressLevel === 'critical' ? 'shadow-[inset_-4px_0_15px_rgba(220,38,38,0.2)]' : ''}`}
        ref={scrollRef}
      >
        {/* Branding Header */}
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-[#007399] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#007399]/30 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">medical_services</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-headline font-black tracking-tight leading-none text-[#1E40AF] dark:text-cyan-400">NurseFlow</h1>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mt-0.5">EHIS 2026</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_SCHEMA.map((section, idx) => {
              const visibleItems = section.items.filter(isVisible);
              if (visibleItems.length === 0) return null;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-3 mx-2"></div>}
                  <li className="px-3.5 mb-1.5 mt-2">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{t(section.label)}</p>
                  </li>
                  {visibleItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = item.path === '/admin' 
                      ? location.pathname === '/admin'
                      : (location.pathname === item.path || (hasChildren && location.pathname.startsWith(item.path)));
                    const isExpanded = isActive || (hasChildren && location.pathname.startsWith(item.path));

                    return (
                      <li key={item.name} className="flex flex-col gap-1">
                        <Link
                          to={hasChildren ? item.children[0].path : item.path}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 group relative cursor-pointer ${
                            isActive 
                              ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25 scale-[1.01]' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-[#007399] font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-[20px] transition-transform ${isActive ? 'text-white' : 'text-slate-500 group-hover:scale-110'}`}>
                              {item.icon}
                            </span>
                            <span className="font-extrabold text-[13px] tracking-tight">{t(item.name)}</span>
                          </div>
                          {hasChildren && !isActive && (
                            <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                          )}
                          {isActive && (
                            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm ml-auto shrink-0"></span>
                          )}
                        </Link>

                        {/* Render Sub-menu Children if present */}
                        {hasChildren && isExpanded && (
                          <ul className="pl-3 flex flex-col gap-1 my-1 border-l-2 border-[#007399]/30 ml-4 animate-in slide-in-from-top-1 fade-in duration-200">
                            {item.children.map(child => {
                              const isChildActive = location.pathname === child.path;
                              return (
                                <li key={child.name}>
                                  <Link
                                    to={child.path}
                                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                      isChildActive
                                        ? 'bg-[#007399]/15 text-[#007399] dark:text-cyan-400 font-black'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-[#007399] hover:bg-slate-100 dark:hover:bg-slate-900'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">{child.icon}</span>
                                    <span>{t(child.name)}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </ul>
        </div>

        {/* User & Settings Panel */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
          <div className="flex items-center justify-between mb-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <LanguageSwitcher compact />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-2xl bg-[#007399] text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
              {currentUser?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.email || 'admin@nurseflow.id'}</span>
              <span className="text-[10px] font-black text-[#007399] dark:text-cyan-400 uppercase tracking-wider">{effectiveRole}</span>
            </div>
            <button onClick={handleLogout} className="w-8 h-8 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer" title="Keluar">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 lg:ml-[260px] bg-background min-w-0 h-screen overflow-hidden flex flex-col relative z-0">
        
        {/* Global Command Bar (Mac Spotlight Style) */}
        {isSearchOpen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="glass-panel rounded-2xl flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden backdrop-blur-xl">
              <div className="p-4 flex-row items-center gap-3 border-b border-white/5">
                <span className="material-symbols-outlined text-primary ml-2">search</span>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cari Pasien (Nama, MRN, NIK) atau ketik aksi..."
                  className="flex-1 bg-transparent border-none text-on-surface focus:ring-0 text-sm font-medium placeholder-on-surface-variant/50"
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                />
                <div className="px-2 py-1 bg-surface-container rounded text-[10px] font-mono font-bold text-on-surface-variant">ESC</div>
              </div>
              
              <div className="flex flex-col p-2 bg-surface-container-lowest/50">
                <span className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Tindakan Cepat</span>
                
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-high transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Registrasi Pasien Baru</span>
                    <span className="text-[10px] font-medium text-on-surface-variant">Daftarkan pasien dengan NIK/KTP terintegrasi SATUSEHAT</span>
                  </div>
                </button>

                <button 
                  onClick={handleCreateEmergencyPatient}
                  disabled={isCreatingEmergency}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-error/10 transition-colors text-left group mt-1 ${isCreatingEmergency ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center group-hover:bg-error group-hover:text-white transition-colors">
                    {isCreatingEmergency ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">emergency</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-error">Buat Pasien Darurat (Anonim)</span>
                    <span className="text-[10px] font-medium text-error/70">Bypass administrasi, langsung masuk antrean Triase IGD</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          <Outlet />
        </div>
      </main>

      <OfflineStatusIndicator />
    </div>
  );
};

export default MainLayout;
