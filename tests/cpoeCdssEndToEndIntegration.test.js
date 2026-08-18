/**
 * NurseFlow Enterprise HIS 2026 — CPOE to CDSS End-to-End Inter-Module Integration Suite
 * Pipeline: CPOE Prescribing -> Terminology Service -> Allergy SCD2 Engine -> Symmetrical DDI -> Renal/Pediatric -> Formulary -> Final Safe Decision
 * Standards: JCI 7th Edition IPSG 3 & MMU.1
 */

import { describe, it, expect } from 'vitest';
import { terminologyService } from '../server/services/terminologyService.service.js';
import { patientAllergyService } from '../server/services/patientAllergy.service.js';
import { hospitalFormularyService } from '../server/services/hospitalFormulary.service.js';
import { dynamicCdssEngineService } from '../server/services/dynamicCdssEngine.service.js';

describe('Sprint 2: CPOE to CDSS End-to-End Inter-Module Pipeline', () => {

  // Test Case 1: Full Pipeline on Penicillin-Allergic Patient receiving Meropenem
  it('1. should execute full pipeline: Terminology -> Allergy Cross-Match -> Formulary -> Safety Shield', async () => {
    // 1. Doctor searches medication in CPOE via Terminology Service
    const searchTerms = await terminologyService.searchTerminology({ query: 'SNOMED:372729009' }); // Meropenem
    expect(searchTerms.length).toBeGreaterThanOrEqual(1);
    const targetDrugId = searchTerms[0].medicationId; // MED-001

    // 2. Patient Allergy Check (Patient P-1001 has confirmed CARBAPENEM allergy)
    const allergies = await patientAllergyService.getPatientAllergies('P-1001');
    expect(allergies.length).toBeGreaterThanOrEqual(1);

    // 3. Hospital Formulary Stewardship Check (Meropenem is Restricted Antibiotic requiring KFT)
    const formularyCheck = await hospitalFormularyService.checkPrescriptionStewardship(targetDrugId, 'PHYSICIAN_SPECIALIST', 'DEPT-WARD-01');
    expect(formularyCheck.requiresSpecialApproval).toBe(true);

    // 4. Integrated CDSS Evaluation
    const cdssResult = await dynamicCdssEngineService.evaluatePrescription({
      organizationId: 'ORG-01',
      encounterId: 'ENC-E2E-001',
      patientId: 'P-1001',
      proposedDrugId: targetDrugId,
      doseAmount: 1000,
      doseUnit: 'mg',
      route: 'IV'
    });

    // Final Decision: HARD STOPPED due to fatal anaphylaxis allergy match
    expect(cdssResult.isSafeToExecute).toBe(false);
    expect(cdssResult.evaluationResult).toBe('HARD_STOPPED');
  });

  // Test Case 2: Multi-Factor Pipeline (Symmetrical DDI + Formulary + Renal Adjustment)
  it('2. should evaluate complex multi-factor prescription (DDI Warfarin-Aspirin + Renal eGFR < 30)', async () => {
    // Patient on Warfarin, with eGFR = 25 ml/min
    // Doctor orders Aspirin 80mg
    const cdssResult = await dynamicCdssEngineService.evaluatePrescription({
      organizationId: 'ORG-01',
      encounterId: 'ENC-E2E-002',
      patientId: 'P-CARDIO-02',
      proposedDrugId: 'MED-004', // Aspirin
      doseAmount: 80,
      doseUnit: 'mg',
      route: 'ORAL',
      patientContext: {
        activeMedicationIds: ['MED-003'], // Warfarin active
        latestEgfr: 25.0
      }
    });

    // Verification
    expect(cdssResult.isSafeToExecute).toBe(true); // Warning level
    expect(cdssResult.requiresClinicalJustification).toBe(true);
    expect(cdssResult.alerts.some(a => a.type === 'DRUG_DRUG_INTERACTION')).toBe(true);
  });

});
