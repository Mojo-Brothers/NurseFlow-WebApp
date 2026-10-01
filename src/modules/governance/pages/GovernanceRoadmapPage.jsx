import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle2, XCircle, AlertCircle, Clock, ShieldAlert, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';
import { STATUS_COLORS } from '../../../core/governance/governanceModel.js';

export default function GovernanceRoadmapPage() {
  const [phases, setPhases] = useState([]);
  const [expandedPhaseId, setExpandedPhaseId] = useState('PHASE-15');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getPhases().then((res) => {
      setPhases(res);
      setLoading(false);
    });
  }, []);

  const toggleExpand = (id) => {
    setExpandedPhaseId(expandedPhaseId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <span>Project Phase Roadmap & Evidence Baseline</span>
        </h2>
        <p className="text-xs text-slate-400">
          Pelacakan evolusi arsitektur NurseFlow dari Phase 0 hingga Production Cutover. Status diturunkan langsung dari bukti forensik dan keputusan gerbang.
        </p>
      </div>

      {/* ── Vertical Timeline of Phases ── */}
      <div className="space-y-3">
        {phases.map((phase) => {
          const isExpanded = expandedPhaseId === phase.id;
          const statusStyle = STATUS_COLORS[phase.status] || STATUS_COLORS.UNKNOWN;
          const isRefuted = phase.status === 'REFUTED';
          const isBlocked = phase.status === 'BLOCKED';
          const isCurrent = phase.isCurrent || (phase.status === 'HOLD' && phase.id === 'PHASE-15');

          return (
            <div
              key={phase.id}
              className={`rounded-xl border transition-all duration-150 ${
                isCurrent
                  ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : isExpanded
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Bar */}
              <button
                onClick={() => toggleExpand(phase.id)}
                className="w-full p-4 flex items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusStyle.dot} shrink-0`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 font-bold">{phase.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {phase.status}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-wider animate-pulse">
                          CURRENT PHASE
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{phase.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {phase.evidenceIds.length} Evidence Sources
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Collapsible Detail Panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current Reality State</span>
                      <p className="text-slate-300 mt-1 font-medium">{phase.currentState}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Target Architecture State</span>
                      <p className="text-slate-300 mt-1 font-medium">{phase.targetState}</p>
                    </div>
                  </div>

                  {phase.blockers && phase.blockers.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Active Blockers</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-200">
                        {phase.blockers.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {phase.evidenceIds && phase.evidenceIds.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Evidence Artifacts</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {phase.evidenceIds.map((ev, idx) => (
                          <span key={idx} className="font-mono text-[11px] px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
