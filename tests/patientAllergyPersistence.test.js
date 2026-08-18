/**
 * NurseFlow Enterprise HIS 2026 — Patient Allergy Persistence & SCD Type-2 Test Suite (Sprint 1)
 * Standards: JCI IPSG 3, FHIR AllergyIntolerance
 */

import { describe, it, expect } from 'vitest';
import { patientAllergyService } from '../server/services/patientAllergy.service.js';

describe('Sprint 1: Patient Allergy Persistence & SCD Type-2 Auditability', () => {

  // 1. Fetch Patient Allergies
  it('1. should fetch active allergies for target patient', async () => {
    const list = await patientAllergyService.getPatientAllergies('P-101');

    expect(list.length).toBeGreaterThanOrEqual(1);
    const penicillin = list.find(a => a.allergenCode === 'PENICILLIN_DERIVATIVE');
    expect(penicillin).toBeDefined();
    expect(penicillin.severity).toBe('SEVERE_ANAPHYLAXIS');
    expect(penicillin.recordStatus).toBe('ACTIVE');
  });

  // 2. Record New Patient Allergy
  it('2. should record new allergy with full clinical reaction attributes', async () => {
    const created = await patientAllergyService.recordAllergy({
      organizationId: 'ORG-01',
      patientId: 'P-999',
      allergenType: 'FOOD',
      allergenCode: 'PEANUT',
      allergenName: 'Kacang Tanah (Peanuts)',
      reactionDescription: 'Urtikaria akut dan pembengkakan bibir',
      severity: 'MODERATE',
      verificationStatus: 'CONFIRMED',
      recordedByPractitionerId: 'PRAC-DOC-01'
    });

    expect(created.id).toBeDefined();
    expect(created.recordStatus).toBe('ACTIVE');
    expect(created.version).toBe(1);
  });

  // 3. Amend Allergy with SCD Type-2 Lineage
  it('3. should amend existing allergy, mark old version as AMENDED, and link parent lineage', async () => {
    // Record baseline allergy
    const original = await patientAllergyService.recordAllergy({
      organizationId: 'ORG-01',
      patientId: 'P-998',
      allergenType: 'MEDICATION',
      allergenCode: 'SULFA',
      allergenName: 'Sulfametoksazol',
      reactionDescription: 'Ruam ringan',
      severity: 'MILD',
      verificationStatus: 'SUSPECTED',
      recordedByPractitionerId: 'PRAC-DOC-01'
    });

    // Amend to SEVERE
    const amended = await patientAllergyService.amendAllergy(
      original.id,
      { severity: 'SEVERE_ANAPHYLAXIS', reactionDescription: 'Eskalasi ke Stevens-Johnson Syndrome (SJS)' },
      'PRAC-DOC-02',
      'Koreksi keparahan setelah konsultasi dokter spesialis kulit'
    );

    expect(amended.id).not.toBe(original.id);
    expect(amended.parentAllergyId).toBe(original.id);
    expect(amended.version).toBe(2);
    expect(amended.severity).toBe('SEVERE_ANAPHYLAXIS');
    expect(original.recordStatus).toBe('AMENDED');
  });

  // 4. Void Allergy with Mandatory Clinical Justification
  it('4. should void allergy with mandatory clinical justification reason', async () => {
    const allergy = await patientAllergyService.recordAllergy({
      organizationId: 'ORG-01',
      patientId: 'P-997',
      allergenType: 'LATEX',
      allergenCode: 'LATEX',
      allergenName: 'Latex Sarung Tangan',
      reactionDescription: 'Gatal lokal',
      severity: 'MILD',
      verificationStatus: 'SUSPECTED',
      recordedByPractitionerId: 'PRAC-NURSE-01'
    });

    const voided = await patientAllergyService.voidAllergy(
      allergy.id,
      'PRAC-DOC-01',
      'Hasil skin prick test negatif, salah identifikasi dermatitis kontak iritan'
    );

    expect(voided.recordStatus).toBe('VOIDED');
    expect(voided.statusReason).toContain('skin prick test negatif');
  });

});
