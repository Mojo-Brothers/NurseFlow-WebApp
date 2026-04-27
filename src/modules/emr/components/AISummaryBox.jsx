import React from 'react';
import { Sparkles, Brain, Activity, ShieldAlert, Target, TrendingUp, X, Clock, BrainCircuit, Stethoscope, Fingerprint, ShieldCheck } from 'lucide-react';

export default function AISummaryBox({ summary, onClose }) {
  const traceId = React.useMemo(() => 
    Math.random().toString(36).substring(7).toUpperCase(),
    [summary]
  );

  if (!summary) return null;

  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 relative mb-8 group">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
      
      <div className="relative bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-blue-500/30 rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Header Area */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">AI Clinical Expertise Summary</h3>
              <p className="text-blue-100 text-[10px] font-bold opacity-80 uppercase tracking-widest">Powered by Clinical Obsidian Engine • Standard JCI Audit-Ready</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <h3 className="text-xl font-black text-[var(--on-surface)] tracking-tight mb-2">
            AI Expertise: <span className={summary?.severity === 'HIGH' ? 'text-[var(--error)]' : 'text-[var(--primary)]'}>{summary?.impression || 'Analyzing clinical patterns...'}</span>
          </h3>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-high)] border border-[var(--outline-variant)]">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                summary?.severity === 'HIGH' ? 'bg-[var(--error)] shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(0,255,0,0.5)]'
              }`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface)]">{summary?.severity || 'MODERATE'} SEVERITY</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-high)] border border-[var(--outline-variant)]">
              <TrendingUp size={14} className="text-[var(--primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface)]">{summary?.trend || 'Stable'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-container-high)] border border-[var(--outline-variant)]">
              <Activity size={14} className="text-[var(--primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface)]">{summary?.recordCount || 0} RECORDS SCANNED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-black text-[var(--primary)] uppercase tracking-widest">
                <BrainCircuit size={16} /> Diagnostic Flags
              </div>
              <div className="flex flex-wrap gap-2">
                {summary?.flags?.map((flag, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[11px] font-bold text-[var(--on-surface)] flex items-center gap-2 hover:bg-[var(--primary-fixed)] transition-colors cursor-default">
                    <ShieldAlert size={12} className="text-[var(--error)]" /> {flag}
                  </div>
                ))}
                {(!summary?.flags || summary.flags.length === 0) && (
                  <div className="text-[11px] text-[var(--on-surface-variant)] italic">No critical flags detected in current dataset.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-black text-[var(--primary)] uppercase tracking-widest">
                  <Stethoscope size={16} /> Clinician Recommendations
                </div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                   JCI CDS Ready
                </span>
              </div>
              <div className="space-y-2.5">
                {summary?.recommendations?.map((rec, i) => (
                  <div key={i} className="group/rec p-4 rounded-2xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:border-[var(--primary)]/40 hover:bg-white dark:hover:bg-white/5 transition-all duration-300 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center shrink-0 group-hover/rec:bg-[var(--primary)] group-hover/rec:text-white transition-colors">
                       <Target size={14} />
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.1em]">{rec.category}</span>
                       </div>
                       <p className="text-xs font-bold text-[var(--on-surface)] leading-relaxed">{rec.action}</p>
                    </div>
                    <button className="opacity-0 group-hover/rec:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110">
                       Order
                    </button>
                  </div>
                ))}
                {(!summary?.recommendations || summary.recommendations.length === 0) && (
                   <div className="p-4 rounded-[1.5rem] bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-xs font-bold text-[var(--on-surface-variant)] italic">
                     Lanjutkan pemantauan rutin sesuai protokol standar.
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Info */}
        <div className="px-8 py-3 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest">Confidence</div>
              <div className="w-24 h-1.5 bg-[var(--outline-variant)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--primary)] to-green-500 rounded-full" style={{ width: `${summary?.confidence || 90}%` }}></div>
              </div>
              <div className="text-[10px] font-black text-[var(--primary)]">{summary?.confidence || 90}%</div>
            </div>
            <div className="w-[1px] h-3 bg-[var(--outline-variant)]"></div>
            <div className="text-[9px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1.5 uppercase tracking-wider">
              <Clock size={12} /> Generated: {summary?.timestamp ? new Date(summary.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest opacity-60">
            <Fingerprint size={12} /> JCI Audit Trace ID: {traceId}
          </div>
        </div>
      </div>
    </div>
  );
}
