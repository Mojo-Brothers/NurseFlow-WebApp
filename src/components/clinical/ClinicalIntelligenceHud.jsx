/**
 * NurseFlow Enterprise HIS 2026 — Clinical Intelligence HUD
 * Integrated Triage Header & Rapid Bedside HUD for IGD & Emergency Workspaces
 */

import React from 'react';
import { ALERT_PRIORITY_TIERS } from '../../modules/clinical_core/services/clinicalAlertOrchestrator.service.js';

export default function ClinicalIntelligenceHud({
  cluster = null,
  patient = {},
  onCitoAction = () => {},
  onViewDetails = () => {}
}) {
  if (!cluster) return null;

  const isEmergency = cluster.priorityTier === ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
  const isUrgent = cluster.priorityTier === ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION;

  const badgeClass = isEmergency
    ? 'bg-red-600 text-white animate-pulse'
    : (isUrgent ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white');

  return (
    <div 
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 p-3 ${isEmergency ? 'border-red-600 bg-red-50 dark:bg-red-950/40' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'} shadow-sm`}
      data-testid="clinical-intelligence-hud"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-wider ${badgeClass}`}>
          {isEmergency ? 'ESI-1 RESUSCITATION' : (isUrgent ? 'ESI-2 EMERGENCY' : 'ESI-3 URGENT')}
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {cluster.clusterTitle || 'KLINIS STABIL'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {cluster.headlineAction || 'Pemantauan rutin'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEmergency && (
          <button
            onClick={() => onCitoAction(cluster, patient)}
            className="rounded bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold shadow-md animate-bounce"
            title="Panggil Tim Resusitasi & Airway STAT"
          >
            🚨 [CALL RESUSCITATION]
          </button>
        )}
        <button
          onClick={() => onViewDetails(cluster, patient)}
          className="rounded bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 text-xs font-semibold"
        >
          [DETAIL BUKTI]
        </button>
      </div>
    </div>
  );
}
