/**
 * NurseFlow Enterprise HIS 2026 — Triage SLA Timer & PMKP Response Time Engine
 * Sprint 3: Live Stopwatch, Overdue Detection, Escalation & PMKP Quality Indicator
 * Standar Kepatuhan: KARS PMKP (Indikator Waktu Tanggap Pelayanan Gawat Darurat) & JCI 7th Edition.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const SLA_TIMERS_STORAGE_KEY = 'nurseflow_emergency_sla_timers';

const getStoredTimers = () => {
  try {
    const raw = localStorage.getItem(SLA_TIMERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[TriageSlaEngine] Failed to load SLA timers:', e);
  }
  return [
    {
      id: 'SLA-2026-001',
      encounter_id: 'ENC-2026-001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      triage_level: 'P2_EMERGENT',
      target_response_minutes: 10,
      started_at: '2026-08-17T08:20:00Z',
      first_physician_contact_at: '2026-08-17T08:24:30Z',
      completed_at: '2026-08-17T08:24:30Z',
      elapsed_seconds: 270,
      remaining_seconds: 330,
      is_overdue: false,
      status: 'COMPLETED'
    }
  ];
};

const saveStoredTimers = (timers) => {
  try {
    localStorage.setItem(SLA_TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch (e) {
    console.warn('[TriageSlaEngine] Failed to save SLA timers:', e);
  }
};

export const triageSlaEngineService = {
  /**
   * Start New SLA Countdown Timer on Triage Completion
   */
  startSlaTimer: async ({
    encounterId,
    patientName,
    triageLevel,
    targetResponseMinutes = 10
  }) => {
    const now = new Date().toISOString();
    const timer = {
      id: `SLA-${Date.now()}`,
      encounter_id: encounterId,
      patient_name: patientName,
      triage_level: triageLevel,
      target_response_minutes: targetResponseMinutes,
      started_at: now,
      first_physician_contact_at: null,
      completed_at: null,
      elapsed_seconds: 0,
      remaining_seconds: targetResponseMinutes * 60,
      is_overdue: false,
      status: 'RUNNING'
    };

    const timers = getStoredTimers();
    saveStoredTimers([timer, ...timers]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'SLA_TIMER',
      aggregateId: timer.id,
      eventName: 'SLA_TIMER_STARTED',
      payload: timer
    });

    return timer;
  },

  /**
   * Record First Physician Contact (Stops the stopwatch)
   */
  recordFirstPhysicianContact: async ({ encounterId, physicianName = 'dr. Jaga IGD' }) => {
    const timers = getStoredTimers();
    const index = timers.findIndex(t => t.encounter_id === encounterId && t.status === 'RUNNING');

    if (index === -1) {
      return null;
    }

    const timer = timers[index];
    const now = new Date().toISOString();
    const startMs = new Date(timer.started_at).getTime();
    const elapsedSec = Math.floor((new Date(now).getTime() - startMs) / 1000);
    const targetSec = timer.target_response_minutes * 60;

    timer.first_physician_contact_at = now;
    timer.completed_at = now;
    timer.elapsed_seconds = elapsedSec;
    timer.is_overdue = elapsedSec > targetSec;
    timer.status = timer.is_overdue ? 'BREACHED' : 'COMPLETED';

    timers[index] = timer;
    saveStoredTimers(timers);

    await outboxPublisherService.stageEvent({
      aggregateType: 'SLA_TIMER',
      aggregateId: timer.id,
      eventName: timer.is_overdue ? 'SLA_BREACHED' : 'SLA_TIMER_COMPLETED',
      payload: { ...timer, physicianName }
    });

    return timer;
  },

  /**
   * Calculate Real-time Timers with Dynamic Elapsed Seconds
   */
  getActiveTimers: () => {
    const timers = getStoredTimers();
    const nowMs = Date.now();

    return timers.map(t => {
      if (t.status === 'RUNNING') {
        const startMs = new Date(t.started_at).getTime();
        const elapsedSec = Math.floor((nowMs - startMs) / 1000);
        const targetSec = t.target_response_minutes * 60;
        const remainingSec = Math.max(0, targetSec - elapsedSec);
        const isOverdue = elapsedSec > targetSec;

        return {
          ...t,
          elapsed_seconds: elapsedSec,
          remaining_seconds: remainingSec,
          is_overdue: isOverdue,
          status: isOverdue ? 'BREACHED' : 'RUNNING'
        };
      }
      return t;
    });
  },

  /**
   * Calculate PMKP Emergency Indicator Compliance
   */
  calculatePmkpCompliance: () => {
    const timers = getStoredTimers();
    const completed = timers.filter(t => t.status === 'COMPLETED' || t.status === 'BREACHED');
    if (completed.length === 0) return { compliancePercent: 100, totalCases: 0, breachedCases: 0 };

    const onTimeCount = completed.filter(t => !t.is_overdue).length;
    const percent = ((onTimeCount / completed.length) * 100).toFixed(1);

    return {
      compliancePercent: Number(percent),
      totalCases: completed.length,
      breachedCases: completed.length - onTimeCount,
      targetPmkpStandard: 90.0 // Standard KARS >= 90%
    };
  }
};
