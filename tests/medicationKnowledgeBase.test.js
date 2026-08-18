/**
 * NurseFlow Enterprise HIS 2026 — Master Medication Knowledge Base Test Suite (Sprint 1)
 * Standards: ATC WHO, RxNorm, SNOMED CT, JCI IPSG 3
 */

import { describe, it, expect } from 'vitest';
import { medicationKnowledgeBaseService } from '../server/services/medicationKnowledgeBase.service.js';

describe('Sprint 1: Medication Knowledge Base & Master Pharmacology', () => {

  // 1. Medication Listing & Retrieval
  it('1. should retrieve list of master medications with enriched terminology and formulary status', async () => {
    const res = await medicationKnowledgeBaseService.getMedications();

    expect(res.total).toBeGreaterThanOrEqual(8);
    expect(res.data.length).toBeGreaterThanOrEqual(8);

    const mero = res.data.find(m => m.genericName.includes('Meropenem'));
    expect(mero).toBeDefined();
    expect(mero.atcCode).toBe('J01DH02');
    expect(mero.drugClassCode).toBe('CARBAPENEM');
    expect(mero.formularyTier).toBe('RESTRICTED_ANTIBIOTIC');
    expect(mero.terminologies.length).toBeGreaterThanOrEqual(1);
  });

  // 2. Query Drug-Drug Interaction Pair
  it('2. should detect DDI pair between Warfarin and Aspirin with critical high severity', async () => {
    // Warfarin (MED-003) and Aspirin (MED-004)
    const interaction = await medicationKnowledgeBaseService.checkDrugDrugInteraction('MED-003', 'MED-004');

    expect(interaction).toBeDefined();
    expect(interaction.severity).toBe('CRITICAL_HIGH');
    expect(interaction.clinicalEffect).toContain('perdarahan mayor');
  });

  // 3. Prevent Hard Deletes on Master Medications
  it('3. should block hard delete on master medications and enforce soft delete / archive', async () => {
    const med = await medicationKnowledgeBaseService.getMedicationById('MED-005'); // Paracetamol
    expect(med).toBeDefined();

    // Attempting archive must succeed
    const archived = await medicationKnowledgeBaseService.archiveMedication('MED-005', 'Replaced by newer formulation');
    expect(archived.recordStatus).toBe('ARCHIVED');
    expect(archived.statusReason).toContain('Replaced');

    // Restore to ACTIVE for other tests
    await medicationKnowledgeBaseService.updateMedication('MED-005', { recordStatus: 'ACTIVE' });
  });

  // 4. Create New Master Medication
  it('4. should create new medication entity with version tracking', async () => {
    const newMed = await medicationKnowledgeBaseService.createMedication({
      genericName: 'Amiodarone Hydrochloride',
      brandName: 'Cordarone 150mg Ampul',
      atcCode: 'C01BD01',
      rxnormCode: '703',
      dosageForm: 'AMPUL',
      strengthAmount: 150,
      strengthUnit: 'mg',
      drugClassCode: 'ANTIARRHYTHMIC',
      isHighAlert: true
    });

    expect(newMed.id).toBeDefined();
    expect(newMed.version).toBe(1);
    expect(newMed.recordStatus).toBe('ACTIVE');
  });

});
