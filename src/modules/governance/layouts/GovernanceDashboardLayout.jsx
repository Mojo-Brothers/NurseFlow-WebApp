import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  Layers, 
  GitBranch, 
  FileSearch, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  History, 
  Activity, 
  Lock, 
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';

export default function GovernanceDashboardLayout() {
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      const data = await governanceService.getSummary();
      setSummary(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const navLinks = [
    { to: '/engineering/governance', end: true, label: 'Executive Overview', icon: Activity },
    { to: '/engineering/governance/roadmap', label: 'Roadmap & Phases', icon: GitBranch },
    { to: '/engineering/governance/workstreams', label: 'Workstreams', icon: Layers },
    { to: '/engineering/governance/security', label: 'Security Gate', icon: Lock },
    { to: '/engineering/governance/findings', label: 'Findings & Risks', icon: AlertTriangle },
    { to: '/engineering/governance/evidence', label: 'Evidence Explorer', icon: FileSearch },
    { to: '/engineering/governance/domains', label: 'Domain Maturity', icon: CheckCircle2 },
    { to: '/engineering/governance/tests', label: 'Quality & Tests', icon: Terminal },
    { to: '/engineering/governance/database', label: 'DB & Migrations', icon: Database },
    { to: '/engineering/governance/changes', label: 'Change History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* ── Top Header Ribbon ── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">NurseFlow Project Governance</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Read-Only Reality
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise HIS Command Center & Evidence-Driven Truth Layer</p>
            </div>
          </div>

          {/* Quick Metrics Header Strip */}
          <div className="flex items-center flex-wrap gap-2 md:gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-slate-400">Current Gate:</span>
              <span className="font-semibold text-amber-400">
                {summary?.project?.currentGate?.name || 'P0-2B Wave 1B.0S (HOLD)'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="font-semibold">
                Security Foundation: {summary?.project?.securityStatus?.foundation || 'CONTAINED'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span>Wave 1B:</span>
              <span className="font-bold text-orange-400">
                {summary?.project?.securityStatus?.wave1bStatus || 'HOLD'}
              </span>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition shadow-sm disabled:opacity-50"
              title="Rescan repository evidence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Scanning...' : 'Rescan'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sub Navigation Tabs ── */}
      <nav className="border-b border-slate-800/80 bg-slate-900/50 px-6 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        <p>NurseFlow Enterprise HIS 2026 — Project Governance & Evidence Verification System</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Strict Compliance Directive: Zero Production Code Modifications • Zero Active Database Mutations • 100% Read-Only Safety
        </p>
      </footer>
    </div>
  );
}
