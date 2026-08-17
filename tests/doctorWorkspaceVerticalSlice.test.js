/**
 * NurseFlow Enterprise HIS 2026 — Doctor Consultation & Clinical Core Vertical Slice Test Suite (Gate 1E.4)
 * Standards: Permenkes No. 24/2022 (RME), JCI 7th Edition (MMU Medication Safety, IPSG 3), SATUSEHAT FHIR
 */

import { describe, it, expect } from 'vitest';
import { soapEngineService } from '../src/modules/emr/services/soapEngine.service.js';
import { cdssEngineService } from '../src/modules/emr/services/cdssEngine.service.js';
import { allergyEngineService } from '../src/modules/emr/services/allergyEngine.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';

describe('Gate 1E.4: Doctor Consultation & Clinical Core Vertical Slice', () => {
  // 1. Structured SOAP Note & Diagnosis
  it('1. should record structured CPPT/SOAP note and register primary ICD-10 diagnosis', async () => {
    const soap = await soapEngineService.recordSoapNote({
      episodeId: 'EOC-TEST-DOC-01',
      encounterId: 'ENC-TEST-DOC-01',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      subjective: 'Demam 4 hari, badan lemas, bintik merah pada lengan',
      objective: 'TD 110/70, HR 84, Suhu 38.2C, Ptekie (+)',
      assessment: 'Dengue Hemorrhagic Fever (DHF) Grade II',
      plan: 'Infus RL 2000ml/24j, Cek DL serial per 12j, Paracetamol 500mg tab 3x1',
      primaryIcd10: 'A90',
      primaryIcd10Name: 'Dengue fever [classical dengue]',
      physicianId: 'DOC-1001',
      physicianName: 'dr. Surya Johnson, Sp.PD'
    });

    expect(soap.id).toBeDefined();
    expect(soap.primary_icd10).toBe('A90');
    expect(soap.is_signed).toBe(true);
    expect(soap.signature_timestamp).toBeDefined();
  });

  // 2. Clinical Safety Barrier: Drug Allergy Conflict Detection (Negative Path)
  it('2. should detect drug allergy conflict and block contra-indicated penicillin prescriptions', () => {
    // Patient P-1001 has documented Penicillin allergy
    const check1 = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Amoxicillin 500mg');
    expect(check1.hasConflict).toBe(true);
    expect(check1.allergen).toContain('Penicillin');
    expect(check1.severity).toBe('SEVERE');

    const check2 = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Ampicillin 1g IV');
    expect(check2.hasConflict).toBe(true);

    // Safe medication
    const checkSafe = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Paracetamol 500mg');
    expect(checkSafe.hasConflict).toBe(false);
  });

  // 3. CDSS Protocol Safeguards Evaluation
  it('3. should evaluate CDSS safeguards and generate critical warnings for high-risk clinical conditions', async () => {
    const cdssResult = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId: 'ENC-TEST-DOC-02',
      patientId: 'P-1001',
      prescribedDrugName: 'Amoxicillin',
      patientEgfr: 25
    });

    expect(cdssResult.hasCriticalBlock).toBe(true);
    expect(cdssResult.alerts.length).toBeGreaterThan(0);
    expect(cdssResult.alerts[0].alert_type).toBe('DRUG_ALLERGY_CONFLICT');
  });

  // 4. Universal Order Engine Dispatch & State Transitions
  it('4. should create and advance universal clinical orders across multiple categories', async () => {
    // 1. Create Laboratory Order
    const labOrder = await universalOrderEngineService.createOrder({
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      episodeId: 'EOC-TEST-DOC-01',
      encounterId: 'ENC-TEST-DOC-01',
      orderedBy: 'dr. Surya Johnson, Sp.PD',
      orderCategory: 'LABORATORY',
      priority: 'CITO',
      clinicalIndication: 'Evaluasi trombositopenia akut & laktat serial',
      isCito: true,
      items: [
        { code: 'LAB-DL', name: 'Darah Lengkap 5-Diff', quantity: 1, unitPrice: 110000, totalPrice: 110000 },
        { code: 'LAB-LAKTAT', name: 'Laktat Darah Kuantitatif', quantity: 1, unitPrice: 175000, totalPrice: 175000 }
      ]
    });

    expect(labOrder.id).toBeDefined();
    expect(labOrder.status).toBe('ORDERED');
    expect(labOrder.total_estimated_amount).toBe(285000);

    // 2. Transition Order to VERIFIED
    const verified = await universalOrderEngineService.transitionOrderStatus({
      orderId: labOrder.id,
      nextStatus: 'VERIFIED',
      actor: 'Analis Laboratorium',
      notes: 'Spesimen darah EDTA & plasma diterima di laboratorium'
    });

    expect(verified.status).toBe('VERIFIED');
    expect(verified.history.length).toBe(3); // DRAFT -> ORDERED -> VERIFIED
  });

  // 5. Invalid FSM Transition Protection (Negative Path)
  it('5. should reject illegal state transitions on clinical orders', async () => {
    const order = await universalOrderEngineService.createOrder({
      patientId: 'P-1002',
      patientName: 'Tn. Bambang Pamungkas',
      mrn: 'MRN-2026-001002',
      episodeId: 'EOC-TEST-DOC-02',
      encounterId: 'ENC-TEST-DOC-02',
      orderedBy: 'dr. Surya Johnson, Sp.PD',
      orderCategory: 'RADIOLOGY',
      priority: 'ROUTINE',
      clinicalIndication: 'Evaluasi apendisitis akut',
      items: [{ code: 'RAD-USG', name: 'USG Abdomen', quantity: 1, unitPrice: 350000, totalPrice: 350000 }]
    });

    // Attempting jump directly from ORDERED to COMPLETED without IN_PROGRESS must fail
    await expect(
      universalOrderEngineService.transitionOrderStatus({
        orderId: order.id,
        nextStatus: 'COMPLETED',
        actor: 'Radiografer'
      })
    ).rejects.toThrow(/Transisi status order ilegal/i);
  });
});
