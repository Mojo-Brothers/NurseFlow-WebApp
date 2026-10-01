import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';
import { STATUS_COLORS } from '../../../core/governance/governanceModel.js';

export default function GovernanceSecurityPage() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getSecurityControls().then((res) => {
      setControls(res);
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

  const verifiedCount = controls.filter(c => c.status === 'VERIFIED' || c.status === 'CONTAINED').length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>Critical Security Foundation Panel</span>
        </h2>
        <p className="text-xs text-slate-400">
          Evaluasi mendalam 11 kontrol keamanan tenant, basis data, dan otorisasi klinis. Gerbang Wave 1B tidak dapat dibuka sebelum kontrol ini terbukti.
        </p>
      </div>

      {/* ── Summary Callout ── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">CRITICAL SECURITY BASELINE (WAVE 1B.0S)</span>
            <h3 className="text-sm font-bold text-white mt-0.5">
              CURRENT SECURITY FOUNDATION: CONTAINED (PRE-UOW) • WAVE 1B: HOLD
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Koneksi runtime berhasil diproteksi (<strong className="text-teal-300">nurseflow_app_user / Non-Superuser</strong>, 0 TRUNCATE, 100/100 tabel RLS fail-closed). 156 path kueri menunggu refaktor Scoped Unit-of-Work.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-lg font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
            {verifiedCount} OF {controls.length} CONTAINED / VERIFIED
          </span>
        </div>
      </div>

      {/* ── Grid of 11 Controls ── */}
      <div className="space-y-4">
        {controls.map((ctrl) => {
          const statusStyle = STATUS_COLORS[ctrl.status] || STATUS_COLORS.UNKNOWN;
          const isBlocked = ctrl.status === 'BLOCKED' || ctrl.status === 'NOT_READY';
          return (
            <div
              key={ctrl.id}
              className={`p-5 rounded-2xl border transition shadow-sm ${
                isBlocked
                  ? 'bg-slate-900/90 border-rose-500/30'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">{ctrl.id}</span>
                  <h3 className="text-sm font-bold text-white">{ctrl.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {ctrl.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current State (Reality)</span>
                  <p className="text-slate-200 mt-1 font-mono text-[11px] leading-relaxed">{ctrl.current}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80 block">Target Architecture</span>
                  <p className="text-slate-200 mt-1 font-mono text-[11px] leading-relaxed">{ctrl.target}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Evidence:</span>
                  <span className="font-mono text-cyan-300 text-[11px]">{ctrl.evidence}</span>
                </div>

                {ctrl.blocker && (
                  <div className="text-rose-400 font-medium flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Blocker: {ctrl.blocker}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
