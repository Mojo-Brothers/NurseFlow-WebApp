/**
 * NurseFlow Enterprise HIS 2026 — Dynamic CDSS Rules Engine Test Suite (Sprint 2)
 * Standards: JCI IPSG 3, Symmetrical DDI, Allergy Cross-Matching, Pediatric & Renal Rules
 */

import { describe, it, expect } from 'vitest';
import { dynamicCdssEngineService } from '../server/services/dynamicCdssEngine.service.js';

describe('Sprint 2: Dynamic CDSS Rules Engine (Gate 3 Core)', () => {

  // 1. Symmetrical DDI Matcher: Warfarin + Aspirin vs Aspirin + Warfarin
  it('1. should symmetrically detect DDI between Warfarin and Aspirin regardless of input sequence', async () => {
    // Scenario A: Proposing Aspirin (MED-004) when patient is taking Warfarin (MED-003)
    const evalA = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-TEST-01',
      proposedDrugId: 'MED-004', // Aspirin
      doseAmount: 80,
      doseUnit: 'mg',
      patientContext: { activeMedicationIds: ['MED-003'] } // Warfarin active
    });

    expect(evalA.isSafeToExecute).toBe(true); // Warning, not hard stop
    expect(evalA.requiresClinicalJustification).toBe(true);
    expect(evalA.alerts.some(a => a.type === 'DRUG_DRUG_INTERACTION')).toBe(true);

    // Scenario B: Symmetrical inverse - Proposing Warfarin (MED-003) when patient is taking Aspirin (MED-004)
    const evalB = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-TEST-01',
      proposedDrugId: 'MED-003', // Warfarin
      doseAmount: 2,
      doseUnit: 'mg',
      patientContext: { activeMedicationIds: ['MED-004'] } // Aspirin active
    });

    expect(evalB.requiresClinicalJustification).toBe(true);
    expect(evalB.alerts.some(a => a.type === 'DRUG_DRUG_INTERACTION')).toBe(true);
  });

  // 2. Fatal Hard Stop on Severe Anaphylaxis Allergy Match
  it('2. should enforce FATAL_HARD_STOP when prescribing Meropenem to patient with confirmed Penicillin/Carbapenem anaphylaxis', async () => {
    // Patient P-101 has confirmed SEVERE_ANAPHYLAXIS to PENICILLIN_DERIVATIVE
    // Patient P-1001 has confirmed SEVERE_ANAPHYLAXIS to CARBAPENEM
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-1001',
      proposedDrugId: 'MED-001', // Meropenem (CARBAPENEM)
      doseAmount: 1000,
      doseUnit: 'mg'
    });

    expect(evalResult.isSafeToExecute).toBe(false);
    expect(evalResult.evaluationResult).toBe('HARD_STOPPED');
    const allergyAlert = evalResult.alerts.find(a => a.type === 'DRUG_ALLERGY');
    expect(allergyAlert).toBeDefined();
    expect(allergyAlert.isHardStop).toBe(true);
  });

  // 3. Duplicate Therapy Fatal Hard Stop: Paracetamol Oral + Paracetamol IV
  it('3. should enforce FATAL_HARD_STOP on duplicate simultaneous Paracetamol therapy', async () => {
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-TEST-02',
      proposedDrugId: 'MED-006', // Paracetamol Infus IV
      doseAmount: 1000,
      doseUnit: 'mg',
      patientContext: { activeMedicationIds: ['MED-005'] } // Paracetamol Tablet Oral active
    });

    expect(evalResult.isSafeToExecute).toBe(false);
    expect(evalResult.evaluationResult).toBe('HARD_STOPPED');
    expect(evalResult.alerts.some(a => a.type === 'DUPLICATE_THERAPY')).toBe(true);
  });

  // 4. Pediatric Overdose Fatal Hard Stop: Paracetamol > 15 mg/kg for Child
  it('4. should enforce FATAL_HARD_STOP when pediatric single dose exceeds 15 mg/kg', async () => {
    // Child: 5 years old, Weight: 12 kg. Max safe single dose = 12 * 15 = 180 mg.
    // Prescribing 500 mg (Overdose!)
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-CHILD-01',
      proposedDrugId: 'MED-005', // Paracetamol
      doseAmount: 500, // 500mg > 180mg max
      doseUnit: 'mg',
      patientContext: { ageYears: 5, weightKg: 12 }
    });

    expect(evalResult.isSafeToExecute).toBe(false);
    expect(evalResult.evaluationResult).toBe('HARD_STOPPED');
    const pedAlert = evalResult.alerts.find(a => a.type === 'PEDIATRIC_DOSE');
    expect(pedAlert).toBeDefined();
    expect(pedAlert.message).toContain('melebihi batas aman');
  });

  // 5. Renal Dose Critical Warning on eGFR < 30 ml/min for Meropenem
  it('5. should trigger CRITICAL_WARNING requiring dose reduction when Meropenem is ordered for eGFR < 30', async () => {
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-CKD-01',
      proposedDrugId: 'MED-001', // Meropenem (threshold: 30 ml/min)
      doseAmount: 1000,
      doseUnit: 'mg',
      patientContext: { latestEgfr: 22.5 } // eGFR = 22.5 ml/min
    });

    expect(evalResult.isSafeToExecute).toBe(true); // Warning, can be overridden with reduced dose
    expect(evalResult.requiresClinicalJustification).toBe(true);
    const renalAlert = evalResult.alerts.find(a => a.type === 'RENAL_ADJUSTMENT');
    expect(renalAlert).toBeDefined();
    expect(renalAlert.message).toContain('eGFR: 22.5 ml/min');
  });

});
