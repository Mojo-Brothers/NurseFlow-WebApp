import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Layers, 
  ArrowRight, 
  ChevronRight, 
  FileWarning, 
  Activity, 
  Compass, 
  Info,
  Server,
  Key,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';
import { STATUS_COLORS, SEVERITY_COLORS } from '../../../core/governance/governanceModel.js';

export default function GovernanceOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getFullAudit().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading Enterprise Governance State...</p>
        </div>
      </div>
    );
  }

  const { project, inventory, findings, contradictions, nextRequiredActions } = data;

  const securityChain = [
    { id: 'jwt', label: 'JWT Cryptography', status: 'PARTIAL', desc: 'HS256 with constant-time check' },
    { id: 'principal', label: 'Principal Identity', status: 'VERIFIED', desc: 'Claims extraction & roles' },
    { id: 'tenant_id', label: 'Tenant Identity', status: 'VERIFIED', desc: 'Fail-closed extraction; 0 fallback UUIDs' },
    { id: 'db_ctx', label: 'Database Context', status: 'CONTAINED', desc: 'Pool lease safe release; 156 paths await UoW' },
    { id: 'runtime_role', label: 'Runtime DB Role', status: 'VERIFIED', desc: 'nurseflow_app_user (Non-superuser, 0 TRUNCATE)' },
    { id: 'rls', label: 'Fail-Closed RLS', status: 'CONTAINED', desc: '100 Tables RLS active; 100/100 policies (0 fail-open)' },
    { id: 'resource_own', label: 'Resource Ownership', status: 'VERIFIED', desc: 'Child table parent joins verified in 1A.11 suite' },
    { id: 'privilege', label: 'Clinical Privilege', status: 'NOT_ENFORCED', desc: '0/38 Routes mount clinical auth' },
    { id: 'sod', label: 'Separation of Duties', status: 'NOT_ENFORCED', desc: 'Service exists; 0 route calls' },
    { id: 'btg', label: 'Break-The-Glass', status: 'NOT_ENFORCED', desc: 'Ledger designed; 0 route calls' },
    { id: 'audit', label: 'Universal Audit', status: 'PARTIAL', desc: 'Audit logging in separate tx' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Contradiction Alert Banner (If Any) ── */}
      {contradictions && contradictions.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white uppercase">CONTRADICTION DETECTED ({contradictions.length})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white">CONSERVATIVE VERDICT</span>
              </div>
              <p className="text-xs text-rose-300/90 mt-0.5">
                {contradictions[0].claim} → <span className="font-semibold text-rose-100">{contradictions[0].reality}</span>
              </p>
            </div>
          </div>
          <Link
            to="/engineering/governance/evidence"
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold text-rose-200 transition shrink-0"
          >
            Inspect Discrepancies
          </Link>
        </div>
      )}

      {/* ── Current Gate Spotlight ── */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ACTIVE GATE: {project.currentGate.phaseId}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30">
                GATE STATUS: {project.currentGate.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{project.currentGate.name}</h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Forensic containment & migration baseline review: <strong className="text-cyan-400">{project.currentGate.verdict}</strong>. 
              Fondasi hak akses & isolasi tenant terkendali. Menunggu migrasi Unit-of-Work per domain (Batch 1: EMPI & CPOE).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 min-w-[240px]">
              <span className="text-[11px] font-medium text-slate-400 block uppercase">Next Required Gate</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5 block">{project.currentGate.nextGate}</span>
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                BLOCKED BY REVISIONS
              </span>
            </div>

            <Link
              to="/engineering/governance/roadmap"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md"
            >
              <span>Explore Phase Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Coverage Metrics (No Fake Percentages) ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Evidence Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {project.coverageMetrics.evidenceCoveragePct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Claims backed by physical repository proof</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Implementation Coverage</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {project.coverageMetrics.implementationCoveragePct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Core services & endpoints created</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Verification Coverage</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {project.coverageMetrics.verificationCoveragePct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Features verified by tests/audits</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Security Controls</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            {project.coverageMetrics.securityControlsVerifiedCount} / {project.coverageMetrics.securityControlsTotalCount}
          </div>
          <p className="text-[11px] text-rose-400/80 mt-1 font-semibold">Security Foundation: NOT_READY</p>
        </div>
      </section>

      {/* ── Security Dependency Chain ── */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Critical Security Dependency Chain</span>
            </h3>
            <p className="text-xs text-slate-400">
              Downstream clinical authorization cannot be trusted if upstream database context or runtime role fails.
            </p>
          </div>
          <Link
            to="/engineering/governance/security"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Deep Security View</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {securityChain.map((node, i) => {
            const isBlocked = node.status === 'BLOCKED' || node.status === 'NOT_READY';
            const isNotEnforced = node.status === 'NOT_ENFORCED';
            return (
              <div 
                key={node.id} 
                className={`p-3 rounded-xl border flex flex-col justify-between transition relative ${
                  isBlocked
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isNotEnforced
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Step {i + 1}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isBlocked
                        ? 'bg-rose-500 text-white'
                        : isNotEnforced
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1.5">{node.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">{node.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Two Column: What Next Engine & Top Findings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Should Happen Next Engine */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>What Should Happen Next? (Deterministic Engine)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              STRICT ORDER
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Urutan langkah wajib yang diturunkan secara deterministik dari kondisi dependensi arsitektural:
          </p>

          <div className="space-y-3 pt-1">
            {nextRequiredActions.map((action) => (
              <div key={action.order} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                  {action.order}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{action.title}</h4>
                  <p className="text-[11px] text-slate-400">{action.why}</p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
                    <span className="text-rose-400 font-semibold">Blocks: {action.blocks}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Role: {action.responsibleRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Critical Findings */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Top Critical Security Findings</span>
            </h3>
            <Link
              to="/engineering/governance/findings"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>All Findings ({findings.length})</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Temuan kritis terbukti yang menghalangi pembukaan gerbang Wave 1B:
          </p>

          <div className="space-y-3 pt-1">
            {findings.slice(0, 4).map((f) => (
              <div key={f.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-400">{f.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    {f.severity}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{f.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{f.currentState}</p>
                <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-2">
                  <span>Source: {f.evidenceRef}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
