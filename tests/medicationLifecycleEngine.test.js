/**
 * Sprint 3A & 3B: Medication Lifecycle Platform Adversarial Test Suite
 * Validates: 7-Rights Invariants, Schedule Slot Engine, High-Alert Dual Check,
 * Double Administration Prevention, OCC, Machine-Readable Error Codes & Idempotency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  medicationLifecycleEngine, 
  MEDICATION_ORDER_STATES, 
  MEDICATION_SLOT_STATES,
  HIGH_ALERT_CATEGORIES,
  MED_ERROR_CODES
} from '../src/core/services/medicationLifecycleEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3A & 3B: Medication Lifecycle Platform & Machine-Readable Safety Invariants Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // 1. Happy Path Full Journey
  it('1. should prescribe medication, generate discrete slots (TID), verify, dispense, and administer', async () => {
    const enc = {
      id: 'ENC-MED-001',
      encounterNumber: 'REG-2026-MED01',
      patientId: 'PAT-MED01',
      patientName: 'Subagyo Wiryono',
      mrn: 'MRN-2026-001928',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Step 1: Doctor Prescribes Amoxicillin 500mg TID (3x sehari) for 2 days
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-MED-001',
      patientId: 'PAT-MED01',
      patientName: 'Subagyo Wiryono',
      mrn: 'MRN-2026-001928',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Sp.PD Budi',
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin Trihydrate 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'TID',
      durationDays: 2
    });

    expect(rxRes.success).toBe(true);
    expect(rxRes.order.status).toBe(MEDICATION_ORDER_STATES.ORDERED);
    expect(rxRes.order.scheduleSlots.length).toBe(6); // 3 slots x 2 days = 6 slots
    expect(rxRes.order.scheduleSlots[0].scheduledTime).toBe('08:00');
    expect(rxRes.order.scheduleSlots[1].scheduledTime).toBe('14:00');
    expect(rxRes.order.scheduleSlots[2].scheduledTime).toBe('20:00');

    // Step 2: Pharmacist Verifies & Dispenses with Batch and Expiry
    const dispRes = await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-001',
      pharmacistName: 'Apt. Siti Rahma',
      dispensedQty: 6,
      allocatedBatchNumber: 'BATCH-AMX-2026-09',
      allocatedLotNumber: 'LOT-9988',
      allocatedExpiryDate: '2028-12-31'
    });

    expect(dispRes.success).toBe(true);
    expect(dispRes.order.status).toBe(MEDICATION_ORDER_STATES.DISPENSED);
    expect(dispRes.order.dispenseInfo.batchNumber).toBe('BATCH-AMX-2026-09');

    // Step 3: Bedside Nurse Administers Slot 1 (08:00) with 7-Rights Verification
    const slot1 = rxRes.order.scheduleSlots[0];
    const adminRes = await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: slot1.slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      scannedPatientMrn: 'MRN-2026-001928',
      scannedMedicationCode: 'MED-AMOX-500',
      actualDose: 500,
      actualRoute: 'Oral'
    });

    expect(adminRes.success).toBe(true);
    expect(adminRes.slot.status).toBe(MEDICATION_SLOT_STATES.ADMINISTERED);
    expect(adminRes.order.status).toBe(MEDICATION_ORDER_STATES.IN_PROGRESS);
  });

  // 2. Invariant Check: High-Alert Dual-Verification Policy (JCI IPSG 3)
  it('2. should enforce independent dual-signature verification with HIGH_ALERT_DUAL_SIGN_REQUIRED code', async () => {
    const enc = {
      id: 'ENC-HIGH-ALERT',
      encounterNumber: 'REG-2026-HA',
      patientId: 'PAT-HA',
      patientName: 'Ny. Fatimah',
      mrn: 'MRN-2026-HA001',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Prescribe Rapid-Acting Insulin (High-Alert)
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-HIGH-ALERT',
      patientId: 'PAT-HA',
      patientName: 'Ny. Fatimah',
      mrn: 'MRN-2026-HA001',
      prescriberId: 'DOC-002',
      prescriberName: 'dr. Endokrin',
      medicationCode: 'MED-INS-NOVORAPID',
      medicationName: 'Novorapid Flexpen 100 IU/mL',
      dose: 6,
      doseUnit: 'IU',
      route: 'Subcutaneous',
      frequency: 'TID',
      isHighAlert: true,
      highAlertCategory: HIGH_ALERT_CATEGORIES.INSULIN
    });

    const slot1 = rxRes.order.scheduleSlots[0];

    // Single Nurse attempts administration without second co-signature ➔ Hard Stop!
    try {
      await medicationLifecycleEngine.administerDose({
        orderId: rxRes.order.id,
        slotId: slot1.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        scannedPatientMrn: 'MRN-2026-HA001',
        scannedMedicationCode: 'MED-INS-NOVORAPID'
      });
      expect.fail('Should have thrown HIGH_ALERT_DUAL_SIGN_REQUIRED');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.HIGH_ALERT_DUAL_SIGN_REQUIRED);
    }

    // With Dual Co-Signature ➔ Passes
    const adminWithDualSign = await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: slot1.slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      coSignatureNurseId: 'NURSE-002',
      coSignatureNurseName: 'Ners Maya (Co-Signer)',
      scannedPatientMrn: 'MRN-2026-HA001',
      scannedMedicationCode: 'MED-INS-NOVORAPID'
    });

    expect(adminWithDualSign.success).toBe(true);
    expect(adminWithDualSign.slot.coSignatureBy.name).toBe('Ners Maya (Co-Signer)');
  });

  // 3. Invariant Check: 7-Rights Barcode Mismatch Blocks
  it('3. should strictly reject administration with WRONG_PATIENT or WRONG_DRUG machine-readable codes', async () => {
    const enc = {
      id: 'ENC-MISMATCH-TEST',
      patientId: 'PAT-MISMATCH',
      patientName: 'Robby Sugara',
      mrn: 'MRN-2026-ROBBY',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-MISMATCH-TEST',
      patientId: 'PAT-MISMATCH',
      patientName: 'Robby Sugara',
      mrn: 'MRN-2026-ROBBY',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      dose: 1,
      doseUnit: 'g',
      route: 'IV',
      frequency: 'QD'
    });

    const slot1 = rxRes.order.scheduleSlots[0];

    // Wrong Patient Scanned
    try {
      await medicationLifecycleEngine.administerDose({
        orderId: rxRes.order.id,
        slotId: slot1.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        scannedPatientMrn: 'MRN-WRONG-PATIENT-999',
        scannedMedicationCode: 'MED-CEFTRIAXONE-1G'
      });
      expect.fail('Should have failed with WRONG_PATIENT');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.WRONG_PATIENT);
    }

    // Wrong Drug Scanned
    try {
      await medicationLifecycleEngine.administerDose({
        orderId: rxRes.order.id,
        slotId: slot1.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        scannedPatientMrn: 'MRN-2026-ROBBY',
        scannedMedicationCode: 'MED-CEFOTAXIME-1G'
      });
      expect.fail('Should have failed with WRONG_DRUG');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.WRONG_DRUG);
    }
  });

  // 4. Clinical Exception Path: Refused / Held with Right Reason
  it('4. should record non-administration with mandatory Right Reason classification', async () => {
    const enc = {
      id: 'ENC-REFUSED-TEST',
      patientId: 'PAT-REFUSED',
      patientName: 'Lutfi Hakim',
      mrn: 'MRN-2026-LUTFI',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-REFUSED-TEST',
      patientId: 'PAT-REFUSED',
      patientName: 'Lutfi Hakim',
      mrn: 'MRN-2026-LUTFI',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-PARACETAMOL-500',
      medicationName: 'Paracetamol 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'TID'
    });

    const slot1 = rxRes.order.scheduleSlots[0];

    const nonAdminRes = await medicationLifecycleEngine.recordNonAdministration({
      orderId: rxRes.order.id,
      slotId: slot1.slotId,
      reasonCategory: 'REFUSED',
      detailedReason: 'Pasien menolak minum obat karena merasa mual hebat',
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi'
    });

    expect(nonAdminRes.success).toBe(true);
    expect(nonAdminRes.slot.status).toBe(MEDICATION_SLOT_STATES.REFUSED);
    expect(nonAdminRes.slot.nonAdministeredReason.category).toBe('REFUSED');
    expect(nonAdminRes.slot.nonAdministeredReason.details).toContain('mual hebat');
  });

  // 5. Adversarial Concurrency & Double Administration Prevention
  it('5. should prevent concurrent double administration with SLOT_ALREADY_ADMINISTERED and deduplicate retries', async () => {
    const enc = {
      id: 'ENC-CONCURRENT-MED',
      patientId: 'PAT-CONC',
      patientName: 'Bambang Soediro',
      mrn: 'MRN-2026-BAMBANG',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-CONCURRENT-MED',
      patientId: 'PAT-CONC',
      patientName: 'Bambang Soediro',
      mrn: 'MRN-2026-BAMBANG',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-ONDANSETRON-4MG',
      medicationName: 'Ondansetron 4 mg Ampul',
      dose: 4,
      doseUnit: 'mg',
      route: 'IV',
      frequency: 'BID'
    });

    const slot1 = rxRes.order.scheduleSlots[0];
    const commandId = 'CMD-ADMIN-DOSE-0800-UUID-4433';

    // Nurse A administers with commandId
    const attemptA = await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: slot1.slotId,
      nurseId: 'NURSE-A',
      nurseName: 'Ners Ratna',
      scannedPatientMrn: 'MRN-2026-BAMBANG',
      scannedMedicationCode: 'MED-ONDANSETRON-4MG',
      expectedSlotVersion: 1,
      commandId
    });

    expect(attemptA.success).toBe(true);
    expect(attemptA.slot.status).toBe(MEDICATION_SLOT_STATES.ADMINISTERED);

    // Network Retry with identical commandId ➔ Idempotent replay without duplicate event
    const retryAttempt = await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: slot1.slotId,
      nurseId: 'NURSE-A',
      nurseName: 'Ners Ratna',
      scannedPatientMrn: 'MRN-2026-BAMBANG',
      scannedMedicationCode: 'MED-ONDANSETRON-4MG',
      commandId
    });
    expect(retryAttempt).toBe(attemptA);

    // Nurse B concurrently attempting on the same slot without the same commandId ➔ SLOT_ALREADY_ADMINISTERED!
    try {
      await medicationLifecycleEngine.administerDose({
        orderId: rxRes.order.id,
        slotId: slot1.slotId,
        nurseId: 'NURSE-B',
        nurseName: 'Ners Joko',
        scannedPatientMrn: 'MRN-2026-BAMBANG',
        scannedMedicationCode: 'MED-ONDANSETRON-4MG',
        commandId: 'CMD-DIFFERENT-NURSE-B'
      });
      expect.fail('Should have thrown SLOT_ALREADY_ADMINISTERED');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.SLOT_ALREADY_ADMINISTERED);
    }
  });
});
