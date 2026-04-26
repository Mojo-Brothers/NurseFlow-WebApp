import React from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * ClaimValidatorWidget — Real-time revenue integrity auditor.
 */
export default function ClaimValidatorWidget({ readiness }) {
  if (!readiness) return null;

  const isHealthy = readiness.score >= 80;
  const isCritical = !readiness.ready;

  return (
    <ClinicalCard padding="1.5rem" className={`border-none shadow-lg transition-all
      ${isCritical ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface'}`}>
       
       <div className="flex-row justify-between items-center mb-6">
          <div className="flex-column">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Claim Integrity Score</span>
             <span className={`text-4xl font-black tabular-nums ${isHealthy ? 'text-success' : isCritical ? 'text-error' : 'text-primary'}`}>
                {readiness.score}%
             </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
             ${isCritical ? 'bg-error text-white animate-pulse' : 'bg-success/20 text-success'}`}>
             <span className="material-symbols-outlined">{isCritical ? 'assignment_late' : 'verified'}</span>
          </div>
       </div>

       <div className="flex-column gap-3 mb-6">
          {readiness.issues.length === 0 ? (
             <p className="text-xs font-bold text-success">✓ Documentation meets all payer compliance rules.</p>
          ) : readiness.issues.map((issue, i) => (
             <div key={i} className="flex-row gap-3 items-start p-3 bg-on-surface/5 rounded-xl">
                <span className={`material-symbols-outlined text-sm ${issue.level === 'CRITICAL' ? 'text-error' : 'text-warning'}`}>
                   {issue.level === 'CRITICAL' ? 'cancel' : 'info'}
                </span>
                <p className="text-[10px] font-bold leading-tight">{issue.msg}</p>
             </div>
          ))}
       </div>

       <div className="pt-4 border-t border-black/10 flex-row justify-between items-center">
          <span className="text-[9px] font-black uppercase opacity-60">Target Payer</span>
          <span className="text-[10px] font-black text-primary uppercase">{readiness.payer}</span>
       </div>

       {isCritical && (
          <p className="mt-4 text-[8px] font-black text-error uppercase animate-pulse">
             * Submission Blocked: Resolve critical issues first.
          </p>
       )}
    </ClinicalCard>
  );
}
