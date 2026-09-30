import React, { useState, useEffect } from 'react';
import { Layers, ShieldAlert, AlertTriangle, ArrowRight, UserCheck, Calendar } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';
import { STATUS_COLORS } from '../../../core/governance/governanceModel.js';

export default function GovernanceWorkstreamsPage() {
  const [workstreams, setWorkstreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getWorkstreams().then((res) => {
      setWorkstreams(res);
      setLoading(false);
    });
  }, []);

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
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Active Engineering Workstreams</span>
        </h2>
        <p className="text-xs text-slate-400">
          Status eksekusi 5 gugus tugas arsitektur keamanan dan perimeter data NurseFlow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workstreams.map((ws) => {
          const statusStyle = STATUS_COLORS[ws.currentStatus] || STATUS_COLORS.UNKNOWN;
          return (
            <div
              key={ws.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{ws.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {ws.currentStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{ws.name}</h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ws.ownerRole}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Completion Evidence</span>
                    <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">{ws.completionEvidence}</p>
                  </div>

                  {ws.blockers && ws.blockers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Active Blockers</span>
                      <ul className="list-disc list-inside mt-0.5 text-[11px] text-rose-300/90 space-y-0.5">
                        {ws.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Next Action</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">{ws.nextAction}</p>
                <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Last verified: {ws.lastVerified}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
