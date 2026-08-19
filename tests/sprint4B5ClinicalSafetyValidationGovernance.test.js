/**
 * NurseFlow Enterprise HIS 2026 — SPRINT 4B.5: CLINICAL SAFETY VALIDATION & ESCALATION GOVERNANCE TEST SUITE
 * Standards:
 * 1. JCI IPSG, RCP NEWS2 Official Conformance & IHI Early Warning Escalation
 * 2. Non-Negotiable Invariant: "Every clinical alert must be explainable, traceable, attributable, and reversible"
 * 3. Human-in-the-Loop Authorization Boundary (Detection -> Recommendation -> Authorization -> Execution)
 * 4. Boundary Value Testing & False Positive / False Negative Controls
 * 5. Alert Deduplication & Alert Fatigue Control
 * 6. Downgrade / Recovery Pathway & WORM Audit Trail
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clinicalSafetyGovernanceEngine, RULE_REGISTRY, ALERT_LIFECYCLE_STATES } from '../src/modules/clinical_core/services/clinicalSafetyGovernanceEngine.service.js';
import { clinicalDeteriorationEngine, DETERIORATION_LEVELS } from '../src/modules/clinical_core/services/clinicalDeteriorationEngine.service.js';
import { careStateEngine, CARE_STATES } from '../src/core/services/careStateEngine.service.js';
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

describe('⚖️ SPRINT 4B.5: CLINICAL SAFETY VALIDATION & ESCALATION GOVERNANCE', () => {
  beforeEach(() => {
    mockStorage.clear();
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    useEncounterStore.getState().clearLiveContext();
  });

  // ==========================================================================
  // AREA 1: EXPLAINABILITY & REVERSIBILITY (NON-NEGOTIABLE PRINCIPLE)
  // "Every clinical alert must be explainable, traceable, attributable, and reversible"
  // ==========================================================================
  it('1. Explainability: Generate Deterministic, Explainable Breakdown for Clinical Alert', async () => {
    const encounterId = 'ENC-EXP-001';
    const patientId = 'PAT-EXP-001';

    const result = await clinicalSafetyGovernanceEngine.createExplainableAlert({
      encounterId,
      patientId,
      patientName: 'Tn. Explainable Clinical Alert',
      mrn: 'MRN-EXP-001',
      ruleKey: 'NEWS2_CRITICAL_ESCALATION',
      contributingFactors: {
        totalScore: 14,
        subScores: { rr: 3, spo2: 3, sbp: 3, hr: 3, temp: 2 },
        map: 61
      },
      clinicalFindings: 'RR 32 x/m, SpO2 86%, SBP 82 mmHg, HR 128 bpm, Temp 39.2°C',
      recommendedActions: [
        'Immediate clinical review by attending physician',
        'Critical care escalation recommended'
      ],
      severity: 'CRITICAL',
      actor: { id: 'SYSTEM', name: 'Clinical Deterioration Engine', role: 'CDSS' }
    });

    expect(result.alert).toBeDefined();
    expect(result.alert.ruleId).toBe(RULE_REGISTRY.NEWS2_CRITICAL_ESCALATION.ruleId);
    expect(result.alert.requiresHumanAuthorization).toBe(true);

    // Generate Explainability Report
    const explainReport = await clinicalSafetyGovernanceEngine.getExplainabilityReport(result.alert.id);
    expect(explainReport.explainabilityText).toContain('RULE-NEWS2-CRIT-V1');
    expect(explainReport.explainabilityText).toContain('Royal College of Physicians');
    expect(explainReport.explainabilityText).toContain('Immediate clinical review');
  });

  // ==========================================================================
  // AREA 2: HUMAN-IN-THE-LOOP AUTHORIZATION & CLINICAL OVERRIDE
  // Detection -> Recommendation -> Authorization -> Execution
  // ==========================================================================
  it('2. Human-in-the-Loop: Nurse Acknowledges -> Physician Authorizes -> Unauthorized User Blocked', async () => {
    const encounterId = 'ENC-HITL-001';
    const { alert } = await clinicalSafetyGovernanceEngine.createExplainableAlert({
      encounterId,
      patientId: 'PAT-HITL-001',
      patientName: 'Ny. Human in the Loop',
      mrn: 'MRN-HITL-001',
      ruleKey: 'ADE_ANAPHYLAXIS_RECOGNITION',
      contributingFactors: { drug: 'Ceftriaxone', sbp: 85, spo2: 89 },
      clinicalFindings: 'Anaphylaxis shock features within 20m of Ceftriaxone',
      recommendedActions: ['Epinefrin 0.5mg IM Stat', 'Code Blue Activation']
    });

    // 1. Nurse Acknowledges Alert
    const ackAlert = await clinicalSafetyGovernanceEngine.acknowledgeAlert({
      alertId: alert.id,
      actorId: 'RN-SARAH',
      actorName: 'Ns. Sarah, S.Kep',
      actorRole: 'NURSE'
    });
    expect(ackAlert.status).toBe(ALERT_LIFECYCLE_STATES.ACKNOWLEDGED);
    expect(ackAlert.acknowledgement.acknowledgedBy.name).toContain('Ns. Sarah');

    // 2. Non-Physician Attempting Authorization -> STRICTLY REJECTED
    await expect(
      clinicalSafetyGovernanceEngine.authorizeIntervention({
        alertId: alert.id,
        authorizedBy: { id: 'PHARM-01', name: 'Apt. Farhan', role: 'PHARMACIST' }
      })
    ).rejects.toThrow(/Only licensed physicians/);

    // 3. Licensed Physician Authorizes Intervention -> ACCEPTED
    const authAlert = await clinicalSafetyGovernanceEngine.authorizeIntervention({
      alertId: alert.id,
      authorizedBy: { id: 'DOC-01', name: 'dr. Surya, Sp.EM', role: 'DOCTOR' },
      notes: 'Setujui injeksi Epinefrin 0.5mg IM dan aktivasi Code Blue IGD'
    });
    expect(authAlert.status).toBe(ALERT_LIFECYCLE_STATES.AUTHORIZED);
    expect(authAlert.authorization.authorizedBy.name).toContain('dr. Surya');
  });

  it('3. Clinical Override: Clinician Overrides Alert with Mandatory Medicolegal Justification', async () => {
    const { alert } = await clinicalSafetyGovernanceEngine.createExplainableAlert({
      encounterId: 'ENC-OVR-001',
      patientId: 'PAT-OVR-001',
      patientName: 'Tn. Override Test',
      mrn: 'MRN-OVR-001',
      ruleKey: 'NEWS2_MEDIUM_RRT',
      contributingFactors: { totalScore: 5 },
      clinicalFindings: 'NEWS2 score 5 due to isolated fever',
      recommendedActions: ['RRT Review']
    });

    // Attempt Override without Justification -> REJECTED
    await expect(
      clinicalSafetyGovernanceEngine.overrideAlert({
        alertId: alert.id,
        clinician: { id: 'DOC-01', name: 'dr. Surya', role: 'DOCTOR' },
        justificationReason: '' // Empty reason!
      })
    ).rejects.toThrow(/Clinical override requires explicit/);

    // Override with Valid Clinical Justification -> ACCEPTED
    const overriddenAlert = await clinicalSafetyGovernanceEngine.overrideAlert({
      alertId: alert.id,
      clinician: { id: 'DOC-01', name: 'dr. Surya', role: 'DOCTOR' },
      justificationReason: 'Demam terisolasi pasca imunisasi, kondisi hemodinamik stabil dan sadar penuh, tidak memerlukan RRT.'
    });

    expect(overriddenAlert.status).toBe(ALERT_LIFECYCLE_STATES.OVERRIDDEN);
    expect(overriddenAlert.overrideReason.justificationReason).toContain('Demam terisolasi');
  });

  // ==========================================================================
  // AREA 3: BOUNDARY VALUE TESTING & FALSE-POSITIVE / FALSE-NEGATIVE MATRIX
  // ==========================================================================
  it('4. Boundary Testing: NEWS2 Score 6 (No ICU Escalation) vs Score 7 (ICU Escalation)', async () => {
    const encounterId = 'ENC-BOUND-001';
    await persistenceAdapter.save('encounters', encounterId, {
      id: encounterId,
      patientId: 'PAT-BOUND-001',
      mrn: 'MRN-BOUND-001',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      version: 1
    });

    // Case A: NEWS2 Score 6 (RR 22 [2], SpO2 95 on O2 [3], HR 95 [1] -> Score 6)
    const resultScore6 = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId: 'PAT-BOUND-001',
      patientName: 'Tn. Boundary Score 6',
      mrn: 'MRN-BOUND-001',
      vitals: {
        respiratoryRate: 22,
        spo2: 95,
        onOxygen: true,
        systolicBP: 120,
        heartRate: 95,
        temperature: 37.0,
        consciousness: 'ALERT'
      }
    });

    expect(resultScore6.news2.totalScore).toBe(6);
    expect(resultScore6.escalationTriggered).toBe(false); // NO ICU Escalation!
    let encState = await persistenceAdapter.findById('encounters', encounterId);
    expect(encState.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE); // Stays in Ward!

    // Case B: NEWS2 Score 7 (RR 22 [2], SpO2 93 on O2 [4], HR 95 [1] -> Score 7)
    const resultScore7 = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId: 'PAT-BOUND-001',
      patientName: 'Tn. Boundary Score 7',
      mrn: 'MRN-BOUND-001',
      vitals: {
        respiratoryRate: 22,
        spo2: 93,
        onOxygen: true,
        systolicBP: 120,
        heartRate: 95,
        temperature: 37.0,
        consciousness: 'ALERT'
      }
    });

    expect(resultScore7.news2.totalScore).toBe(7);
    expect(resultScore7.escalationTriggered).toBe(true); // ICU Escalation triggered!
    encState = await persistenceAdapter.findById('encounters', encounterId);
    expect(encState.primaryState).toBe(CARE_STATES.ICU_ACTIVE); // Successfully escalated to ICU!
  });

  it('5. SpO2 Scale 1 vs Scale 2 Conformance (Standard vs Hypercapnic COPD)', () => {
    // Normal Patient (Scale 1): SpO2 90% -> 3 points (Severe Hypoxemia)
    const scale1Result = clinicalDeteriorationEngine.calculateNEWS2({
      spo2: 90,
      isHypercapnicRespFailure: false
    });
    expect(scale1Result.subScores.spo2).toBe(3);

    // COPD Hypercapnic Patient (Scale 2): Target 88-92%, SpO2 90% -> 0 points (Normal for COPD)
    const scale2Result = clinicalDeteriorationEngine.calculateNEWS2({
      spo2: 90,
      isHypercapnicRespFailure: true
    });
    expect(scale2Result.subScores.spo2).toBe(0);
  });

  it('6. ADE Boundary Testing: Opioid (RR 9 vs RR 10) & Hypoglycemia (GDS 54 vs GDS 55)', async () => {
    // Opioid at RR 10 (Normal lower boundary) -> No OIRD Alert
    const safeOpioid = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-ADE-B1',
      patientId: 'PAT-ADE-B1',
      medicationName: 'Morphine 5mg IV',
      administeredMinutesAgo: 30,
      vitals: { respiratoryRate: 10, consciousness: 'ALERT' }
    });
    expect(safeOpioid.hasAdverseEvent).toBe(false);

    // Opioid at RR 9 (Bradypnea threshold) -> Triggers OIRD Alert
    const criticalOpioid = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-ADE-B2',
      patientId: 'PAT-ADE-B2',
      medicationName: 'Morphine 5mg IV',
      administeredMinutesAgo: 30,
      vitals: { respiratoryRate: 9, consciousness: 'ALERT' }
    });
    expect(criticalOpioid.hasAdverseEvent).toBe(true);
    expect(criticalOpioid.events[0].type).toBe('OPIOID_RESPIRATORY_DEPRESSION');

    // Insulin at GDS 55 -> Warning Alert
    const warnHypo = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-ADE-B3',
      patientId: 'PAT-ADE-B3',
      medicationName: 'Insulin Novorapid',
      administeredMinutesAgo: 40,
      vitals: { bloodGlucose: 55 }
    });
    expect(warnHypo.events[0].severity).toBe('WARNING');

    // Insulin at GDS 54 (Critical cutoff) -> Critical Alert
    const critHypo = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-ADE-B4',
      patientId: 'PAT-ADE-B4',
      medicationName: 'Insulin Novorapid',
      administeredMinutesAgo: 40,
      vitals: { bloodGlucose: 54 }
    });
    expect(critHypo.events[0].severity).toBe('CRITICAL');
  });

  // ==========================================================================
  // AREA 4: ALERT DEDUPLICATION & RECOVERY / DOWNGRADE PATHWAY
  // ==========================================================================
  it('7. Alert Deduplication & Recovery Pathway: Suppress Alert Storm & Safely Downgrade', async () => {
    const encounterId = 'ENC-DEDUP-001';
    await persistenceAdapter.save('encounters', encounterId, {
      id: encounterId,
      patientId: 'PAT-DEDUP-001',
      mrn: 'MRN-DEDUP-001',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      version: 1
    });

    // 1. First Ingestion: Triggers Critical Alert (NEWS2 = 8)
    const ingest1 = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId: 'PAT-DEDUP-001',
      patientName: 'Tn. Dedup Test',
      mrn: 'MRN-DEDUP-001',
      vitals: { respiratoryRate: 26, spo2: 90, onOxygen: true, systolicBP: 110, heartRate: 110, temperature: 37 }
    });
    expect(ingest1.isDeduplicated).toBe(false);
    expect(ingest1.governanceAlert.status).toBe(ALERT_LIFECYCLE_STATES.GENERATED);

    // 2. Second Ingestion 2 minutes later with identical critical vitals -> Deduplicated (No Alert Storm)
    const ingest2 = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId: 'PAT-DEDUP-001',
      patientName: 'Tn. Dedup Test',
      mrn: 'MRN-DEDUP-001',
      vitals: { respiratoryRate: 26, spo2: 90, onOxygen: true, systolicBP: 110, heartRate: 110, temperature: 37 }
    });
    expect(ingest2.isDeduplicated).toBe(true);

    // 3. Patient Recovers 1 hour later (NEWS2 Drops from 8 -> 2) -> Downgrade Pathway Triggered
    const ingestRecover = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId: 'PAT-DEDUP-001',
      patientName: 'Tn. Dedup Test',
      mrn: 'MRN-DEDUP-001',
      vitals: { respiratoryRate: 16, spo2: 98, onOxygen: false, systolicBP: 120, heartRate: 75, temperature: 36.8, consciousness: 'ALERT' }
    });
    expect(ingestRecover.news2.totalScore).toBe(0);
    expect(ingestRecover.downgradeResult.downgraded).toBe(true);
    expect(ingestRecover.downgradeResult.downgradedAlertsCount).toBeGreaterThanOrEqual(1);

    const alertInDb = await persistenceAdapter.findById('clinical_governance_alerts', ingest1.governanceAlert.id);
    expect(alertInDb.status).toBe(ALERT_LIFECYCLE_STATES.DOWNGRADED);
    expect(alertInDb.downgradeInfo.recoveredScore).toBe(0);
  });
});
