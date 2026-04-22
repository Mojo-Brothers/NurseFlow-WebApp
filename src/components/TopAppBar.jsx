import './TopAppBar.css';
import { useStressMonitor } from '../core/hooks/useStressMonitor.js';
import { Link, useLocation } from 'react-router-dom';
import { useEncounterStore } from '../modules/encounter/encounter.store.js';
import { useAuthStore } from '../modules/auth/auth.store.js';
import { useEffect } from 'react';

const TopAppBar = ({ onMenuClick }) => {
  const { stressLevel, classicUI, toggleClassicUI, triggerCrisis } = useStressMonitor();
  const location = useLocation();
  const { activeEncounters, fetchActiveEncounters } = useEncounterStore();
  const { role } = useAuthStore();

  useEffect(() => {
    fetchActiveEncounters();
  }, [fetchActiveEncounters]);

  const criticalCount = activeEncounters.filter(e => (e.last_news2 || 0) >= 7).length;
  
  return (
    <header className="top-app-bar" style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '3.25rem',
      backgroundColor: 'var(--surface)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--outline-variant)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1rem'
    }}>
      <div className="flex items-center gap-6">
        <button 
          className="material-symbols-outlined md:hidden p-2"
          style={{ display: 'none' }} // Show via CSS media query
          id="mobile-menu-btn"
          onClick={onMenuClick}
        >
          menu
        </button>
        <div className="flex-column">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant m-0 opacity-60">Kamis, 24 Oct 2026</p>
          <h1 className="brand-title" style={{ 
            fontSize: '1.15rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0, color: 'var(--on-surface)'
          }}>Selamat Pagi, Ns. Sarah</h1>
        </div>
        
        <div className="flex items-center px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant hide-on-mobile">
          <div className="w-2 h-2 rounded-full bg-success mr-2"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">UNIT IGD • STATION 1</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="nav-links hide-on-focus flex-row gap-4 hide-on-mobile">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/ward-monitor" className={`nav-link ${location.pathname === '/ward-monitor' ? 'active' : ''} flex-row items-center gap-1.5`}>
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Monitor
            {criticalCount > 0 && (
              <span className="bg-error text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {criticalCount}
              </span>
            )}
          </Link>
          <Link to="/bed-management" className={`nav-link ${location.pathname === '/bed-management' ? 'active' : ''} flex-row items-center gap-1.5`}>
            <span className="material-symbols-outlined text-[16px]">bed</span>
            Bed Map
          </Link>
          {(role === 'SUPERVISOR' || role === 'ADMIN') && (
            <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''} flex-row items-center gap-1.5`}>
              <span className="material-symbols-outlined text-[16px]">monitoring</span>
              Analytics
            </Link>
          )}
          <Link to="/worklist" className={`nav-link ${location.pathname === '/worklist' ? 'active' : ''}`}>Worklist</Link>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hide-on-mobile" style={{ 
          backgroundColor: 'var(--surface-container-low)', 
          border: '1px solid var(--outline-variant)',
          backdropFilter: 'blur(8px)'
        }}>
          <span className="text-[9px] font-black text-on-surface-variant uppercase opacity-40 mr-1.5 tracking-widest">Simulator</span>
          <button onClick={() => triggerCrisis('none')} className="btn-icon-sm" style={{ opacity: stressLevel === 'none' ? 1 : 0.4 }} title="Restore Standard"><span className="material-symbols-outlined text-[16px]">refresh</span></button>
          <button onClick={() => triggerCrisis('warning')} className="btn-icon-sm text-warning" style={{ opacity: stressLevel === 'warning' ? 1 : 0.4 }} title="Simulate SLA Warning"><span className="material-symbols-outlined text-[16px]">warning</span></button>
          <button onClick={() => triggerCrisis('critical')} className="btn-icon-sm text-error" style={{ opacity: stressLevel === 'critical' ? 1 : 0.4 }} title="Simulate Emergency"><span className="material-symbols-outlined text-[16px]">emergency</span></button>
        </div>

        <button 
          onClick={toggleClassicUI}
          className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${classicUI ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-outline-variant opacity-60 hover:opacity-100'}`}
          style={{ boxShadow: classicUI ? '0 4px 12px rgba(0, 94, 184, 0.3)' : 'none' }}
          title="Toggle Classic UI (Rollback Safety)"
        >
          <span className="material-symbols-outlined text-[18px]">
            {classicUI ? 'shield_with_heart' : 'shield'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-tighter hide-on-mobile">
            {classicUI ? 'Standard UI' : 'Classic Mode'}
          </span>
        </button>
      </div>
    </header>
  );
};

export default TopAppBar;
