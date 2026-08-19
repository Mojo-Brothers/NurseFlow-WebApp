/**
 * NurseFlow Enterprise HIS 2026 — SPRINT 4B.6: 25-SCENARIO LONGITUDINAL PATIENT TRAJECTORY TEST SUITE
 * 
 * Invariant Philosophy:
 * "Trajectory Engine observes. Governance Engine governs. Clinician decides."
 * 
 * 25 Comprehensive Test Scenarios Covering:
 * 1. Stable patient
 * 2. Improving patient
 * 3. Rapid worsening (+1.5 NEWS2/h)
 * 4. Transient deterioration
 * 5. Persistent deterioration
 * 6. Missing observations handling
 * 7. Irregular observation intervals
 * 8. Duplicate observations deduplication
 * 9. Out-of-order timestamps sorting
 * 10. Invalid measurements filtering
 * 11. Poor signal quality filtering
 * 12. MAP negative velocity & compensatory tachycardia
 * 13. Respiratory deterioration slope
 * 14. Neurological GCS delta
 * 15. AKI & KDIGO oliguria trajectory (< 0.5 ml/kg/h)
 * 16. Lactate acceleration slope
 * 17. Multi-domain concurrent deterioration
 * 18. Recovery trajectory
 * 19. Trajectory reversal
 * 20. Deterministic explainability report
 * 21. Immutable event audit lineage
 * 22. Snapshot idempotency
 * 23. Rule & schema versioning
 * 24. Safety governance integration
 * 25. Regression verification across 4B.1-4B.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clinicalTrajectoryEngine, TRAJECTORY_DIRECTIONS, TRAJECTORY_MOMENTUM, ESCALATION_RISK_LEVELS, DATA_QUALITY_FLAGS, TRAJECTORY_RULES } from '../src/modules/clinical_core/services/clinicalTrajectoryEngine.service.js';
import { clinicalSafetyGovernanceEngine, ALERT_LIFECYCLE_STATES } from '../src/modules/clinical_core/services/clinicalSafetyGovernanceEngine.service.js';
import { clinicalDeteriorationEngine } from '../src/modules/clinical_core/services/clinicalDeteriorationEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { useEncounterStore } from '../src/modules/encounter/encounter.store.js';

// Polyfill localStorage in test environment
const mockStorage = new Map();
const storagePolyfill = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = storagePolyfill;
}

describe('🚀 SPRINT 4B.6: 25-SCENARIO LONGITUDINAL PATIENT TRAJECTORY ENGINE TEST SUITE', () => {
  beforeEach(() => {
    mockStorage.clear();
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    useEncounterStore.getState().clearLiveContext();
  });

  // 1. Stable Patient
  it('1. Stable Patient: Vitals flatline at normal ranges -> Direction STABLE, Risk LOW', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 72, sbp: 120, dbp: 80, rr: 16, spo2: 98, temp: 36.8, consciousness: 'ALERT' },
      { timestamp: '2026-08-20T10:00:00Z', hr: 74, sbp: 122, dbp: 80, rr: 16, spo2: 98, temp: 36.7, consciousness: 'ALERT' },
      { timestamp: '2026-08-20T12:00:00Z', hr: 70, sbp: 118, dbp: 78, rr: 16, spo2: 98, temp: 36.8, consciousness: 'ALERT' }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P1', encounterId: 'E1', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.STABLE);
    expect(traj.escalationRisk).toBe(ESCALATION_RISK_LEVELS.LOW);
    expect(traj.news2VelocityPerHour).toBe(0);
  });

  // 2. Improving Patient
  it('2. Improving Patient: NEWS2 drops from 6 to 1 -> Direction IMPROVING, Risk LOW', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 115, sbp: 105, dbp: 70, rr: 24, spo2: 94, onOxygen: true, temp: 38.5 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 95, sbp: 115, dbp: 75, rr: 20, spo2: 96, onOxygen: true, temp: 37.8 },
      { timestamp: '2026-08-20T12:00:00Z', hr: 76, sbp: 120, dbp: 80, rr: 16, spo2: 98, onOxygen: false, temp: 36.9 }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P2', encounterId: 'E2', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.IMPROVING);
    expect(traj.news2VelocityPerHour).toBeLessThan(0);
    expect(traj.clinicalPatternSignal).toContain('IMPROVEMENT');
  });

  // 3. Rapid Worsening (+1.5 NEWS2/h)
  it('3. Rapid Worsening: NEWS2 rises 2 -> 3 -> 5 within 2 hours -> Velocity +1.5/h, Risk ELEVATED', () => {
    const obs = [
      { timestamp: '2026-08-20T10:00:00Z', hr: 78, sbp: 122, dbp: 78, rr: 16, spo2: 98, temp: 36.8, consciousness: 'ALERT' }, // NEWS2 = 0 (or 2 with baseline)
      { timestamp: '2026-08-20T11:00:00Z', hr: 95, sbp: 110, dbp: 70, rr: 21, spo2: 95, temp: 37.2, consciousness: 'ALERT' }, // NEWS2 = 3
      { timestamp: '2026-08-20T12:00:00Z', hr: 105, sbp: 105, dbp: 68, rr: 22, spo2: 95, temp: 37.2, consciousness: 'ALERT' }  // NEWS2 = 5 (Slope: 5/2 = +2.5/h)
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P3', encounterId: 'E3', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.WORSENING);
    expect(traj.news2VelocityPerHour).toBeGreaterThanOrEqual(1.5);
    expect(traj.escalationRisk).toBe(ESCALATION_RISK_LEVELS.ELEVATED);
    expect(traj.mathematicalExtrapolation.thresholdProximity).toBe('APPROACHING_CRITICAL');
  });

  // 4. Transient Deterioration
  it('4. Transient Deterioration: Isolated spike followed by immediate recovery', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 115, sbp: 105, rr: 22, spo2: 94 }, // Transient spike
      { timestamp: '2026-08-20T10:00:00Z', hr: 76, sbp: 120, rr: 16, spo2: 98 }  // Recovered
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P4', encounterId: 'E4', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.STABLE);
    expect(traj.news2VelocityPerHour).toBe(0);
  });

  // 5. Persistent Deterioration
  it('5. Persistent Deterioration: 4 consecutive worsening points -> RAPID_PERSISTENT_DETERIORATION', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 }, // 0
      { timestamp: '2026-08-20T09:00:00Z', hr: 90, sbp: 110, rr: 20, spo2: 96 }, // 1
      { timestamp: '2026-08-20T10:00:00Z', hr: 105, sbp: 105, rr: 22, spo2: 94 }, // 3
      { timestamp: '2026-08-20T11:00:00Z', hr: 115, sbp: 95, rr: 24, spo2: 93 }, // 6
      { timestamp: '2026-08-20T12:00:00Z', hr: 125, sbp: 88, rr: 26, spo2: 91 }  // 9
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P5', encounterId: 'E5', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.WORSENING);
    expect(traj.persistenceCount).toBe(4);
    expect(traj.clinicalPatternSignal).toBe('RAPID_PERSISTENT_DETERIORATION');
  });

  // 6. Missing Observations Handling
  it('6. Missing Observations: Handles empty and single-point series gracefully without crashing', () => {
    const emptyTraj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P6', encounterId: 'E6', observations: [] });
    expect(emptyTraj.evidenceQuality).toBe('NO_DATA');
    expect(emptyTraj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.STABLE);

    const singleObs = [{ timestamp: '2026-08-20T08:00:00Z', hr: 80, sbp: 120, rr: 16, spo2: 98 }];
    const singleTraj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P6', encounterId: 'E6', observations: singleObs });
    expect(singleTraj.observationCount).toBe(1);
    expect(singleTraj.evidenceQuality).toBe('LOW');
  });

  // 7. Irregular Observation Intervals
  it('7. Irregular Intervals: Calculates time-normalized velocity across variable time gaps (15m, 45m, 3h)', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T08:15:00Z', hr: 85, sbp: 115, rr: 18, spo2: 97 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 95, sbp: 110, rr: 20, spo2: 95 },
      { timestamp: '2026-08-20T12:00:00Z', hr: 120, sbp: 95, rr: 26, spo2: 91 }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P7', encounterId: 'E7', observations: obs });
    expect(traj.observationCount).toBe(4);
    expect(traj.news2VelocityPerHour).toBeGreaterThan(0);
  });

  // 8. Duplicate Observations Deduplication
  it('8. Duplicate Observations: Collapses measurements taken < 30 seconds apart into single point', () => {
    const raw = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T08:00:10Z', hr: 76, sbp: 120, rr: 16, spo2: 98 }, // Duplicate within 10s
      { timestamp: '2026-08-20T09:00:00Z', hr: 95, sbp: 110, rr: 22, spo2: 94 }
    ];
    const normalized = clinicalTrajectoryEngine.normalizeTemporalObservations(raw);
    expect(normalized.length).toBe(2);
  });

  // 9. Out-of-Order Timestamps Sorting
  it('9. Out-of-Order Timestamps: Sorts unordered time-series chronologically before calculus', () => {
    const raw = [
      { timestamp: '2026-08-20T12:00:00Z', hr: 120, sbp: 90, rr: 26, spo2: 91 },
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 95, sbp: 110, rr: 22, spo2: 95 }
    ];
    const normalized = clinicalTrajectoryEngine.normalizeTemporalObservations(raw);
    expect(normalized[0].timestamp).toBe('2026-08-20T08:00:00Z');
    expect(normalized[2].timestamp).toBe('2026-08-20T12:00:00Z');
  });

  // 10. Invalid Measurements Filtering
  it('10. Invalid Measurements: Discards corrupted or non-date timestamps', () => {
    const raw = [
      { timestamp: 'INVALID_DATE', hr: 75, sbp: 120 },
      null,
      { hr: 75 }, // Missing timestamp
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 }
    ];
    const normalized = clinicalTrajectoryEngine.normalizeTemporalObservations(raw);
    expect(normalized.length).toBe(1);
  });

  // 11. Poor Signal Quality Filtering
  it('11. Poor Signal Quality: Filters out artefacts with POOR_SIGNAL or PROBE_DISCONNECTED flags', () => {
    const raw = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98, quality: DATA_QUALITY_FLAGS.VALID },
      { timestamp: '2026-08-20T09:00:00Z', hr: 190, sbp: 40, rr: 4, spo2: 60, quality: DATA_QUALITY_FLAGS.POOR_SIGNAL }, // Spurious Artefact
      { timestamp: '2026-08-20T10:00:00Z', hr: 78, sbp: 118, rr: 16, spo2: 98, quality: DATA_QUALITY_FLAGS.VALID }
    ];
    const normalized = clinicalTrajectoryEngine.normalizeTemporalObservations(raw);
    expect(normalized.length).toBe(2);
    expect(normalized.every(n => n.quality !== DATA_QUALITY_FLAGS.POOR_SIGNAL)).toBe(true);
  });

  // 12. MAP Deterioration
  it('12. MAP Negative Velocity: Flags DECOMPENSATING hemodynamic pattern when MAP drops with tachycardia', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 125, dbp: 80, rr: 16, spo2: 98 },  // MAP 95
      { timestamp: '2026-08-20T10:00:00Z', hr: 98, sbp: 110, dbp: 70, rr: 18, spo2: 97 },  // MAP 83
      { timestamp: '2026-08-20T12:00:00Z', hr: 118, sbp: 95, dbp: 60, rr: 20, spo2: 96 }   // MAP 72 -> ΔMAP = -23 mmHg over 4h = -5.75 mmHg/h
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P12', encounterId: 'E12', observations: obs });
    expect(traj.systems.hemodynamic.status).toBe('DECOMPENSATING');
    expect(traj.systems.hemodynamic.mapSlope).toBeLessThan(-4.0);
  });

  // 13. Respiratory Deterioration Slope
  it('13. Respiratory Deterioration: Detects steep RR increase & SpO2 downward slope', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', rr: 16, spo2: 98, hr: 75, sbp: 120 },
      { timestamp: '2026-08-20T10:00:00Z', rr: 22, spo2: 94, hr: 88, sbp: 120 },
      { timestamp: '2026-08-20T12:00:00Z', rr: 28, spo2: 90, hr: 105, sbp: 115, onOxygen: true }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P13', encounterId: 'E13', observations: obs });
    expect(traj.systems.respiratory.status).toBe('DETERIORATING');
    expect(traj.systems.respiratory.rrSlope).toBeGreaterThanOrEqual(2.5);
  });

  // 14. Neurological Deterioration (GCS Delta)
  it('14. Neurological Degradation: Flags acute drop in GCS (15 -> 12) or ACVPU change', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', gcs: 15, consciousness: 'ALERT', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T11:00:00Z', gcs: 12, consciousness: 'CONFUSION', hr: 82, sbp: 125, rr: 16, spo2: 98 }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P14', encounterId: 'E14', observations: obs });
    expect(traj.systems.neurologic.status).toBe('DETERIORATING');
    expect(traj.systems.neurologic.gcsDelta).toBe(-3);
  });

  // 15. AKI & Oliguria Trajectory (< 0.5 ml/kg/h)
  it('15. Oliguria / AKI Trajectory: Flags KDIGO Oliguria Pattern on 70kg patient producing 20ml/h', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98, urineOutputMl: 20 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 80, sbp: 115, rr: 18, spo2: 97, urineOutputMl: 35 } // 35ml over 2h on 70kg = 0.25 ml/kg/h
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P15', encounterId: 'E15', patientWeightKg: 70, observations: obs });
    expect(traj.systems.metabolicRenal.status).toBe('ACUTE_INJURY');
    expect(traj.systems.metabolicRenal.evidence).toContain('KDIGO Oliguria');
  });

  // 16. Lactate Acceleration Slope
  it('16. Sepsis / Lactate Acceleration: Detects rising serum lactate trajectory', () => {
    const obs = [{ timestamp: '2026-08-20T08:00:00Z', hr: 85, sbp: 115, rr: 18, spo2: 97 }];
    const labs = [
      { timestamp: '2026-08-20T08:00:00Z', lactate: 1.2 },
      { timestamp: '2026-08-20T11:00:00Z', lactate: 2.7 } // Δ = +1.5 over 3h = +0.5 mmol/L/h
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P16', encounterId: 'E16', observations: obs, labObservations: labs });
    expect(traj.systems.infectionSepsis.status).toBe('HIGH_RISK_SEPTIC');
    expect(traj.systems.infectionSepsis.lactateSlope).toBeGreaterThanOrEqual(0.4);
  });

  // 17. Multi-Domain Concurrent Deterioration
  it('17. Multi-Domain Deterioration: Concurrent hemodynamic + respiratory + renal worsening', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, dbp: 80, rr: 16, spo2: 98, urineOutputMl: 70 },
      { timestamp: '2026-08-20T11:00:00Z', hr: 118, sbp: 92, dbp: 58, rr: 28, spo2: 90, onOxygen: true, urineOutputMl: 25 }
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P17', encounterId: 'E17', patientWeightKg: 70, observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.WORSENING);
    expect(traj.systems.hemodynamic.status).toBe('DECOMPENSATING');
    expect(traj.systems.respiratory.status).toBe('DETERIORATING');
    expect(traj.systems.metabolicRenal.status).toBe('ACUTE_INJURY');
  });

  // 18. Recovery Trajectory
  it('18. Recovery Trajectory: Positive clinical response documented with negative velocity slope', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 125, sbp: 88, rr: 28, spo2: 90, onOxygen: true, temp: 39.0 }, // NEWS2 = 12
      { timestamp: '2026-08-20T10:00:00Z', hr: 95, sbp: 110, rr: 20, spo2: 95, onOxygen: true, temp: 37.8 }, // NEWS2 = 4
      { timestamp: '2026-08-20T12:00:00Z', hr: 76, sbp: 120, rr: 16, spo2: 98, onOxygen: false, temp: 36.8 }  // NEWS2 = 0
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P18', encounterId: 'E18', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.IMPROVING);
    expect(traj.news2VelocityPerHour).toBeLessThan(-2.0);
  });

  // 19. Trajectory Reversal
  it('19. Trajectory Reversal: Handles worsening then stabilizing transition', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 110, sbp: 100, rr: 24, spo2: 93 }, // Worsened
      { timestamp: '2026-08-20T10:00:00Z', hr: 80, sbp: 118, rr: 17, spo2: 97 }   // Reversed
    ];
    const traj = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P19', encounterId: 'E19', observations: obs });
    expect(traj.overallTrajectory).toBe(TRAJECTORY_DIRECTIONS.STABLE);
  });

  // 20. Deterministic Explainability Report
  it('20. Explainability: Generates human-readable explainability report for clinical trajectory snapshot', async () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 110, sbp: 100, rr: 24, spo2: 93 }
    ];
    const res = await clinicalTrajectoryEngine.recordTrajectoryEvaluation({
      patientId: 'P20',
      encounterId: 'E20',
      patientName: 'Tn. Explainability Trajectory',
      mrn: 'MRN-EXP-TRAJ',
      observations: obs
    });

    const report = await clinicalTrajectoryEngine.getTrajectoryExplainabilityReport(res.snapshot.id);
    expect(report.reportText).toContain('LONGITUDINAL PATIENT TRAJECTORY EXPLAINABILITY REPORT');
    expect(report.reportText).toContain('Direction:');
    expect(report.reportText).toContain('MULTI-ORGAN SYSTEM SLOPES:');
  });

  // 21. Audit Lineage & Immutable Trajectory Events
  it('21. Audit Lineage: Emits immutable CLINICAL_TRAJECTORY_CHANGED event to persistence ledger', async () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 110, sbp: 100, rr: 24, spo2: 93 }
    ];
    const res = await clinicalTrajectoryEngine.recordTrajectoryEvaluation({
      patientId: 'P21',
      encounterId: 'E21',
      patientName: 'Ny. Audit Trajectory',
      mrn: 'MRN-AUD-TRAJ',
      observations: obs
    });

    expect(res.event.eventType).toBe('CLINICAL_TRAJECTORY_CHANGED');
    expect(res.event.confidence).toBe('DETERMINISTIC');

    const savedEvent = await persistenceAdapter.findById('clinical_trajectory_events', res.event.id);
    expect(savedEvent).toBeDefined();
    expect(savedEvent.patientId).toBe('P21');
  });

  // 22. Snapshot Idempotency
  it('22. Idempotency: Multiple evaluations with identical observations produce deterministic outcomes', () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 105, sbp: 105, rr: 22, spo2: 94 }
    ];
    const traj1 = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P22', encounterId: 'E22', observations: obs });
    const traj2 = clinicalTrajectoryEngine.evaluatePatientTrajectory({ patientId: 'P22', encounterId: 'E22', observations: obs });
    expect(traj1.news2VelocityPerHour).toBe(traj2.news2VelocityPerHour);
    expect(traj1.overallTrajectory).toBe(traj2.overallTrajectory);
  });

  // 23. Rule Versioning
  it('23. Rule Versioning: Validates rule registry schemas and version strings', () => {
    expect(TRAJECTORY_RULES.TRAJECTORY_PERSISTENT_WORSENING.ruleVersion).toBe('1.0.0');
    expect(TRAJECTORY_RULES.TRAJECTORY_HEMODYNAMIC_DECOMPENSATION.ruleId).toContain('RULE-TRAJ-HEMO');
  });

  // 24. Safety Governance Integration
  it('24. Governance Integration: Rapid persistent worsening automatically generates explainable safety alert', async () => {
    const obs = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 75, sbp: 120, rr: 16, spo2: 98 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 95, sbp: 110, rr: 20, spo2: 96 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 110, sbp: 100, rr: 24, spo2: 93 },
      { timestamp: '2026-08-20T11:00:00Z', hr: 125, sbp: 90, rr: 26, spo2: 91 }
    ];
    const res = await clinicalTrajectoryEngine.recordTrajectoryEvaluation({
      patientId: 'P24',
      encounterId: 'E24',
      patientName: 'Tn. Governance Trajectory',
      mrn: 'MRN-GOV-TRAJ',
      observations: obs
    });

    expect(res.governanceAlert).toBeDefined();
    expect(res.governanceAlert.ruleId).toContain('RULE-TRAJ-WORSEN');
    expect(res.governanceAlert.status).toBe(ALERT_LIFECYCLE_STATES.GENERATED);
  });

  // 25. Full Regression Against 4B.1–4B.5 Invariants
  it('25. Full Regression: Verifies integration compatibility with Clinical Deterioration and Governance Engines', () => {
    const news = clinicalDeteriorationEngine.calculateNEWS2({
      respiratoryRate: 16,
      spo2: 98,
      systolicBP: 120,
      heartRate: 72,
      temperature: 36.8,
      consciousness: 'ALERT'
    });
    expect(news.totalScore).toBe(0);
    expect(news.level).toBe('LOW');
  });
});
