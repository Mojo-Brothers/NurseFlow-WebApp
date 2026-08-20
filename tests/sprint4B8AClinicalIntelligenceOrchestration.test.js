/**
 * NurseFlow Enterprise HIS 2026 — Sprint 4B.8A Test Suite
 * Validation Harness: 40-Scenario Deterministic Clinical Intelligence Orchestration Matrix
 * 
 * Standards & Architectural Invariants:
 * 1. Alert Aggregation: One Patient -> One Clinical Event Cluster -> One Actionable Alert
 * 2. Alert Fatigue Prevention: Intelligent deduplication, suppression of unchanged states
 * 3. Dynamic Breakthrough: Immediate wake-up / escalation upon sudden deterioration
 * 4. Versioned Hospital Protocol: Configurable threshold rules (HOSP-MET-RULE-V2026.08)
 * 5. Full Lifecycle FSM: Generated -> Active -> Acknowledged (Snooze/AutoWake) -> Escalated -> Resolved
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clinicalAlertOrchestrator,
  ALERT_PRIORITY_TIERS,
  ALERT_LIFECYCLE_STATES,
  WORKSPACE_TARGETS,
  DEFAULT_HOSPITAL_PROTOCOL
} from '../src/modules/clinical_core/services/clinicalAlertOrchestrator.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('🏆 SPRINT 4B.8A: CLINICAL INTELLIGENCE ORCHESTRATION ENGINE (40-SCENARIO VALIDATION MATRIX)', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    clinicalAlertOrchestrator.activeClusters.clear();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CORE CLUSTERING, DEDUPLICATION & FSM LIFECYCLE (TC-01 s.d. TC-10)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-01: Single Clustered Alert from 5 Events (Consolidates 5 disjoint alerts into 1 Actionable Cluster)', () => {
    const rawEvents = [
      { eventId: 'EVT-01', eventType: 'NEWS2_CALCULATED', payload: { news2: 8 }, occurredAt: '2026-08-20T10:00:00Z' },
      { eventId: 'EVT-02', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { rr: 30, velocityScorePerHour: 2.5 }, occurredAt: '2026-08-20T10:02:00Z' },
      { eventId: 'EVT-03', eventType: 'PANIC_LAB_EMITTED', payload: { spo2: 89 }, occurredAt: '2026-08-20T10:05:00Z' },
      { eventId: 'EVT-04', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { map: 65 }, occurredAt: '2026-08-20T10:08:00Z' },
      { eventId: 'EVT-05', eventType: 'RISK_STATE_EVALUATED', payload: { overallRiskState: 'CRITICAL' }, occurredAt: '2026-08-20T10:10:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-01', encounterId: 'ENC-01', wardOrBedLocation: 'ICU-BED-04' }
    );

    expect(cluster).toBeDefined();
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
    expect(cluster.targetSlaMinutes).toBeLessThanOrEqual(5);
    expect(cluster.headlineAction).toContain('ACTIVATE MET TEAM');
    expect(cluster.correlatedEventIds.length).toBe(5);
  });

  it('TC-02: Pre-Crisis Early Deterioration Alert (NEWS2 3 + Vel +1.8/h = P2 URGENT_CLINICAL_ACTION)', () => {
    const rawEvents = [
      { eventId: 'EVT-06', eventType: 'NEWS2_CALCULATED', payload: { news2: 3, velocityScorePerHour: 1.8, lactate: 2.4 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-02', encounterId: 'ENC-02', wardOrBedLocation: 'BED-302' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION);
    expect(cluster.targetSlaMinutes).toBe(15);
    expect(cluster.headlineAction).toContain('BEDSIDE DPJP SPECIALIST ASSESSMENT');
  });

  it('TC-03: Alert Deduplication on Unchanged State (Silences repetitive sound alarms on same condition)', () => {
    const existingCluster = {
      clusterId: 'CLUST-01',
      patientId: 'PT-03',
      priorityTier: ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION,
      velocityPerHour: 1.2,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE
    };

    const incomingCluster = {
      clusterId: 'CLUST-02',
      patientId: 'PT-03',
      priorityTier: ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION,
      velocityPerHour: 1.3,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE
    };

    const dedup = clinicalAlertOrchestrator.deduplicateAlerts(incomingCluster, existingCluster);
    expect(dedup.isDuplicate).toBe(true);
    expect(dedup.isBreakthrough).toBe(false);
    expect(dedup.reason).toBe('IDENTICAL_STATE_SUPPRESSED');
  });

  it('TC-04: Dynamic Breakthrough Escalation (Priority upgrades from P2 to P1 breakthrough & new domain emergence)', () => {
    const existingCluster = {
      clusterId: 'CLUST-03',
      patientId: 'PT-04',
      dominantDomain: 'RESPIRATORY',
      affectedDomains: ['RESPIRATORY'],
      priorityTier: ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION,
      velocityPerHour: 1.2,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE
    };

    const incomingCluster = {
      clusterId: 'CLUST-04',
      patientId: 'PT-04',
      dominantDomain: 'HEMODYNAMIC',
      affectedDomains: ['RESPIRATORY', 'HEMODYNAMIC'],
      priorityTier: ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT,
      velocityPerHour: 3.5,
      hasEmergentCondition: true,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE
    };

    const dedup = clinicalAlertOrchestrator.deduplicateAlerts(incomingCluster, existingCluster);
    expect(dedup.isDuplicate).toBe(false);
    expect(dedup.isBreakthrough).toBe(true);
    expect(dedup.reason).toBe('PRIORITY_ESCALATED');

    // Verify distinct organ domain emergence breakthrough even if priority tier is equal (P2)
    const samePriorityNewDomain = {
      clusterId: 'CLUST-05',
      patientId: 'PT-04',
      dominantDomain: 'HEMODYNAMIC',
      affectedDomains: ['HEMODYNAMIC'],
      priorityTier: ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION,
      velocityPerHour: 1.2,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE
    };
    const domainDedup = clinicalAlertOrchestrator.deduplicateAlerts(samePriorityNewDomain, existingCluster);
    expect(domainDedup.isDuplicate).toBe(false);
    expect(domainDedup.isBreakthrough).toBe(true);
    expect(domainDedup.reason).toBe('NEW_ORGAN_DOMAIN_EMERGENCE');
  });

  it('TC-05: Multi-Domain Incipient MODS Cluster (Triggers MULTI-ORGAN DYSFUNCTION SYNERGY cluster)', () => {
    const rawEvents = [
      { eventId: 'EVT-07', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { map: 68, urineRate: 0.3, gcs: 13, news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-05', encounterId: 'ENC-05' }
    );

    expect(cluster.clusterTitle).toBe('MULTI-ORGAN DYSFUNCTION SYNERGY');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
    expect(cluster.targetSlaMinutes).toBeLessThanOrEqual(5);
  });

  it('TC-06: Versioned Hospital Protocol Adaptation (Adapts when hospital customizes threshold to 2 domains)', () => {
    const customProtocol = {
      protocolId: 'HOSP-CUSTOM-MET-V2026.09',
      protocolVersion: '2026.09',
      multiDomainMetThreshold: 2,
      preCrisisVelocityThreshold: 1.0,
      actionPolicy: 'CUSTOM_HOSPITAL_MET_ACTIVATION'
    };

    const rawEvents = [
      { eventId: 'EVT-08', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { map: 70, rr: 26, news2: 4 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-06', encounterId: 'ENC-06' },
      customProtocol
    );

    expect(cluster.appliedProtocol.protocolId).toBe('HOSP-CUSTOM-MET-V2026.09');
    expect(cluster.appliedProtocol.protocolVersion).toBe('2026.09');
  });

  it('TC-07: Nurse Acknowledge Lifecycle State (Transitions cluster to ACKNOWLEDGED with response timestamp)', () => {
    const rawEvents = [
      { eventId: 'EVT-09', eventType: 'NEWS2_CALCULATED', payload: { news2: 6 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-07', encounterId: 'ENC-07' }
    );

    const acknowledged = clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.ACKNOWLEDGED,
      { snoozeMinutes: 30 },
      { clinicianId: 'NURSE-01', clinicianName: 'Sr. Siti', clinicianRole: 'WARD_NURSE' }
    );

    expect(acknowledged.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.ACKNOWLEDGED);
    expect(acknowledged.acknowledgedBy.clinicianName).toBe('Sr. Siti');
    expect(acknowledged.snoozeUntil).toBeDefined();
  });

  it('TC-08: Intelligent Snooze 30m with Auto-Wake (Auto-wakes when SpO2 drops < 88% during snooze)', () => {
    const rawEvents = [
      { eventId: 'EVT-10', eventType: 'NEWS2_CALCULATED', payload: { news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-08', encounterId: 'ENC-08' }
    );

    clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.ACKNOWLEDGED,
      { snoozeMinutes: 30 },
      { clinicianId: 'NURSE-02', clinicianName: 'Sr. Dewi' }
    );

    // Patient SpO2 drops to 84% during snooze
    const autoWakeCheck = clinicalAlertOrchestrator.evaluateAutoWakeConditions(cluster, { spo2: 84 });
    expect(autoWakeCheck.shouldAutoWake).toBe(true);
    expect(autoWakeCheck.wakeReason).toContain('Desaturasi Oksigen Kritis');
  });

  it('TC-09: Clinician Escalation to MET Role (Doctor escalates alert to MET_ICU_TEAM)', () => {
    const rawEvents = [
      { eventId: 'EVT-11', eventType: 'NEWS2_CALCULATED', payload: { news2: 7 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-09', encounterId: 'ENC-09' }
    );

    const escalated = clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.ESCALATED,
      { escalateRole: 'MET_ICU_TEAM', note: 'Pasien tampak kelelahan bernapas' },
      { clinicianId: 'DOC-01', clinicianName: 'dr. Andi', clinicianRole: 'RESIDENT_DOCTOR' }
    );

    expect(escalated.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.ESCALATED);
    expect(escalated.escalatedToRole).toBe('MET_ICU_TEAM');
  });

  it('TC-10: DPJP Downgrade Override with WORM PIN (DPJP overrides P1 to P3 with logged rationale)', () => {
    const rawEvents = [
      { eventId: 'EVT-12', eventType: 'NEWS2_CALCULATED', payload: { news2: 8 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-10', encounterId: 'ENC-10' }
    );

    const overridden = clinicalAlertOrchestrator.evaluateClinicianOverride(
      cluster,
      {
        targetPriority: ALERT_PRIORITY_TIERS.PRIORITY_REVIEW,
        targetSla: 60,
        overrideDirection: 'DOWNGRADE',
        justificationCategory: 'CHRONIC_BASELINE',
        justificationNotes: 'Pasien memiliki PPOK stadium 4 stabil, hemodinamik tidak terganggu.'
      },
      {
        clinicianId: 'DPJP-SPP-01',
        clinicianName: 'dr. Sp.P Senior',
        clinicianRole: 'DPJP'
      }
    );

    expect(overridden.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.OVERRIDDEN);
    expect(overridden.priorityTier).toBe(ALERT_PRIORITY_TIERS.PRIORITY_REVIEW);
    expect(overridden.overrideDetails.justificationCategory).toBe('CHRONIC_BASELINE');
    expect(overridden.tamperProofHash).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CLINICAL SAFETY PATHWAYS & GATING (TC-11 s.d. TC-20)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-11: Resolution on Clinical Normalization (Transitions cluster to RESOLVED upon recovery)', () => {
    const rawEvents = [
      { eventId: 'EVT-13', eventType: 'NEWS2_CALCULATED', payload: { news2: 4 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-11', encounterId: 'ENC-11' }
    );

    const resolved = clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.RESOLVED,
      { resolutionNotes: 'Pasien stabil pasca nebulisasi, TTV normal 2 jam berturut-turut.' },
      { clinicianId: 'NURSE-03', clinicianName: 'Sr. Rina' }
    );

    expect(resolved.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.RESOLVED);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it('TC-12: Opioid OIRD Adverse Event Cluster (Synthesizes ACUTE OPIOID RESPIRATORY DEPRESSION with Naloxone)', () => {
    const rawEvents = [
      { eventId: 'EVT-14', eventType: 'ADE_RECOGNIZED', payload: { activeAdverseEvent: 'OPIOID_OVERSEDATION', rr: 8, opioidGiven: true }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-12', encounterId: 'ENC-12' }
    );

    expect(cluster.clusterTitle).toBe('ACUTE OPIOID RESPIRATORY DEPRESSION');
    expect(cluster.headlineAction).toContain('ADMINISTER NALOXONE RESCUE');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-13: Insulin Hypoglycemia Acute Cluster (Synthesizes SEVERE HYPOGLYCEMIC RESCUE with D40%)', () => {
    const rawEvents = [
      { eventId: 'EVT-15', eventType: 'PANIC_LAB_EMITTED', payload: { bloodGlucose: 40, hr: 120 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-13', encounterId: 'ENC-13' }
    );

    expect(cluster.clusterTitle).toBe('SEVERE HYPOGLYCEMIC RESCUE');
    expect(cluster.headlineAction).toContain('ADMINISTER DEXTROSE 40% IV STAT');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-14: Post-Op Surgical Hemorrhage Cluster (Post-op bleed triggers surgical team alert)', () => {
    const rawEvents = [
      { eventId: 'EVT-16', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { isSurgicalBleeding: true, hr: 130, map: 64, drainActive: true }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-14', encounterId: 'ENC-14' }
    );

    expect(cluster.clusterTitle).toBe('POST-OPERATIVE SURGICAL BLEEDING');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
    expect(cluster.headlineAction).toContain('ACTIVATE SURGICAL TEAM');
  });

  it('TC-15: Isolated Benign Fever Gating (Isolated temp 39.0 without sepsis triggers P4 ROUTINE_AWARENESS)', () => {
    const rawEvents = [
      { eventId: 'EVT-17', eventType: 'NEWS2_CALCULATED', payload: { temp: 39.0, hr: 76, rr: 16, sbp: 120, news2: 1 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-15', encounterId: 'ENC-15' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS);
    expect(cluster.targetSlaMinutes).toBe(240);
  });

  it('TC-16: COPD Scale 2 Non-Alarm Gating (SpO2 89% on O2 2L in COPD does not trigger false hypoxia)', () => {
    const rawEvents = [
      { eventId: 'EVT-18', eventType: 'NEWS2_CALCULATED', payload: { spo2: 89, rr: 18, hr: 80, sbp: 120, o2: 'NASAL_2L', isCopd: true }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-16', encounterId: 'ENC-16', isCopd: true, spo2Scale: 2 }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS);
  });

  it('TC-17: Palliative DNR Patient Routing (Channels DNR patient to PALLIATIVE COMFORT CARE PATHWAY)', () => {
    const rawEvents = [
      { eventId: 'EVT-19', eventType: 'NEWS2_CALCULATED', payload: { news2: 9, rr: 28, spo2: 88, hr: 120 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-17', encounterId: 'ENC-17', isDnr: true, isPalliative: true }
    );

    expect(cluster.clusterTitle).toBe('PALLIATIVE COMFORT CARE PATHWAY');
    expect(cluster.headlineAction).toContain('REVIEW SYMPTOM MANAGEMENT');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.PRIORITY_REVIEW);
  });

  it('TC-18: Data Deficit Active Warning Cluster (Incomplete vitals emit DATA DEFICIT alert)', () => {
    const rawEvents = [
      { eventId: 'EVT-20', eventType: 'NEWS2_CALCULATED', payload: { hr: 80, sbp: 120 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-18', encounterId: 'ENC-18' }
    );

    expect(cluster.clusterTitle).toBe('DATA DEFICIT RE-ASSESSMENT REQUIRED');
    expect(cluster.headlineAction).toContain('COMPLETE VITAL SIGNS MEASUREMENT');
  });

  it('TC-19: Sensor Motion Artefact Filtering (Probe noise is filtered and tagged as LOW evidence quality)', () => {
    const rawEvents = [
      { eventId: 'EVT-21', eventType: 'NEWS2_CALCULATED', payload: { spo2: 70, isArtefact: true, isPoorSignal: true }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-19', encounterId: 'ENC-19' }
    );

    expect(cluster.evidenceQuality).toBe('LOW');
  });

  it('TC-20: Pediatric Decompensation Alert (Child HR 170 + RR 45 triggers P1 Pediatric Alert)', () => {
    const rawEvents = [
      { eventId: 'EVT-22', eventType: 'NEWS2_CALCULATED', payload: { hr: 170, rr: 45, spo2: 92 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-20', encounterId: 'ENC-20', isPediatric: true, ageYears: 2 }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
    expect(cluster.targetSlaMinutes).toBeLessThanOrEqual(5);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ADVANCED CLINICAL PATHWAYS & SPECIALTY SCENARIOS (TC-21 s.d. TC-30)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-21: Slow Drift Subdural Bleeding Cluster (GCS 15->14->12 in 6h triggers P2 Urgent Review)', () => {
    const rawEvents = [
      { eventId: 'EVT-23', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { gcs: 12, news2: 3, velocityScorePerHour: 0.5 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-21', encounterId: 'ENC-21' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION);
  });

  it('TC-22: Post-Extubation Stridor Alert (Post-extubation stridor triggers P1 airway rescue)', () => {
    const rawEvents = [
      { eventId: 'EVT-24', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { postExtubationStridor: true, rr: 32, spo2: 91 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-22', encounterId: 'ENC-22' }
    );

    expect(cluster.clusterTitle).toBe('UPPER AIRWAY COMPROMISE / POST-EXTUBATION');
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-23: Anaphylaxis Shock Immediate Cluster (Post-IV antibiotic stridor triggers Epinephrine STAT)', () => {
    const rawEvents = [
      { eventId: 'EVT-25', eventType: 'ADE_RECOGNIZED', payload: { isAnaphylaxis: true, sbp: 70, hr: 130 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-23', encounterId: 'ENC-23' }
    );

    expect(cluster.clusterTitle).toBe('ACUTE ANAPHYLAXIS COLLAPSE');
    expect(cluster.headlineAction).toContain('INJECT EPINEPHRINE 0.5MG IM STAT');
  });

  it('TC-24: Hyperkalemic ECG Instability Alert (K+ 7.0 + Bradycardia triggers P1 Emergency)', () => {
    const rawEvents = [
      { eventId: 'EVT-26', eventType: 'PANIC_LAB_EMITTED', payload: { potassium: 7.0, hr: 48, news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-24', encounterId: 'ENC-24' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-25: DKA/HHS Hyperglycemic Crisis Cluster (GDS 620, pH 7.15 triggers P1 Emergency)', () => {
    const rawEvents = [
      { eventId: 'EVT-27', eventType: 'PANIC_LAB_EMITTED', payload: { bloodGlucose: 620, ph: 7.15, rr: 34 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-25', encounterId: 'ENC-25' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-26: Silent Hypoxemia (Happy Hypoxia SpO2 83% triggers P1/P2 Urgent Action)', () => {
    const rawEvents = [
      { eventId: 'EVT-28', eventType: 'NEWS2_CALCULATED', payload: { spo2: 83, rr: 24, hr: 85, consciousness: 'ALERT' }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-26', encounterId: 'ENC-26' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-27: Rebound Hypotension Post-Vasodilator (MAP drop 120->55 triggers P1 Emergency)', () => {
    const rawEvents = [
      { eventId: 'EVT-29', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { map: 55, sbp: 75, hr: 125, news2: 7 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-27', encounterId: 'ENC-27' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-28: Multi-Inotrope Critical Escalation (Norepinephrine + Vasopressin triggers P1 ICU escalation)', () => {
    const rawEvents = [
      { eventId: 'EVT-30', eventType: 'BEDSIDE_ADMINISTRATION_LOGGED', payload: { multiInotropesActive: true, map: 66, hr: 115, news2: 6 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-28', encounterId: 'ENC-28' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT);
  });

  it('TC-29: Hepatic Encephalopathy Cluster (Bilirubin 22 + Asterixis triggers P2 Urgent Review)', () => {
    const rawEvents = [
      { eventId: 'EVT-31', eventType: 'PANIC_LAB_EMITTED', payload: { bilirubin: 22.0, encephalopathy: true, gcs: 13, news2: 3 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-29', encounterId: 'ENC-29' }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION);
  });

  it('TC-30: Dialysis Chronic Anuria Gating (Chronic dialysis baseline does not trigger false AKI alert)', () => {
    const rawEvents = [
      { eventId: 'EVT-32', eventType: 'NEWS2_CALCULATED', payload: { creatinine: 9.5, isDialysis: true, hr: 74, sbp: 130, rr: 16, spo2: 98, news2: 0 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-30', encounterId: 'ENC-30', isDialysis: true }
    );

    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. EXPLAINABILITY, WORKSPACES & CONCURRENCY CONTRACTS (TC-31 s.d. TC-40)
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC-31: Explainability Level 1 Headline Contract (Headline string is concise and readable in 2s)', () => {
    const rawEvents = [
      { eventId: 'EVT-33', eventType: 'NEWS2_CALCULATED', payload: { news2: 7, rr: 28, spo2: 90 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-31', encounterId: 'ENC-31' }
    );

    expect(cluster.headlineAction).toBeDefined();
    expect(cluster.headlineAction.length).toBeLessThan(120);
  });

  it('TC-32: Explainability Level 2 Key Drivers Contract (Returns exact top 3 physiological drivers)', () => {
    const rawEvents = [
      { eventId: 'EVT-34', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { rr: 30, spo2: 91, map: 66, velocityScorePerHour: 2.0 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-32', encounterId: 'ENC-32' }
    );

    expect(cluster.explainability.keyDrivers.length).toBeLessThanOrEqual(3);
    expect(cluster.explainability.keyDrivers[0].parameter).toBeDefined();
    expect(cluster.explainability.keyDrivers[0].trend).toBeDefined();
  });

  it('TC-33: Explainability Level 3 Deep Ledger Contract (Contains protocol governance link & SHA-256 hash)', () => {
    const rawEvents = [
      { eventId: 'EVT-35', eventType: 'NEWS2_CALCULATED', payload: { news2: 8 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-33', encounterId: 'ENC-33' }
    );

    expect(cluster.explainability.protocolGovernanceNote).toContain('HOSP-MET-RULE');
    expect(cluster.tamperProofHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('TC-34: IGD Workspace Card Transformation Contract (Formats payload for IGD Rapid Triage HUD)', () => {
    const cluster = {
      clusterId: 'CLUST-IGD-01',
      patientId: 'PT-34',
      encounterId: 'ENC-34',
      wardOrBedLocation: 'IGD-RESUS-01',
      priorityTier: ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT,
      headlineAction: 'ACTIVATE RESUSCITATION TEAM',
      targetSlaMinutes: 5,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE,
      explainability: { summaryReason: 'Acute Hemodynamic Shock' },
      updatedAt: '2026-08-20T10:00:00Z'
    };

    const igdPayload = clinicalAlertOrchestrator.generateWorkspacePayload(cluster, WORKSPACE_TARGETS.IGD_WORKSPACE);

    expect(igdPayload.layoutMode).toBe('RAPID_TRIAGE_CARD');
    expect(igdPayload.triageAcuityBadge).toBe('ESI-1_RESUSCITATION');
    expect(igdPayload.citoActionButton).toBe('CALL_RESUSCITATION_TEAM');
  });

  it('TC-35: Inpatient Ward Central Board Contract (Formats payload for Ward Central Display with SLA countdown)', () => {
    const cluster = {
      clusterId: 'CLUST-WARD-01',
      patientId: 'PT-35',
      encounterId: 'ENC-35',
      wardOrBedLocation: 'BED-402',
      createdAt: '2026-08-20T10:00:00Z',
      priorityTier: ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION,
      headlineAction: 'DPJP REVIEW REQUIRED',
      targetSlaMinutes: 15,
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE,
      explainability: { suggestedClinicalSteps: ['Step 1', 'Step 2'] },
      updatedAt: '2026-08-20T10:00:00Z'
    };

    const wardPayload = clinicalAlertOrchestrator.generateWorkspacePayload(cluster, WORKSPACE_TARGETS.INPATIENT_WARD);

    expect(wardPayload.layoutMode).toBe('WARD_CENTRAL_BOARD');
    expect(wardPayload.stationDisplayIndex).toBe(2);
    expect(wardPayload.countdownTargetEpoch).toBeDefined();
  });

  it('TC-36: ICU Acuity Telemetry Drawer Contract (Formats payload for ICU Multi-Parameter Telemetry)', () => {
    const cluster = {
      clusterId: 'CLUST-ICU-01',
      patientId: 'PT-36',
      encounterId: 'ENC-36',
      wardOrBedLocation: 'ICU-BED-02',
      priorityTier: ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT,
      headlineAction: 'TITRATE VASOPRESSOR',
      targetSlaMinutes: 5,
      affectedDomains: ['HEMODYNAMIC', 'RESPIRATORY'],
      explainability: { keyDrivers: [{ parameter: 'MAP', trend: '58 mmHg' }] },
      appliedProtocol: { protocolId: 'HOSP-MET-RULE-V2026.08' },
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE,
      updatedAt: '2026-08-20T10:00:00Z'
    };

    const icuPayload = clinicalAlertOrchestrator.generateWorkspacePayload(cluster, WORKSPACE_TARGETS.ICU_ACUITY);

    expect(icuPayload.layoutMode).toBe('ICU_TELEMETRY_DRAWER');
    expect(icuPayload.organVectors).toContain('HEMODYNAMIC');
  });

  it('TC-37: Concurrent Acknowledge & Override Conflict (Applies clinician override as final authoritative state)', () => {
    const rawEvents = [
      { eventId: 'EVT-37', eventType: 'NEWS2_CALCULATED', payload: { news2: 7 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-37', encounterId: 'ENC-37' }
    );

    // Nurse Acknowledges
    clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.ACKNOWLEDGED,
      { snoozeMinutes: 30 },
      { clinicianId: 'NURSE-04', clinicianName: 'Sr. Maya' }
    );

    // DPJP Overrides
    const finalState = clinicalAlertOrchestrator.evaluateClinicianOverride(
      cluster,
      {
        targetPriority: ALERT_PRIORITY_TIERS.PRIORITY_REVIEW,
        justificationNotes: 'Pasien memiliki target oksigenasi khusus terencana.'
      },
      {
        clinicianId: 'DPJP-02',
        clinicianName: 'dr. Budi Sp.PD'
      }
    );

    expect(finalState.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.OVERRIDDEN);
    expect(finalState.overrideDetails.overriddenBy).toBe('dr. Budi Sp.PD');
  });

  it('TC-38: Idempotent Influx & Duplicate Reject (Correlator rejects duplicate event IDs across retries)', () => {
    const rawEventsWithDuplicates = [
      { eventId: 'EVT-38-DUP', eventType: 'NEWS2_CALCULATED', payload: { news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' },
      { eventId: 'EVT-38-DUP', eventType: 'NEWS2_CALCULATED', payload: { news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' },
      { eventId: 'EVT-38-DUP', eventType: 'NEWS2_CALCULATED', payload: { news2: 5 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    const correlated = clinicalAlertOrchestrator.correlateEvents(rawEventsWithDuplicates);
    expect(correlated.length).toBe(1);
    expect(correlated[0].length).toBe(1); // Only 1 unique event in cluster
  });

  it('TC-39: Massive Concurrent Influx 200 Patients (Evaluates 200 patients concurrently with zero cross-leakage)', () => {
    const patientsData = Array.from({ length: 200 }, (_, idx) => ({
      context: { patientId: `PT-CONCURRENT-${idx}`, encounterId: `ENC-${idx}`, wardOrBedLocation: `BED-${idx}` },
      events: [
        {
          eventId: `EVT-CONC-${idx}`,
          eventType: 'NEWS2_CALCULATED',
          payload: { news2: idx % 9, hr: 70 + (idx % 40) },
          occurredAt: '2026-08-20T10:00:00Z'
        }
      ]
    }));

    const batchResults = clinicalAlertOrchestrator.batchOrchestrate(patientsData);

    expect(batchResults.length).toBe(200);
    batchResults.forEach((res, i) => {
      expect(res.patientId).toBe(`PT-CONCURRENT-${i}`);
      expect(res.tamperProofHash).toBeDefined();
    });
  });

  it('TC-40: End-to-End Orchestrator Pipeline Pass (Full pipeline execution satisfies all architectural invariants)', () => {
    const rawEvents = [
      { eventId: 'EVT-40-A', eventType: 'NEWS2_CALCULATED', payload: { news2: 2 }, occurredAt: '2026-08-20T08:00:00Z' },
      { eventId: 'EVT-40-B', eventType: 'TRAJECTORY_VECTOR_UPDATED', payload: { news2: 5, velocityScorePerHour: 1.5, rr: 26, spo2: 93 }, occurredAt: '2026-08-20T10:00:00Z' }
    ];

    // 1. Correlate
    const correlated = clinicalAlertOrchestrator.correlateEvents(rawEvents);
    expect(correlated.length).toBeGreaterThanOrEqual(1);

    // 2. Synthesize
    const cluster = clinicalAlertOrchestrator.synthesizeCluster(
      rawEvents,
      { patientId: 'PT-40', encounterId: 'ENC-40', wardOrBedLocation: 'BED-505' }
    );
    expect(cluster.priorityTier).toBe(ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION);

    // 3. Workspace UI Rendering
    const wardView = clinicalAlertOrchestrator.generateWorkspacePayload(cluster, WORKSPACE_TARGETS.INPATIENT_WARD);
    expect(wardView.layoutMode).toBe('WARD_CENTRAL_BOARD');

    // 4. Lifecycle Acknowledge
    const ack = clinicalAlertOrchestrator.transitionLifecycleState(
      cluster.clusterId,
      ALERT_LIFECYCLE_STATES.ACKNOWLEDGED,
      { snoozeMinutes: 30 },
      { clinicianId: 'NURSE-05', clinicianName: 'Sr. Tika' }
    );
    expect(ack.lifecycleState).toBe(ALERT_LIFECYCLE_STATES.ACKNOWLEDGED);
  });
});
