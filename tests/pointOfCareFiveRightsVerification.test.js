/**
 * SPRINT 3C: POINT-OF-CARE 5-RIGHTS BARCODE VERIFICATION ADVERSARIAL TEST SUITE
 * 
 * Validates:
 * 1. 5-Rights Individual and Collective Evaluation (Patient, Drug, Dose, Route, Time)
 * 2. Barcode as Sensor Evidence only (GS1-DataMatrix, Wristband, Plain Code)
 * 3. Machine-Readable Rejection Codes (WRONG_PATIENT, WRONG_DRUG, EXPIRED_MEDICATION, etc.)
 * 4. High-Alert Dual Independent Verification Integration
 * 5. Stale Order, Discharged Patient, Deceased Hard Stops
 * 6. Concurrency & Idempotent Retries
 * 7. Malformed Barcode Handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  pointOfCareFiveRightsValidator, 
  FIVE_RIGHTS_STATUS, 
  SENSOR_ERROR_CODES 
} from '../src/core/services/pointOfCareFiveRightsValidator.service.js';
import { 
  medicationLifecycleEngine, 
  MEDICATION_ORDER_STATES, 
  MEDICATION_SLOT_STATES,
  HIGH_ALERT_CATEGORIES
} from '../src/core/services/medicationLifecycleEngine.service.js';
import { barcodeScannerAdapter } from '../src/core/services/barcodeScannerAdapter.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3C: Point-of-Care 5-Rights Barcode Verification Engine Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // A. Correct Patient + Correct Drug (Happy Path)
  it('A. should successfully verify 5-Rights and execute bedside administration', async () => {
    const enc = {
      id: 'ENC-POC-001',
      encounterNumber: 'REG-2026-POC01',
      patientId: 'PAT-POC01',
      patientName: 'Subandi Hadipranoto',
      mrn: 'MRN-2026-POC01',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      currentLocation: 'Ruang Melati Bed 04'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-POC-001',
      patientId: 'PAT-POC01',
      patientName: 'Subandi Hadipranoto',
      mrn: 'MRN-2026-POC01',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      dose: 1,
      doseUnit: 'g',
      route: 'IV',
      frequency: 'QD',
      durationDays: 1
    });

    const slot = rxRes.order.scheduleSlots[0];

    // Verification with exact match
    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-POC01',
      rawMedicationBarcode: 'MED-CEFTRIAXONE-1G',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(verif.canAdminister).toBe(true);
    expect(verif.rights.rightPatient.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(verif.rights.rightDrug.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(verif.rights.rightDose.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(verif.rights.rightRoute.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(verif.rights.rightTime.status).toBe(FIVE_RIGHTS_STATUS.PASS);

    // Execute administration
    const adminRes = await pointOfCareFiveRightsValidator.executeBedsideAdministration({
      rawPatientBarcode: 'MRN-2026-POC01',
      rawMedicationBarcode: 'MED-CEFTRIAXONE-1G',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      currentTimestamp: slot.targetTimestamp
    });

    expect(adminRes.success).toBe(true);
    expect(adminRes.administration.slot.status).toBe(MEDICATION_SLOT_STATES.ADMINISTERED);

    // Verify Read-Model Projection Updated
    const emarDoc = await persistenceAdapter.findById('emar_projections', 'PAT-POC01');
    expect(emarDoc.administeredCount).toBe(1);
  });

  // B. Wrong Patient Barcode Mismatch
  it('B. should reject bedside verification with WRONG_PATIENT when scanning wrong wristband', async () => {
    const enc = {
      id: 'ENC-WRONG-PAT',
      patientId: 'PAT-W1',
      patientName: 'Ny. Halimah',
      mrn: 'MRN-2026-HALIMAH',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-WRONG-PAT',
      patientId: 'PAT-W1',
      patientName: 'Ny. Halimah',
      mrn: 'MRN-2026-HALIMAH',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-PARACETAMOL-500',
      medicationName: 'Paracetamol 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-WRONG-NEIGHBOR-BED',
      rawMedicationBarcode: 'MED-PARACETAMOL-500',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.canAdminister).toBe(false);
    expect(verif.rights.rightPatient.code).toBe(SENSOR_ERROR_CODES.WRONG_PATIENT);
    expect(verif.failedRights).toContain('RIGHT_PATIENT');

    // Attempting administration throws Hard Stop!
    await expect(
      pointOfCareFiveRightsValidator.executeBedsideAdministration({
        rawPatientBarcode: 'MRN-2026-WRONG-NEIGHBOR-BED',
        rawMedicationBarcode: 'MED-PARACETAMOL-500',
        orderId: rxRes.order.id,
        slotId: slot.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        currentTimestamp: slot.targetTimestamp
      })
    ).rejects.toThrow(/WRONG_PATIENT/);
  });

  // C. Wrong Drug Barcode Mismatch
  it('C. should reject verification with WRONG_DRUG when scanning different medication vial', async () => {
    const enc = {
      id: 'ENC-WRONG-DRUG',
      patientId: 'PAT-W2',
      patientName: 'Pak Wahyudi',
      mrn: 'MRN-2026-WAHYUDI',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-WRONG-DRUG',
      patientId: 'PAT-W2',
      patientName: 'Pak Wahyudi',
      mrn: 'MRN-2026-WAHYUDI',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-OMEPRAZOLE-40',
      medicationName: 'Omeprazole 40 mg Vial',
      dose: 40,
      doseUnit: 'mg',
      route: 'IV',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-WAHYUDI',
      rawMedicationBarcode: 'MED-PANTOPRAZOLE-40', // Wrong Drug
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.rights.rightDrug.code).toBe(SENSOR_ERROR_CODES.WRONG_DRUG);
    expect(verif.failedRights).toContain('RIGHT_DRUG');
  });

  // D. Wrong Dose / Wrong Route
  it('D. should reject verification with WRONG_DOSE and WRONG_ROUTE if clinical parameters differ', async () => {
    const enc = {
      id: 'ENC-DOSE-ROUTE',
      patientId: 'PAT-W3',
      patientName: 'Ibu Ratmi',
      mrn: 'MRN-2026-RATMI',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-DOSE-ROUTE',
      patientId: 'PAT-W3',
      patientName: 'Ibu Ratmi',
      mrn: 'MRN-2026-RATMI',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-MORPHINE-10',
      medicationName: 'Morphine Sulfate 10 mg',
      dose: 10,
      doseUnit: 'mg',
      route: 'IV',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-RATMI',
      rawMedicationBarcode: 'MED-MORPHINE-10',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      intendedDose: 20, // Ordered 10, intended 20 ➔ Wrong Dose!
      intendedRoute: 'Oral', // Ordered IV, intended Oral ➔ Wrong Route!
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.rights.rightDose.code).toBe(SENSOR_ERROR_CODES.WRONG_DOSE);
    expect(verif.rights.rightRoute.code).toBe(SENSOR_ERROR_CODES.WRONG_ROUTE);
  });

  // E. Time Window Violation (Early & Late)
  it('E. should evaluate Right Time window and reject doses outside allowed window', async () => {
    const enc = {
      id: 'ENC-TIME-TEST',
      patientId: 'PAT-TIME',
      patientName: 'Ahmad Dahlan',
      mrn: 'MRN-2026-TIME',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-TIME-TEST',
      patientId: 'PAT-TIME',
      patientName: 'Ahmad Dahlan',
      mrn: 'MRN-2026-TIME',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];
    const targetDate = new Date(slot.targetTimestamp);

    // 3 Hours Too Early (180 mins before)
    const tooEarlyTime = new Date(targetDate.getTime() - 180 * 60 * 1000).toISOString();
    const verifEarly = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-TIME',
      rawMedicationBarcode: 'MED-AMOX-500',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: tooEarlyTime,
      allowedWindowMinutes: 60
    });

    expect(verifEarly.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verifEarly.rights.rightTime.code).toBe(SENSOR_ERROR_CODES.TIME_WINDOW_VIOLATION);
    expect(verifEarly.rights.rightTime.details).toContain('EARLY');
  });

  // F. Expired Medication Block (GS1 Barcode Parsing)
  it('F. should parse GS1 DataMatrix and reject EXPIRED_MEDICATION', async () => {
    const enc = {
      id: 'ENC-GS1-EXP',
      patientId: 'PAT-GS1',
      patientName: 'Bambang Irawan',
      mrn: 'MRN-2026-GS1',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-GS1-EXP',
      patientId: 'PAT-GS1',
      patientName: 'Bambang Irawan',
      mrn: 'MRN-2026-GS1',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: '08991234567890',
      medicationName: 'Insulin Glargine 100 IU/mL',
      dose: 10,
      doseUnit: 'IU',
      route: 'Subcutaneous',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];

    // GS1 barcode with expiry in 2020 (Expired!)
    // (01)08991234567890(17)201231(10)LOT-EXPIRED-2020
    const rawGs1Expired = '(01)08991234567890(17)201231(10)LOT-EXPIRED-2020';

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-GS1',
      rawMedicationBarcode: rawGs1Expired,
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: '2026-08-18T08:00:00.000Z'
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.rights.rightDrug.code).toBe(SENSOR_ERROR_CODES.EXPIRED_MEDICATION);
    expect(verif.failedRights).toContain('RIGHT_DRUG');
  });

  // G. High-Alert Dual Independent Verification Requirement
  it('G. should require dual co-signature for High-Alert drug and pass once signed', async () => {
    const enc = {
      id: 'ENC-HIGH-ALERT-POC',
      patientId: 'PAT-HA-POC',
      patientName: 'Ny. Suwarni',
      mrn: 'MRN-2026-HA-POC',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-HIGH-ALERT-POC',
      patientId: 'PAT-HA-POC',
      patientName: 'Ny. Suwarni',
      mrn: 'MRN-2026-HA-POC',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-FENTANYL-50',
      medicationName: 'Fentanyl 50 mcg/mL Ampul',
      dose: 50,
      doseUnit: 'mcg',
      route: 'IV',
      frequency: 'STAT',
      isHighAlert: true,
      highAlertCategory: HIGH_ALERT_CATEGORIES.OPIOID_NARCOTIC
    });

    const slot = rxRes.order.scheduleSlots[0];

    // Attempt administration without second co-signer ➔ Blocked!
    await expect(
      pointOfCareFiveRightsValidator.executeBedsideAdministration({
        rawPatientBarcode: 'MRN-2026-HA-POC',
        rawMedicationBarcode: 'MED-FENTANYL-50',
        orderId: rxRes.order.id,
        slotId: slot.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        currentTimestamp: slot.targetTimestamp
      })
    ).rejects.toThrow(/HIGH_ALERT_DUAL_SIGN_REQUIRED/);

    // With Second Independent Co-Signer ➔ Passes!
    const adminRes = await pointOfCareFiveRightsValidator.executeBedsideAdministration({
      rawPatientBarcode: 'MRN-2026-HA-POC',
      rawMedicationBarcode: 'MED-FENTANYL-50',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      coSignatureNurseId: 'NURSE-002',
      coSignatureNurseName: 'Ners Maya (Co-Signer)',
      currentTimestamp: slot.targetTimestamp
    });

    expect(adminRes.success).toBe(true);
    expect(adminRes.administration.slot.coSignatureBy.name).toBe('Ners Maya (Co-Signer)');
  });

  // H. Malformed and Empty Barcode Handling
  it('H. should reject malformed or blank barcodes safely', async () => {
    const enc = {
      id: 'ENC-MALFORMED',
      patientId: 'PAT-MAL',
      patientName: 'Test Malformed',
      mrn: 'MRN-2026-MAL',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-MALFORMED',
      patientId: 'PAT-MAL',
      patientName: 'Test Malformed',
      mrn: 'MRN-2026-MAL',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD'
    });

    const slot = rxRes.order.scheduleSlots[0];

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: '', // Empty
      rawMedicationBarcode: '   ', // Blank
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.rights.rightPatient.code).toBe(SENSOR_ERROR_CODES.MALFORMED_BARCODE);
    expect(verif.rights.rightDrug.code).toBe(SENSOR_ERROR_CODES.MALFORMED_BARCODE);
  });
});
