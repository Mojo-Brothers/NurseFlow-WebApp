/**
 * NurseFlow Enterprise HIS 2026 — SPRINT 4B.4: CLINICAL DETERIORATION & POST-MEDICATION SURVEILLANCE TEST SUITE
 * Standards:
 * 1. Royal College of Physicians (RCP) NEWS2 Clinical Scoring
 * 2. Active Pharmacovigilance & Adverse Drug Event (ADE) Auto-Detection
 * 3. Anaphylaxis Emergency Intervention Protocol (Epinephrine 0.5mg IM Stat)
 * 4. Opioid-Induced Respiratory Depression (OIRD Naloxone Protocol)
 * 5. Hypoglycemia Rescue (Dextrose 40% Protocol)
 * 6. Refractory Septic Shock Escalation (Vasopressin / Steroids)
 * 7. Automated Care State Escalation to ICU on NEWS2 >= 7
 */

import { describe, it, expect, beforeEach } from 'vitest';
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

describe('🚨 SPRINT 4B.4: CLINICAL DETERIORATION & POST-MEDICATION SURVEILLANCE ENGINE', () => {
  beforeEach(() => {
    mockStorage.clear();
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    useEncounterStore.getState().clearLiveContext();
  });

  // ==========================================================================
  // TEST 1: POST-MEDICATION SURVEILLANCE CHECKPOINTS GENERATION
  // ==========================================================================
  it('1. Post-Medication Surveillance: Schedule +15m, +30m, +1h, +4h Active Checkpoints', async () => {
    const surveillance = await clinicalDeteriorationEngine.schedulePostMedicationSurveillance({
      orderId: 'ORD-SURV-001',
      encounterId: 'ENC-SURV-001',
      patientId: 'PAT-SURV-001',
      patientName: 'Tn. Monitoring Pasca Obat',
      mrn: 'MRN-SURV-001',
      medicationName: 'Norepinephrine 4mg Drip',
      isHighAlert: true,
      administeredAt: '2026-08-20T08:00:00.000Z'
    });

    expect(surveillance.checkpoints.length).toBe(4);
    expect(surveillance.checkpoints[0].id).toBe('CHK-15M');
    expect(surveillance.checkpoints[1].id).toBe('CHK-30M');
    expect(surveillance.checkpoints[2].id).toBe('CHK-1H');
    expect(surveillance.checkpoints[3].id).toBe('CHK-4H');
  });

  // ==========================================================================
  // TEST 2: STANDARDIZED RCP NEWS2 RECALCULATION & RISK SCALING
  // ==========================================================================
  it('2. NEWS2 Engine: Ingest Vitals & Accurately Calculate Scores and Response Levels', () => {
    // Normal Vitals (RR 16, SpO2 98, SBP 120, HR 72, Temp 36.8, Alert) -> Score 0
    const normalResult = clinicalDeteriorationEngine.calculateNEWS2({
      respiratoryRate: 16,
      spo2: 98,
      onOxygen: false,
      systolicBP: 120,
      heartRate: 72,
      temperature: 36.8,
      consciousness: 'ALERT'
    });
    expect(normalResult.totalScore).toBe(0);
    expect(normalResult.level).toBe(DETERIORATION_LEVELS.LOW);

    // Medium Risk (RR 22, SpO2 94 on O2, HR 112) -> Score 6 (Medium Risk -> RRT Alert)
    const mediumResult = clinicalDeteriorationEngine.calculateNEWS2({
      respiratoryRate: 22, // 2
      spo2: 94,            // 1
      onOxygen: true,      // 2
      systolicBP: 120,     // 0
      heartRate: 112,      // 2
      temperature: 37.0,   // 0
      consciousness: 'ALERT'
    });
    expect(mediumResult.totalScore).toBe(7);
    expect(mediumResult.level).toBe(DETERIORATION_LEVELS.HIGH);

    // Critical Vitals (RR 32, SpO2 88 on O2, SBP 80, HR 135, Unresponsive) -> Critical Score >= 7
    const criticalResult = clinicalDeteriorationEngine.calculateNEWS2({
      respiratoryRate: 32, // 3
      spo2: 88,            // 3
      onOxygen: true,      // 2
      systolicBP: 80,      // 3
      heartRate: 135,      // 3
      temperature: 35.0,   // 3
      consciousness: 'UNRESPONSIVE' // 3
    });
    expect(criticalResult.totalScore).toBe(20);
    expect(criticalResult.level).toBe(DETERIORATION_LEVELS.HIGH);
    expect(criticalResult.actionRecommendation).toContain('ICU');
  });

  // ==========================================================================
  // TEST 3: ADVERSE DRUG EVENT 1 - POST-ANTIBIOTIC ACUTE ANAPHYLAXIS SHOCK
  // Ceftriaxone given -> 20 mins later: urticaria, dyspnea (RR 28), SpO2 89%, BP 85/50
  // ==========================================================================
  it('3. ADE Detection (Anaphylaxis): Ceftriaxone Triggering Immediate Epinephrine IM Protocol', async () => {
    const ade = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-ANA-001',
      patientId: 'PAT-ANA-001',
      patientName: 'Ny. Reaksi Alergi Berat',
      medicationName: 'Ceftriaxone 2g IV',
      administeredMinutesAgo: 20,
      vitals: {
        respiratoryRate: 28,
        spo2: 89,
        systolicBP: 85,
        diastolicBP: 50,
        heartRate: 124
      },
      symptoms: ['Urticaria menyeluruh', 'Stridor', 'Sesak napas akut']
    });

    expect(ade.hasAdverseEvent).toBe(true);
    const anaphylaxisEvent = ade.events.find(e => e.type === 'ANAPHYLAXIS_LIFE_THREATENING');
    expect(anaphylaxisEvent).toBeDefined();
    expect(anaphylaxisEvent.immediateProtocol[1]).toContain('Epinefrin 0.5 mg IM');
  });

  // ==========================================================================
  // TEST 4: ADVERSE DRUG EVENT 2 - OPIOID-INDUCED RESPIRATORY DEPRESSION (OIRD)
  // Morphine given -> RR 7 breaths/min -> Naloxone rescue protocol
  // ==========================================================================
  it('4. ADE Detection (OIRD): Morphine Causing Severe Bradypnea (RR 7) & Naloxone Alert', async () => {
    const ade = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-OIRD-001',
      patientId: 'PAT-OIRD-001',
      patientName: 'Tn. Nyeri Post-Op',
      medicationName: 'Morphine 10mg IV',
      administeredMinutesAgo: 35,
      vitals: {
        respiratoryRate: 7, // Bradypnea kritis
        spo2: 91,
        consciousness: 'CONFUSION'
      },
      symptoms: ['Penurunan kesadaran', 'Napas lambat dan dangkal']
    });

    expect(ade.hasAdverseEvent).toBe(true);
    const oirdEvent = ade.events.find(e => e.type === 'OPIOID_RESPIRATORY_DEPRESSION');
    expect(oirdEvent).toBeDefined();
    expect(oirdEvent.immediateProtocol[1]).toContain('Naloxone 0.4 mg IV');
  });

  // ==========================================================================
  // TEST 5: ADVERSE DRUG EVENT 3 - POST-INSULIN SEVERE HYPOGLYCEMIA
  // Insulin given -> Blood Glucose 48 mg/dL -> Dextrose 40% Bolus Alert
  // ==========================================================================
  it('5. ADE Detection (Hypoglycemia): Insulin Leading to GDS 48 mg/dL & Dextrose 40% Alert', async () => {
    const ade = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-HYPO-001',
      patientId: 'PAT-HYPO-001',
      patientName: 'Ny. Diabetes Mellitus',
      medicationName: 'Insulin Novorapid 12 IU',
      administeredMinutesAgo: 45,
      vitals: {
        bloodGlucose: 48, // Hypoglycemia kritis (< 54)
        heartRate: 110,
        systolicBP: 100,
        diastolicBP: 60
      },
      symptoms: ['Keringat dingin', 'Gemetar', 'Gelisah']
    });

    expect(ade.hasAdverseEvent).toBe(true);
    const hypoEvent = ade.events.find(e => e.type === 'HYPOGLYCEMIA_EMERGENCY');
    expect(hypoEvent).toBeDefined();
    expect(hypoEvent.severity).toBe('CRITICAL');
    expect(hypoEvent.immediateProtocol[0]).toContain('Dextrose 40%');
  });

  // ==========================================================================
  // TEST 6: ADVERSE DRUG EVENT 4 - REFRACTORY SHOCK ON NOREPINEPHRINE
  // Norepinephrine 30 mins -> MAP 58 mmHg -> Vasopressin & Steroids Escalation
  // ==========================================================================
  it('6. ADE Detection (Refractory Shock): Low MAP on Norepinephrine Escalates to Vasopressin', async () => {
    const ade = await clinicalDeteriorationEngine.evaluateAdverseDrugEvent({
      encounterId: 'ENC-SHK-001',
      patientId: 'PAT-SHK-001',
      patientName: 'Bpk. Syok Sepsis',
      medicationName: 'Norepinephrine Drip',
      administeredMinutesAgo: 35,
      vitals: {
        systolicBP: 78,
        diastolicBP: 48, // MAP = (96 + 78)/3 = 58 mmHg (< 65)
        heartRate: 120
      }
    });

    expect(ade.hasAdverseEvent).toBe(true);
    const shockEvent = ade.events.find(e => e.type === 'REFRACTORY_SEPTIC_SHOCK');
    expect(shockEvent).toBeDefined();
    expect(shockEvent.clinicalFindings).toContain('MAP 58');
    expect(shockEvent.immediateProtocol[0]).toContain('Vasopressin Drip');
  });

  // ==========================================================================
  // TEST 7: AUTOMATED CARE STATE ESCALATION TO ICU ON NEWS2 >= 7
  // Ingesting severe deterioration vitals in Ward automatically triggers ICU Transition
  // ==========================================================================
  it('7. Escalation Engine: Ingesting Critical Vitals (NEWS2 >= 7) Automatically Escalates Encounter to ICU_ACTIVE', async () => {
    const encounterId = 'ENC-AUTO-ICU-001';
    const patientId = 'PAT-AUTO-ICU-001';
    const mrn = 'MRN-AUTO-001';

    // Patient currently admitted in Inpatient Ward
    await persistenceAdapter.save('encounters', encounterId, {
      id: encounterId,
      patientId,
      mrn,
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      version: 1
    });

    // Perawat input tanda vital yang memburuk (NEWS2 = 12)
    const deteriorationResult = await clinicalDeteriorationEngine.ingestVitalsAndAssessDeterioration({
      encounterId,
      patientId,
      patientName: 'Tn. Perburukan Bangsal',
      mrn,
      vitals: {
        respiratoryRate: 30, // 3
        spo2: 89,            // 3
        onOxygen: true,      // 2
        systolicBP: 85,      // 3
        heartRate: 132,      // 3
        consciousness: 'ALERT' // 0 -> Total = 14
      },
      actor: { id: 'NURSE-01', name: 'Ns. Sarah', role: 'NURSE' }
    });

    expect(deteriorationResult.news2.totalScore).toBeGreaterThanOrEqual(7);
    expect(deteriorationResult.escalationTriggered).toBe(true);

    const updatedEnc = await persistenceAdapter.findById('encounters', encounterId);
    expect(updatedEnc.primaryState).toBe(CARE_STATES.ICU_ACTIVE);
  });
});
