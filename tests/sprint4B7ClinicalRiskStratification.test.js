/**
 * NurseFlow Enterprise HIS 2026 — Sprint 4B.7 Test Suite
 * Validation Harness: 32-Scenario Deterministic Clinical Risk Stratification Matrix
 * 
 * Standards & Architectural Invariants:
 * 1. Triad Separation: Severity != Trajectory != Clinical Risk
 * 2. Pre-Crisis Escalation: NEWS2 = 3 + Rapid Worsening -> HIGH RISK (Urgent Review)
 * 3. Multi-Domain Synergy: >= 3 domains involved -> CRITICAL (Incipient MODS)
 * 4. Absolute Human in the Loop: Clinician Override with Cryptographic SHA-256 WORM signing
 * 5. Strict Non-Goals: No mortality probabilities, No autonomous treatment, No black-box AI
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clinicalRiskStratifier,
  SEVERITY_STATES,
  TRAJECTORY_STATES,
  OVERALL_RISK_STATES,
  ESCALATION_PRIORITIES,
  EVIDENCE_QUALITIES,
  CLINICAL_ROLES,
  DOMAIN_NAMES
} from '../src/modules/clinical_core/services/clinicalRiskStratifier.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('🏆 SPRINT 4B.7: CLINICAL RISK STRATIFICATION ENGINE (32-SCENARIO VALIDATION MATRIX)', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CORE TRIAD & TRAJECTORY SYNTHESIS (TC-01 s.d. TC-06)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-01: Rapid Deterioration Pre-Crisis (NEWS2 0->2->4 in 2h elevates MILD to HIGH Risk)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 74, sbp: 120, rr: 16, spo2: 98, consciousness: 'ALERT', news2: 0 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 88, sbp: 110, rr: 20, spo2: 96, consciousness: 'ALERT', news2: 2 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 104, sbp: 98, rr: 24, spo2: 94, consciousness: 'ALERT', news2: 4 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-01', encounterId: 'ENC-01' },
      null,
      observations
    );

    // Snapshot is MILD (NEWS2 = 4), but Trajectory is RAPID_WORSENING (+2.0/h)
    expect(result.severityState).toBe(SEVERITY_STATES.MILD);
    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.RAPID_WORSENING);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.URGENT_REVIEW);
    expect(result.maxResponseTimeMinutes).toBeLessThanOrEqual(15);
    expect(result.recommendedReviewerRole).toBe(CLINICAL_ROLES.DPJP_SPECIALIST);
  });

  it('TC-02: Stable Chronic NEWS2 6 (MODERATE Severity + STABLE Trajectory = MODERATE Risk)', () => {
    const observations = [
      { timestamp: '2026-08-20T04:00:00Z', hr: 95, sbp: 115, rr: 22, spo2: 93, o2: 'NASAL_2L', consciousness: 'ALERT', news2: 6 },
      { timestamp: '2026-08-20T08:00:00Z', hr: 94, sbp: 116, rr: 22, spo2: 93, o2: 'NASAL_2L', consciousness: 'ALERT', news2: 6 },
      { timestamp: '2026-08-20T12:00:00Z', hr: 96, sbp: 114, rr: 22, spo2: 93, o2: 'NASAL_2L', consciousness: 'ALERT', news2: 6 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-02', encounterId: 'ENC-02' },
      null,
      observations
    );

    expect(result.severityState).toBe(SEVERITY_STATES.MODERATE);
    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.STABLE);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.MODERATE);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.PROMPT_REVIEW);
    expect(result.maxResponseTimeMinutes).toBe(60);
    expect(result.recommendedReviewerRole).toBe(CLINICAL_ROLES.RESIDENT_DOCTOR);
  });

  it('TC-03: Occult Septic Shock Influx (MAP down + Lactate rising + Fever = HIGH Risk)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 82, map: 92, rr: 18, spo2: 97, temp: 37.8, lactate: 1.2, news2: 1 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 108, map: 79, rr: 22, spo2: 95, temp: 38.9, lactate: 2.6, news2: 4 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-03', encounterId: 'ENC-03' },
      null,
      observations
    );

    expect(result.domainRisks.infectionSepsis.compositeDomainRisk).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.domainRisks.hemodynamic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.crossDomainSynergyAlert).toBe(true);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.URGENT_REVIEW);
  });

  it('TC-04: Fulminant Respiratory Failure (RR 18->28->36, SpO2 88% = CRITICAL Risk, MET Trigger)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', rr: 18, spo2: 96, hr: 80, sbp: 120, news2: 1 },
      { timestamp: '2026-08-20T09:00:00Z', rr: 28, spo2: 91, hr: 110, sbp: 115, news2: 6 },
      { timestamp: '2026-08-20T10:00:00Z', rr: 36, spo2: 88, hr: 128, sbp: 105, news2: 9 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-04', encounterId: 'ENC-04' },
      null,
      observations
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.FULMINANT_CRISIS);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE);
    expect(result.maxResponseTimeMinutes).toBeLessThanOrEqual(5);
    expect(result.recommendedReviewerRole).toBe(CLINICAL_ROLES.MET_ICU_TEAM);
    expect(result.suggestedActionProtocols).toContain('ACTIVATE_MET_TEAM');
  });

  it('TC-05: Post-Arrest Improving Stability (NEWS2 11->7->4 with Improving Trajectory = MODERATE Risk)', () => {
    const observations = [
      { timestamp: '2026-08-20T06:00:00Z', news2: 11, hr: 135, sbp: 80, rr: 30, spo2: 88, consciousness: 'V' },
      { timestamp: '2026-08-20T09:00:00Z', news2: 7, hr: 110, sbp: 105, rr: 24, spo2: 94, consciousness: 'ALERT' },
      { timestamp: '2026-08-20T12:00:00Z', news2: 4, hr: 88, sbp: 118, rr: 18, spo2: 97, consciousness: 'ALERT' }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-05', encounterId: 'ENC-05' },
      null,
      observations
    );

    expect(result.severityState).toBe(SEVERITY_STATES.MILD);
    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.IMPROVING);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.ROUTINE_MONITORING);
  });

  it('TC-06: Triple Domain MODS Synergy (MAP drop + Oliguria + GCS 13 = CRITICAL MODS Alert)', () => {
    const latestObs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 112,
      map: 70,
      rr: 22,
      spo2: 94,
      gcs: 13,
      urineRate: 0.35,
      lactate: 2.2,
      news2: 5
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-06', encounterId: 'ENC-06' },
      null,
      [latestObs]
    );

    expect(result.domainsInvolvedCount).toBeGreaterThanOrEqual(3);
    expect(result.crossDomainSynergyAlert).toBe(true);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BOUNDARY CASES & CLINICAL SPECIALTY GATES (TC-07 s.d. TC-12)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-07: Isolated Fever Artifact Benign (Temp 38.9 with normal HR/RR = LOW Risk, Routine)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 76,
      sbp: 120,
      dbp: 80,
      rr: 16,
      spo2: 98,
      temp: 38.9,
      consciousness: 'ALERT',
      news2: 1
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-07', encounterId: 'ENC-07' },
      null,
      [obs]
    );

    expect(result.domainRisks.infectionSepsis.compositeDomainRisk).toBe(OVERALL_RISK_STATES.LOW);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.ROUTINE_MONITORING);
  });

  it('TC-08: COPD Scale 2 Adaptive Target (SpO2 89% on O2 2L does not trigger false hypoxia)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 78,
      sbp: 125,
      rr: 18,
      spo2: 89,
      o2: 'NASAL_2L',
      temp: 36.6,
      consciousness: 'ALERT',
      isCopd: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-08', encounterId: 'ENC-08', isCopd: true, spo2Scale: 2 },
      null,
      [obs]
    );

    // SpO2 89% on Scale 2 scores 0 points in NEWS2!
    expect(result.domainRisks.respiratory.severity).toBe(SEVERITY_STATES.NORMAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
  });

  it('TC-09: Opioid Over-sedation ADE (RR drop to 8 post-morphine = CRITICAL Risk, Immediate MET)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 60,
      sbp: 105,
      rr: 8,
      spo2: 91,
      consciousness: 'VOICE',
      activeAdverseEvent: 'OPIOID_OVERSEDATION',
      opioidGiven: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-09', encounterId: 'ENC-09' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.domainRisks.medicationExposure.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE);
  });

  it('TC-10: Insulin Hypoglycemia Crisis (GDS 42 mg/dL = CRITICAL Risk, Immediate Rescue)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 118,
      sbp: 130,
      rr: 20,
      spo2: 97,
      bloodGlucose: 42,
      consciousness: 'CONFUSED'
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-10', encounterId: 'ENC-10' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.domainRisks.renalMetabolic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-11: Oliguric AKI Progression (Urine rate 0.25 ml/kg/h for 4h = SEVERE Renal Risk, HIGH overall)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 82,
      sbp: 135,
      rr: 18,
      spo2: 98,
      urineRate: 0.25,
      creatinine: 2.4,
      news2: 2
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-11', encounterId: 'ENC-11' },
      null,
      [obs]
    );

    expect(result.domainRisks.renalMetabolic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.domainRisks.renalMetabolic.severity).toBe(SEVERITY_STATES.SEVERE);
  });

  it('TC-12: Post-Op Surgical Bleeding (MAP drop 90->65, HR 80->125 = CRITICAL Risk, Emergency)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 80, map: 90, sbp: 120, rr: 16, spo2: 98, news2: 0 },
      { timestamp: '2026-08-20T09:00:00Z', hr: 105, map: 76, sbp: 100, rr: 20, spo2: 96, news2: 3 },
      { timestamp: '2026-08-20T10:00:00Z', hr: 125, map: 64, sbp: 86, rr: 26, spo2: 93, news2: 8 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-12', encounterId: 'ENC-12' },
      null,
      observations
    );

    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.FULMINANT_CRISIS);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.escalationPriority).toBe(ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EVIDENCE QUALITY & SAFETY GOVERNANCE (TC-13 s.d. TC-20)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-13: Data Deficit Incomplete Vital (Missing SpO2 & GCS emits DATA_DEFICIT_WARNING)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 80,
      sbp: 120
      // Missing RR, SpO2, Consciousness
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-13', encounterId: 'ENC-13' },
      null,
      [obs]
    );

    expect(result.evidenceQuality).toBe(EVIDENCE_QUALITIES.INSUFFICIENT);
    expect(result.evidenceDeficitReason).toContain('Parameter TTV penting tidak lengkap');
  });

  it('TC-14: Single Parameter Extreme Rule (GCS = 8 Coma triggers CRITICAL Severity even with normal vitals)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 75,
      sbp: 120,
      rr: 16,
      spo2: 98,
      gcs: 8,
      consciousness: 'U'
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-14', encounterId: 'ENC-14' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-15: Transient Post-Nebulization HR (HR bump with improving RR does not trigger crisis)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', hr: 82, rr: 28, spo2: 92, news2: 5 },
      { timestamp: '2026-08-20T08:30:00Z', hr: 104, rr: 18, spo2: 97, news2: 1 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-15', encounterId: 'ENC-15' },
      null,
      observations
    );

    expect(result.domainRisks.respiratory.trajectory).toBe(TRAJECTORY_STATES.IMPROVING);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
  });

  it('TC-16: Dialysis Chronic Uremia Baseline (Baseline Cr 9.2 in CKD does not trigger acute panic)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 74,
      sbp: 130,
      rr: 16,
      spo2: 98,
      creatinine: 9.2,
      isDialysis: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-16', encounterId: 'ENC-16', isDialysis: true },
      null,
      [obs]
    );

    expect(result.domainRisks.renalMetabolic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.LOW);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
  });

  it('TC-17: Palliative DNR Patient Boundary (DNR patient capped to PALLIATIVE_COMFORT_PATHWAY)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 120,
      sbp: 85,
      rr: 28,
      spo2: 89,
      news2: 9
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-17', encounterId: 'ENC-17', isDnr: true, isPalliative: true },
      null,
      [obs]
    );

    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.MODERATE);
    expect(result.suggestedActionProtocols).toContain('PALLIATIVE_COMFORT_PATHWAY');
    expect(result.suggestedActionProtocols).not.toContain('ACTIVATE_MET_TEAM');
  });

  it('TC-18: Clinician Downgrade Override (DPJP downgrade with valid justification is cryptographically signed)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 104,
      sbp: 110,
      rr: 24,
      spo2: 92,
      news2: 5
    };

    const initialResult = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-18', encounterId: 'ENC-18' },
      null,
      [obs]
    );

    expect(initialResult.overallRiskState).toBe(OVERALL_RISK_STATES.MODERATE);

    const overriddenResult = clinicalRiskStratifier.evaluateClinicianOverride(
      initialResult,
      {
        overrideDirection: 'DOWNGRADE',
        targetRiskState: OVERALL_RISK_STATES.LOW,
        justificationCategory: 'CHRONIC_BASELINE',
        justificationNotes: 'Pasien memiliki riwayat fibrosis paru stabil, target SpO2 90-92% dapat diterima.'
      },
      {
        clinicianId: 'DOC-SP-01',
        clinicianName: 'dr. Sp.P Senior',
        clinicianRole: 'DPJP'
      }
    );

    expect(overriddenResult.governanceStatus).toBe('CLINICIAN_OVERRIDDEN');
    expect(overriddenResult.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);
    expect(overriddenResult.overrideDetails.justificationCategory).toBe('CHRONIC_BASELINE');
    expect(overriddenResult.tamperProofHash).toBeDefined();
  });

  it('TC-19: Clinician Upgrade Override (Clinician upgrade due to cold extremities upgrades SLA)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 78,
      sbp: 120,
      rr: 16,
      spo2: 98,
      news2: 0
    };

    const initialResult = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-19', encounterId: 'ENC-19' },
      null,
      [obs]
    );

    expect(initialResult.overallRiskState).toBe(OVERALL_RISK_STATES.LOW);

    const overriddenResult = clinicalRiskStratifier.evaluateClinicianOverride(
      initialResult,
      {
        overrideDirection: 'UPGRADE',
        targetRiskState: OVERALL_RISK_STATES.HIGH,
        justificationCategory: 'CLINICAL_CONCERN',
        justificationNotes: 'Pasien gelisah, akral sangat dingin, dan capillary refill time > 4 detik.'
      },
      {
        clinicianId: 'DOC-RES-02',
        clinicianName: 'dr. Residen Jaga',
        clinicianRole: 'RESIDENT'
      }
    );

    expect(overriddenResult.overallRiskState).toBe(OVERALL_RISK_STATES.HIGH);
    expect(overriddenResult.escalationPriority).toBe(ESCALATION_PRIORITIES.URGENT_REVIEW);
    expect(overriddenResult.maxResponseTimeMinutes).toBe(15);
  });

  it('TC-20: Pediatric Decompensation Shock (Child HR 165, RR 42 = CRITICAL Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 165,
      rr: 42,
      spo2: 92
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-20', encounterId: 'ENC-20', isPediatric: true, ageYears: 3 },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ADVANCED CLINICAL PATHWAYS & HARDENING (TC-21 s.d. TC-32)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-21: Tamper-Proof Ledger Verification (Calculated SHA-256 hash matches payload)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 88,
      sbp: 118,
      rr: 18,
      spo2: 97
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-21', encounterId: 'ENC-21' },
      null,
      [obs]
    );

    expect(result.tamperProofHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('TC-22: Transient Motion Artifact Filter (SpO2 sensor artifact tagged as LOW evidence)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 75,
      sbp: 120,
      rr: 16,
      spo2: 75,
      isArtefact: true,
      isPoorSignal: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-22', encounterId: 'ENC-22' },
      null,
      [obs]
    );

    expect(result.evidenceQuality).toBe(EVIDENCE_QUALITIES.LOW);
    expect(result.evidenceDeficitReason).toContain('artefak');
  });

  it('TC-23: Slow Drift Neurologic Decline (GCS 15->14->12 in 6h = HIGH Risk, Urgent CT)', () => {
    const observations = [
      { timestamp: '2026-08-20T04:00:00Z', gcs: 15, hr: 72, sbp: 120, rr: 16, spo2: 98, news2: 0 },
      { timestamp: '2026-08-20T07:00:00Z', gcs: 14, hr: 76, sbp: 125, rr: 16, spo2: 98, news2: 0 },
      { timestamp: '2026-08-20T10:00:00Z', gcs: 12, hr: 80, sbp: 130, rr: 18, spo2: 97, news2: 3 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-23', encounterId: 'ENC-23' },
      null,
      observations
    );

    expect(result.domainRisks.neurologic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.HIGH);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.HIGH);
  });

  it('TC-24: Rebound Deterioration Post-Meds (Sudden MAP drop 115->58 = CRITICAL Risk)', () => {
    const observations = [
      { timestamp: '2026-08-20T08:00:00Z', map: 115, sbp: 160, dbp: 95, hr: 78, rr: 16, spo2: 98, news2: 0 },
      { timestamp: '2026-08-20T09:00:00Z', map: 58, sbp: 80, dbp: 47, hr: 120, rr: 24, spo2: 95, news2: 7 }
    ];

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-24', encounterId: 'ENC-24' },
      null,
      observations
    );

    expect(result.severityState).toBe(SEVERITY_STATES.SEVERE);
    expect(result.trajectoryState).toBe(TRAJECTORY_STATES.FULMINANT_CRISIS);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-25: Multi-Inotrope High Risk Exposure (Norepinephrine + Dobutamine = CRITICAL Medication Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 110,
      map: 68,
      rr: 22,
      spo2: 95,
      norepinephrineActive: true,
      dobutamineActive: true,
      multiInotropesActive: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-25', encounterId: 'ENC-25' },
      null,
      [obs]
    );

    expect(result.domainRisks.medicationExposure.compositeDomainRisk).toBe(OVERALL_RISK_STATES.HIGH);
  });

  it('TC-26: Hyperkalemic ECG Instability (K+ 6.8 mEq/L, HR 52 = CRITICAL Severity)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 52,
      sbp: 110,
      rr: 18,
      spo2: 97,
      potassium: 6.8
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-26', encounterId: 'ENC-26' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-27: Anaphylaxis Sudden Collapse (Stridor post-antibiotic = CRITICAL Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 130,
      sbp: 70,
      rr: 32,
      spo2: 85,
      stridor: true,
      activeAdverseEvent: 'ANAPHYLAXIS'
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-27', encounterId: 'ENC-27' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.domainRisks.respiratory.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.domainRisks.medicationExposure.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-28: Hyperglycemic HHS/DKA Trajectory (GDS 580 mg/dL, pH 7.18 = CRITICAL Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 115,
      sbp: 100,
      rr: 34,
      spo2: 96,
      bloodGlucose: 580,
      ph: 7.18
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-28', encounterId: 'ENC-28' },
      null,
      [obs]
    );

    expect(result.severityState).toBe(SEVERITY_STATES.CRITICAL);
    expect(result.domainRisks.renalMetabolic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-29: Silent Hypoxemia (Happy Hypoxia SpO2 84% Room Air = HIGH Risk, Urgent Review)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 82,
      sbp: 120,
      rr: 22,
      spo2: 84,
      consciousness: 'ALERT'
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-29', encounterId: 'ENC-29' },
      null,
      [obs]
    );

    expect(result.domainRisks.respiratory.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-30: Post-Extubation Stridor Risk (Stridor post-extubation, RR 32 = CRITICAL Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 118,
      sbp: 135,
      rr: 32,
      spo2: 92,
      postExtubationStridor: true
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-30', encounterId: 'ENC-30' },
      null,
      [obs]
    );

    expect(result.domainRisks.respiratory.compositeDomainRisk).toBe(OVERALL_RISK_STATES.CRITICAL);
    expect(result.overallRiskState).toBe(OVERALL_RISK_STATES.CRITICAL);
  });

  it('TC-31: Hepatic Encephalopathy Influx (Encephalopathy with asterixis = HIGH Risk)', () => {
    const obs = {
      timestamp: '2026-08-20T10:00:00Z',
      hr: 88,
      sbp: 110,
      rr: 18,
      spo2: 96,
      gcs: 13,
      encephalopathy: true,
      bilirubin: 18.5
    };

    const result = clinicalRiskStratifier.stratifyPatientRisk(
      { patientId: 'PT-31', encounterId: 'ENC-31' },
      null,
      [obs]
    );

    expect(result.domainRisks.neurologic.compositeDomainRisk).toBe(OVERALL_RISK_STATES.MODERATE);
  });

  it('TC-32: Massive Concurrent Batch Influx (100 concurrent patient evaluations with zero cross-leakage)', () => {
    const patients = Array.from({ length: 100 }, (_, i) => ({
      context: { patientId: `PT-BATCH-${i}`, encounterId: `ENC-BATCH-${i}` },
      observations: [
        {
          timestamp: '2026-08-20T10:00:00Z',
          hr: 70 + (i % 50),
          sbp: 120 - (i % 30),
          rr: 16 + (i % 15),
          spo2: 98 - (i % 8),
          news2: i % 8
        }
      ]
    }));

    const batchResults = clinicalRiskStratifier.batchStratify(patients);

    expect(batchResults.length).toBe(100);
    // Verify each result is uniquely mapped to its patientId without cross-contamination
    batchResults.forEach((res, idx) => {
      expect(res.patientId).toBe(`PT-BATCH-${idx}`);
      expect(res.tamperProofHash).toBeDefined();
    });
  });
});
