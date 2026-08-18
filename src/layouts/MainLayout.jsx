import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth.js';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import OfflineStatusIndicator from '../components/ui/OfflineStatusIndicator';
import ClinicalContextRibbon from '../components/ui/ClinicalContextRibbon';
import EnterpriseFooter from '../design-system/components/EnterpriseFooter';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { useEncounterStore } from '../modules/encounter/encounter.store.js';
import { useTriageStore } from '../modules/triage/triage.store.js';
import { usePatientClipboardShortcuts } from '../hooks/usePatientClipboardShortcuts.js';

// Enterprise 10-Domain Navigation Schema
const ENTERPRISE_NAV_SCHEMA = [
  {
    domain: 'DASHBOARD',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    domain: 'PATIENTS',
    label: 'Pasien & EMPI',
    icon: 'groups',
    items: [
      { name: 'Pencarian & EMPI Guard', path: '/patients', icon: 'person_search' },
      { name: 'Antrean Registrasi', path: '/front-office', icon: 'how_to_reg' },
      { name: 'Jadwal Temu & Booking', path: '/appointments', icon: 'calendar_month' },
      { name: 'Riwayat Kunjungan (Encounters)', path: '/encounters', icon: 'history' }
    ]
  },
  {
    domain: 'EMERGENCY',
    label: 'Gawat Darurat (IGD)',
    icon: 'emergency',
    items: [
      { name: 'Triase 5-Level (ATS/ESI)', path: '/triage', icon: 'emergency_home' },
      { name: 'Emergency Queue & Resus', path: '/emergency', icon: 'crisis_alert' },
      { name: 'ICU & Acuity Monitoring', path: '/icu-acuity', icon: 'monitor_heart' }
    ]
  },
  {
    domain: 'CLINICAL',
    label: 'Pelayanan Klinis',
    icon: 'stethoscope',
    items: [
      { name: 'Doctor Workspace (SOAP)', path: '/doctor-workspace', icon: 'stethoscope' },
      { name: 'Nursing Workspace & eMAR', path: '/nursing-workspace', icon: 'medication' },
      { name: 'EMR Rawat Inap (Ranap)', path: '/emr-ri', icon: 'bed' },
      { name: 'EMR Rawat Jalan (Rajal)', path: '/emr-rj', icon: 'personal_injury' }
    ]
  },
  {
    domain: 'DIAGNOSTICS',
    label: 'Layanan Diagnostik',
    icon: 'biotech',
    items: [
      { name: 'Laboratorium (LIS Vacutainer)', path: '/lab', icon: 'science' },
      { name: 'PACS & DICOM Web Viewer', path: '/radiology', icon: 'radiology' },
      { name: 'Modality Worklist (MWL)', path: '/worklist', icon: 'checklist' }
    ]
  },
  {
    domain: 'SURGERY',
    label: 'Kamar Bedah (IBS)',
    icon: 'theater_comedy',
    items: [
      { name: 'Surgery Command Board', path: '/surgery', icon: 'operating_room' },
      { name: 'JCI IPSG 4 WHO Checklist', path: '/operating-theatre', icon: 'fact_check' }
    ]
  },
  {
    domain: 'PHARMACY',
    label: 'Farmasi Enterprise',
    icon: 'local_pharmacy',
    items: [
      { name: 'Multi-Depot FEFO & Telaah', path: '/pharmacy-enterprise', icon: 'inventory_2' },
      { name: 'Clinical Dispensing', path: '/pharmacy', icon: 'vaccines' }
    ]
  },
  {
    domain: 'BLOOD_BANK',
    label: 'Bank Darah (BDRS)',
    icon: 'bloodtype',
    items: [
      { name: 'Cold Chain, Crossmatch & MTP', path: '/blood-bank', icon: 'bloodtype' }
    ]
  },
  {
    domain: 'FINANCE',
    label: 'Keuangan & Casemix',
    icon: 'receipt_long',
    items: [
      { name: 'Billing, INA-CBG & V-Claim', path: '/billing', icon: 'payments' }
    ]
  },
  {
    domain: 'ADMINISTRATION',
    label: 'Tata Kelola & Audit',
    icon: 'admin_panel_settings',
    items: [
      { name: 'JCI Forensic Audit Trail', path: '/audit-trail', icon: 'security' },
      { name: 'Bed Management Center', path: '/bed-management', icon: 'single_bed' },
      { name: 'Kredensial & Hak Klinis', path: '/staff-privileges', icon: 'badge' },
      { name: 'Master Data Terpadu (18 Modul)', path: '/master-data', icon: 'dataset' }
    ]
  }
];

export default function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const { stressLevel } = useStressMonitor();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDomain, setOpenDomain] = useState(() => {
    // Open active section automatically based on current path
    const active = ENTERPRISE_NAV_SCHEMA.find(sec => 
      sec.items?.some(it => location.pathname.startsWith(it.path))
    );
    return active ? active.domain : 'DASHBOARD';
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('RSUP Nasional - Pusat Rujukan');
  const [selectedDepartment, setSelectedDepartment] = useState('Semua Departemen Pelayanan');

  const { addPatient, patients } = usePatientStore();
  const { openEncounter, setLiveContext } = useEncounterStore();
  const { setOperationalMode } = useTriageStore();
  const [isCreatingEmergency, setIsCreatingEmergency] = useState(false);

  usePatientClipboardShortcuts();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Command Palette Keyboard Shortcut (Ctrl+K / Cmd+K)
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

  // Compute Breadcrumb from location.pathname
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Dashboard', path: '/dashboard' }];
    for (const sec of ENTERPRISE_NAV_SCHEMA) {
      if (sec.items) {
        const matchedItem = sec.items.find(it => location.pathname === it.path || location.pathname.startsWith(it.path + '/'));
        if (matchedItem) {
          crumbs.push({ label: sec.label, path: sec.items[0].path });
          crumbs.push({ label: matchedItem.name, path: matchedItem.path });
          return crumbs;
        }
      }
    }
    return crumbs;
  };

  const handleCreateEmergencyPatient = async () => {
    if (isCreatingEmergency) return;
    setIsCreatingEmergency(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const uniqueCode = Math.random().toString(36).substring(2, 5).toUpperCase();
      
      const newPatient = await addPatient({
        name: `Mr. X (${dateStr}, ${timeStr}) - #${uniqueCode}`,
        demographics: { dob: '1970-01-01', gender: 'U' },
        mrn: `MRX-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${uniqueCode}`,
        status: 'EMERGENCY'
      }, currentUser?.email || 'system');
      
      const encounterId = await openEncounter({
        patientId: newPatient.id,
        encounterType: 'emergency',
        chiefComplaint: 'Trauma Akut / Emergency',
        status: 'TRIAGE',
        triageStatus: 'PENDING',
        department: 'IGD'
      }, currentUser?.email || 'system');

      setLiveContext(newPatient.id, encounterId);
      setOperationalMode('RAPID');
      setIsSearchOpen(false);
      navigate('/triage');
    } catch (error) {
      console.error('Gagal membuat pasien darurat:', error);
    } finally {
      setIsCreatingEmergency(false);
    }
  };

  // Global Quick Search Filter (Navigation & Real-time Patients)
  const quickNavSearchResults = searchQuery.trim() === '' ? [] : [
    ...(patients || []).map(p => ({
      title: `${p.name || 'Pasien'} (${p.mrn || '-'})`,
      type: 'PATIENT',
      path: '/patients'
    })),
    { title: 'Instalasi Gawat Darurat & Triase', type: 'MODULE', path: '/triage' },
    { title: 'Electronic Medical Record (EMR)', type: 'MODULE', path: '/emr' },
    { title: 'Laboratorium LIS & Accessioning', type: 'MODULE', path: '/lab' },
    { title: 'Radiologi PACS DICOM Viewer', type: 'MODULE', path: '/radiology' },
    { title: 'Farmasi & Multi-Depot FEFO', type: 'MODULE', path: '/pharmacy-enterprise' },
    { title: 'Rawat Inap & Bed Management', type: 'MODULE', path: '/bed-management' },
    { title: 'Kasir & Revenue Cycle Billing', type: 'MODULE', path: '/billing' }
  ].filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row h-screen relative overflow-hidden font-sans">
      
      {/* ─── Global Enterprise Sidebar (Desktop) ─── */}
      <aside 
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-md ${
          isCollapsed ? 'w-[76px]' : 'w-[280px]'
        }`}
      >
        {/* Top Brand Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 bg-[#015C80] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#015C80]/30 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">local_hospital</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-[#015C80] dark:text-cyan-400">NurseFlow</span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Enterprise HIS 2026</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar text-xs">
          {ENTERPRISE_NAV_SCHEMA.map((section) => {
            const hasItems = section.items && section.items.length > 0;
            const isSingle = !hasItems;
            const isActiveSingle = isSingle && location.pathname === section.path;
            const isSectionActive = hasItems && section.items.some(it => location.pathname === it.path || location.pathname.startsWith(it.path + '/'));
            const isExpanded = openDomain === section.domain || isSectionActive;

            if (isSingle) {
              return (
                <Link
                  key={section.domain}
                  to={section.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                    isActiveSingle
                      ? 'bg-[#015C80] text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#015C80]'
                  }`}
                  title={section.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                  {!isCollapsed && <span className="font-extrabold">{section.label}</span>}
                </Link>
              );
            }

            return (
              <div key={section.domain} className="space-y-0.5">
                {/* Domain Header / Toggle */}
                <button
                  type="button"
                  onClick={() => setOpenDomain(openDomain === section.domain ? null : section.domain)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                    isSectionActive
                      ? 'text-[#015C80] dark:text-cyan-400 bg-slate-100/70 dark:bg-slate-800/60 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={section.label}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                    {!isCollapsed && <span className="font-bold">{section.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className={`material-symbols-outlined text-[16px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  )}
                </button>

                {/* Submenu Items */}
                {!isCollapsed && isExpanded && (
                  <div className="pl-9 pr-1 py-1 space-y-0.5 border-l-2 border-[#015C80]/30 ml-4 animate-in slide-in-from-top-1 fade-in duration-150">
                    {section.items.map((item) => {
                      const isItemActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            isItemActive
                              ? 'bg-[#015C80] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-[#015C80] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#015C80] text-white flex items-center justify-center font-black text-xs">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.email || 'dr. Budi Santoso, Sp.B'}
                </span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-black">
                  SIP/STR VERIFIED
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 cursor-pointer"
            title="Keluar (Logout)"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Navigation Drawer (320px - 1024px) ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Slide-out Drawer */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200 z-10">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#015C80] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#015C80]/30">
                  <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-tight text-[#015C80] dark:text-cyan-400">NurseFlow</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Enterprise HIS</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar text-xs">
              {ENTERPRISE_NAV_SCHEMA.map((section) => {
                const hasItems = section.items && section.items.length > 0;
                if (!hasItems) {
                  const isActive = location.pathname === section.path;
                  return (
                    <Link
                      key={section.domain}
                      to={section.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                        isActive
                          ? 'bg-[#015C80] text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                      <span>{section.label}</span>
                    </Link>
                  );
                }

                return (
                  <div key={section.domain} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setOpenDomain(openDomain === section.domain ? null : section.domain)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                        <span>{section.label}</span>
                      </div>
                      <span className={`material-symbols-outlined text-[16px] transition-transform ${openDomain === section.domain ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {openDomain === section.domain && (
                      <div className="pl-9 pr-1 py-1 space-y-0.5 border-l-2 border-[#015C80]/30 ml-4">
                        {section.items.map((item) => {
                          const isItemActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-bold ${
                                isItemActive
                                  ? 'bg-[#015C80] text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                              <span className="truncate">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#015C80] text-white flex items-center justify-center font-black text-xs">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                  {currentUser?.email || 'dr. Budi Santoso'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Container ─── */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
        isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[280px]'
      }`}>
        {/* 1. Global Patient Context Ribbon (Sticky Top) */}
        <ClinicalContextRibbon />

        {/* 2. Top Navigation Bar (Facility, Breadcrumb & Global Search) */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs z-30">
          {/* Left: Mobile Hamburger, Breadcrumbs & Facility Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Hamburger Button for Mobile (< 1024px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-500">
              {getBreadcrumbs().map((c, i, arr) => (
                <React.Fragment key={c.path + i}>
                  {i > 0 && <span className="text-slate-400">/</span>}
                  <Link 
                    to={c.path} 
                    className={i === arr.length - 1 ? 'text-[#015C80] dark:text-cyan-400 font-black' : 'hover:text-slate-800 dark:hover:text-white'}
                  >
                    {c.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>

            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

            {/* Facility Selector */}
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer max-w-[200px] sm:max-w-none truncate"
            >
              <option value="RSUP Nasional - Pusat Rujukan">🏥 RSUP Nasional</option>
              <option value="RSUD Satelit IGD & Rawat Inap">🏥 RSUD Satelit IGD</option>
              <option value="Klinik Pratama Rawat Jalan">🏥 Klinik Pratama Terpadu</option>
            </select>
          </div>

          {/* Center / Right: Global Search Trigger & Utility Controls */}
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-[#015C80]">search</span>
              <span className="hidden md:inline">Cari Pasien, Obat, Lab...</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono text-[9px] font-bold">
                Ctrl+K
              </kbd>
            </button>

            {/* Language Switcher & Theme Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <LanguageSwitcher compact />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* 3. Global Search & Command Palette Modal (Ctrl+K) */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#015C80] text-[22px]">search</span>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Pasien (Nama/MRN/NIK), Dokter, Obat, Hasil Lab, Jadwal Operasi, Kantong Darah..."
                  className="flex-1 bg-transparent border-none outline-hidden text-slate-900 dark:text-white font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] font-bold cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Search Results List */}
              <div className="max-h-80 overflow-y-auto p-3 space-y-1">
                {searchQuery.trim() === '' ? (
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aksi Cepat Medis:</span>
                    <button
                      type="button"
                      onClick={handleCreateEmergencyPatient}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">emergency</span>
                      <div className="text-left">
                        <div className="text-xs font-black">Registrasi Cepat Pasien Darurat (Mr. X)</div>
                        <div className="text-[10px] text-rose-600/80">Bypass administrasi, langsung buka triase IGD</div>
                      </div>
                    </button>
                  </div>
                ) : quickNavSearchResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    Tidak ditemukan data rekam medis yang sesuai dengan "{searchQuery}".
                  </div>
                ) : (
                  quickNavSearchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(res.path);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">{res.title}</span>
                      <span className="px-2 py-0.5 rounded font-mono font-black text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {res.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Dynamic Page Workspace (Outlet) */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <Outlet />
        </div>

        {/* 5. Global Enterprise Footer */}
        <EnterpriseFooter />
      </div>

      <OfflineStatusIndicator />
    </div>
  );
}
