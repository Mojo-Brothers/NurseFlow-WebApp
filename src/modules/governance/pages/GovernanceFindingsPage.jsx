import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';
import { SEVERITY_COLORS, SEVERITY_LEVELS } from '../../../core/governance/governanceModel.js';

export default function GovernanceFindingsPage() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadFindings = async () => {
    setLoading(true);
    const list = await governanceService.getFindings({
      severity: severityFilter,
      domain: domainFilter,
      status: statusFilter,
      search
    });
    setFindings(list);
    setLoading(false);
  };

  useEffect(() => {
    loadFindings();
  }, [severityFilter, domainFilter, statusFilter, search]);

  const domains = ['ALL', 'TENANT_ISOLATION', 'DATABASE_ACCESS', 'ROLE_SECURITY', 'AUTHORIZATION', 'DATA_INTEGRITY', 'CONNECTION_POOL', 'APPLICATION_SECURITY', 'IDENTITY_SECURITY'];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Findings & Failure-Modes Register</span>
        </h2>
        <p className="text-xs text-slate-400">
          Daftar temuan audit keamanan resmi dari Wave 1A hingga Wave 1B.0S beserta status mitigasi, dampak klinis, dan rencana remediasi.
        </p>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, keyword, or component..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Blockers)</option>
              <option value="RESOLVED">Resolved / Mitigated</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none max-w-[140px]"
            >
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Findings List ── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : findings.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
          No findings matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {findings.map((f) => {
            const sev = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.INFO;
            const isResolved = f.status === 'RESOLVED';
            return (
              <div
                key={f.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-cyan-400">{f.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${sev.badge}`}>
                      {f.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {f.domain}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase border ${
                    isResolved 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    STATUS: {f.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{f.currentState}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Security Impact</span>
                    <p className="text-rose-200 mt-0.5 text-[11px] leading-relaxed">{f.securityImpact}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">Remediation Protocol</span>
                    <p className="text-cyan-200 mt-0.5 text-[11px] leading-relaxed">{f.remediation}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">Affected:</span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-slate-300">
                      {f.affectedComponents.map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[10px] text-slate-400">{f.sourceDoc}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
