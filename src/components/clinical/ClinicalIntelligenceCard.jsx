/**
 * NurseFlow Enterprise HIS 2026 — Clinical Intelligence Card
 * 
 * Core Philosophy:
 * "Seamless Workspace Integration: Answers WHO / WHAT / WHY in < 5 seconds."
 * "Strict Patient Context Lock: Incoming alerts never shift active patient context."
 * 
 * Features:
 * 1. WHO/WHAT/WHY visual hierarchy.
 * 2. SLA Countdown timer with real-time overdue alerts.
 * 3. Dynamic Breakthrough alert overlay banner.
 * 4. Stale data (> 4h) and Data Deficit warning tags.
 * 5. Level 1 Headline + Level 2 Key Drivers accordion + Level 3 Modal trigger.
 * 6. Role-based actions: Acknowledge (30m snooze), MET Escalation, DPJP PIN Override.
 * 7. Accessibility WCAG 2.1 AA & Keyboard Navigation (Alt+A, Alt+E, Alt+M).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ALERT_PRIORITY_TIERS, 
  ALERT_LIFECYCLE_STATES, 
  clinicalAlertOrchestrator 
} from '../../modules/clinical_core/services/clinicalAlertOrchestrator.service.js';

export default function ClinicalIntelligenceCard({
  patient = {},
  cluster = null,
  currentUser = { role: 'WARD_NURSE', name: 'Nurse on Duty', id: 'NURSE-01' },
  onViewEvidence = () => {},
  onAcknowledge = () => {},
  onEscalateMet = () => {},
  onOverrideRisk = () => {},
  isActiveContext = false,
  onSelectPatient = () => {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nowEpoch, setNowEpoch] = useState(Date.now());
  const [acknowledgedState, setAcknowledgedState] = useState(cluster?.lifecycleState === ALERT_LIFECYCLE_STATES.ACKNOWLEDGED);
  const [snoozeSecondsRemaining, setSnoozeSecondsRemaining] = useState(0);

  // Update clock every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNowEpoch(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute remaining SLA seconds
  const slaRemainingSeconds = useMemo(() => {
    if (!cluster?.createdAt || !cluster?.targetSlaMinutes) return 0;
    const createdEpoch = new Date(cluster.createdAt).getTime();
    const targetEpoch = createdEpoch + (cluster.targetSlaMinutes * 60 * 1000);
    return Math.max(0, Math.floor((targetEpoch - nowEpoch) / 1000));
  }, [cluster, nowEpoch]);

  const isOverdue = slaRemainingSeconds === 0 && cluster?.lifecycleState === ALERT_LIFECYCLE_STATES.ACTIVE;

  // Compute Snooze Remaining
  useEffect(() => {
    if (cluster?.snoozeUntil) {
      const snoozeEnd = new Date(cluster.snoozeUntil).getTime();
      const remaining = Math.max(0, Math.floor((snoozeEnd - nowEpoch) / 1000));
      setSnoozeSecondsRemaining(remaining);
      if (remaining === 0 && acknowledgedState) {
        setAcknowledgedState(false);
      }
    }
  }, [cluster, nowEpoch, acknowledgedState]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleAcknowledgeClick();
      } else if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onViewEvidence(cluster, patient);
      } else if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onEscalateMet(cluster, patient);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cluster, patient]);

  // Safe internal Acknowledge handler (Protects Patient Context Lock)
  const handleAcknowledgeClick = () => {
    if (!cluster?.clusterId) return;
    try {
      const updated = clinicalAlertOrchestrator.transitionLifecycleState(
        cluster.clusterId,
        ALERT_LIFECYCLE_STATES.ACKNOWLEDGED,
        { snoozeMinutes: 30 },
        { clinicianId: currentUser.id, clinicianName: currentUser.name, clinicianRole: currentUser.role }
      );
      setAcknowledgedState(true);
      onAcknowledge(updated, patient);
    } catch (e) {
      console.warn('Acknowledge transition failed:', e.message);
    }
  };

  const priorityColor = useMemo(() => {
    switch (cluster?.priorityTier) {
      case ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT:
        return { border: 'border-red-600', bg: 'bg-red-50 dark:bg-red-950/40', badge: 'bg-red-600 text-white', glow: 'animate-pulse ring-2 ring-red-500' };
      case ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION:
        return { border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', badge: 'bg-amber-600 text-white', glow: 'ring-1 ring-amber-400' };
      case ALERT_PRIORITY_TIERS.PRIORITY_REVIEW:
        return { border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20', badge: 'bg-yellow-500 text-slate-900', glow: '' };
      default:
        return { border: 'border-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/20', badge: 'bg-teal-600 text-white', glow: '' };
    }
  }, [cluster?.priorityTier]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDpjp = currentUser.role === 'DPJP' || currentUser.role === 'SPECIALIST_PHYSICIAN';

  return (
    <div 
      className={`rounded-xl border-2 p-4 transition-all duration-200 shadow-sm ${priorityColor.border} ${priorityColor.bg} ${isOverdue ? 'ring-4 ring-red-600 animate-bounce' : priorityColor.glow}`}
      data-testid={`clinical-card-${patient.patientId || patient.id || 'unknown'}`}
      role="region"
      aria-label={`Clinical Intelligence Card for ${patient.name || 'Patient'}`}
    >
      {/* ⚡ Dynamic Breakthrough Banner Overlay */}
      {cluster?.hasEmergentCondition && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md animate-pulse">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">⚡</span>
            <span>BREAKTHROUGH EVENT: {cluster.clusterTitle}</span>
          </div>
          <span className="rounded bg-black/30 px-2 py-0.5 text-[10px] tracking-wider uppercase">Emergent Threat</span>
        </div>
      )}

      {/* ⚠️ Stale Vitals Warning */}
      {patient.isStaleVitals && (
        <div className="mb-2 rounded bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          ⚠️ STALE VITALS (&gt; 4H) — OBSERVASI ULANG DIPERLUKAN
        </div>
      )}

      {/* ⚠️ Data Deficit Warning */}
      {cluster?.evidenceQuality === 'INSUFFICIENT' && (
        <div className="mb-2 rounded bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
          ⚠️ DATA DEFICIT: UKUR TTV LENGKAP
        </div>
      )}

      {/* ─── 1. WHO? (Header Pasien & Lokasi) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPatient(patient)}
            className="text-left font-bold text-base text-slate-900 dark:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
            aria-label={`Pilih pasien ${patient.name}`}
          >
            {patient.name || 'Nama Pasien'}
          </button>
          <span className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-mono text-slate-700 dark:text-slate-200">
            RM: {patient.mrn || patient.medicalRecordNumber || '00-00-00'}
          </span>
          <span className="rounded-full bg-teal-100 dark:bg-teal-900/60 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:text-teal-200">
            Bed: {patient.wardOrBedLocation || cluster?.wardOrBedLocation || 'BED-01'}
          </span>
        </div>

        {/* Priority & Countdown Badge */}
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-wide ${priorityColor.badge}`}>
            {cluster?.priorityTier?.replace(/_/g, ' ') || 'ROUTINE AWARENESS'}
          </span>
          {cluster?.lifecycleState === ALERT_LIFECYCLE_STATES.ACTIVE && (
            <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${isOverdue ? 'bg-red-700 text-white animate-pulse' : 'bg-slate-800 text-white'}`}>
              {isOverdue ? 'OVERDUE REVIEW' : `SLA: ${formatCountdown(slaRemainingSeconds)}`}
            </span>
          )}
          {acknowledgedState && (
            <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
              Snooze: {formatCountdown(snoozeSecondsRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* ─── 2. WHAT? (Status Klinis & Tindakan Prioritas) ─── */}
      <div className="my-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            {cluster?.clusterTitle || 'ROUTINE CLINICAL MONITORING'}
          </span>
          <span>
            NEWS2: <strong className="text-slate-900 dark:text-white">{patient.news2 || cluster?.compositeSeverity || '0'}</strong> | Laju: <strong className="text-slate-900 dark:text-white">{cluster?.velocityPerHour ? `${cluster.velocityPerHour > 0 ? '+' : ''}${cluster.velocityPerHour}/h` : 'Stabil'}</strong>
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Tindakan: <span className="text-teal-700 dark:text-teal-300">{cluster?.headlineAction || 'Lanjutkan pemantauan rutin bangsal.'}</span>
        </p>
      </div>

      {/* ─── 3. WHY? (Accordion Level 2 Key Drivers) ─── */}
      <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 border border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 focus:outline-none"
          aria-expanded={isExpanded}
        >
          <span>🔍 WHY? (3 Faktor Pendorong Utama Fisiologis)</span>
          <span>{isExpanded ? '▲ Tutup' : '▼ Lihat Rincian'}</span>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-700 dark:text-slate-300">
            {cluster?.explainability?.keyDrivers && cluster.explainability.keyDrivers.length > 0 ? (
              cluster.explainability.keyDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="font-medium">• {driver.parameter}:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{driver.trend} ({driver.slope})</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">Parameter TTV dalam batas aman stabil.</p>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Protokol: {cluster?.appliedProtocol?.protocolId || 'HOSP-MET-RULE-V2026.08'}
            </p>
          </div>
        )}
      </div>

      {/* ─── 4. Tombol Tindakan Cepat Klinisi ─── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewEvidence(cluster, patient)}
            className="rounded bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 text-xs font-semibold shadow-sm transition"
            title="Lihat bukti lengkap & grafik sparkline (Alt+E)"
          >
            [VIEW EVIDENCE]
          </button>

          {!acknowledgedState && (
            <button
              onClick={handleAcknowledgeClick}
              className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm transition"
              title="Konfirmasi & Snooze 30 menit (Alt+A)"
            >
              [ACKNOWLEDGE]
            </button>
          )}

          <button
            onClick={() => onEscalateMet(cluster, patient)}
            className="rounded bg-red-700 hover:bg-red-600 text-white px-2.5 py-1 text-xs font-bold shadow-sm transition"
            title="Panggil Tim MET / Resusitasi Cito (Alt+M)"
          >
            [ESCALATE TO MET]
          </button>
        </div>

        {/* DPJP Override Button */}
        {isDpjp && (
          <button
            onClick={() => onOverrideRisk(cluster, patient)}
            className="rounded bg-indigo-700 hover:bg-indigo-600 text-white px-2.5 py-1 text-xs font-bold shadow-sm transition"
            title="DPJP Two-Factor Risk Override with PIN"
          >
            [OVERRIDE RISK (DPJP)]
          </button>
        )}
      </div>
    </div>
  );
}
