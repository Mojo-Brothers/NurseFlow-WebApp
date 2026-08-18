/**
 * Sprint 3B: Medication Event Store & Projections Engine Test Suite
 * Validates: Deterministic Projection Replay (eMAR, Pharmacy, Audit Ledger),
 * Stale UI Attack Protection, and Bedside vs Take-Home Discharge Invariants.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  medicationLifecycleEngine, 
  MEDICATION_ORDER_STATES, 
  MEDICATION_SLOT_STATES,
  MED_ERROR_CODES
} from '../src/core/services/medicationLifecycleEngine.service.js';
import { medicationProjectionEngine } from '../src/core/services/medicationProjectionEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3B: Medication Event Store & Projections Engine Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // 1. Gate 3B: Deterministic Projection Replay from Event Store
  it('1. should deterministically rebuild eMAR, Pharmacy, and Audit projections from medication_events', async () => {
    const enc = {
      id: 'ENC-PROJ-001',
      encounterNumber: 'REG-2026-PROJ01',
      patientId: 'PAT-PROJ01',
      patientName: 'Kusuma Wardani',
      mrn: 'MRN-2026-PROJ01',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Event 1: Prescribe
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-PROJ-001',
      patientId: 'PAT-PROJ01',
      patientName: 'Kusuma Wardani',
      mrn: 'MRN-2026-PROJ01',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-CIPRO-500',
      medicationName: 'Ciprofloxacin 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'BID',
      durationDays: 1
    });

    // Event 2: Dispense
    await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-001',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 2,
      allocatedBatchNumber: 'BATCH-CIP-01',
      allocatedLotNumber: 'LOT-5544',
      allocatedExpiryDate: '2027-10-31'
    });

    // Event 3: Administer Slot 1
    await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: rxRes.order.scheduleSlots[0].slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      scannedPatientMrn: 'MRN-2026-PROJ01',
      scannedMedicationCode: 'MED-CIPRO-500'
    });

    // Event 4: Refuse Slot 2
    await medicationLifecycleEngine.recordNonAdministration({
      orderId: rxRes.order.id,
      slotId: rxRes.order.scheduleSlots[1].slotId,
      reasonCategory: 'REFUSED',
      detailedReason: 'Pasien menolak dosis malam karena pusing',
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi'
    });

    // Verify 4 raw events stored in event ledger
    const rawEvents = await persistenceAdapter.query('medication_events');
    expect(rawEvents.length).toBe(4);

    // SIMULATE DISASTER RECOVERY: Wipe all 3 projection collections
    persistenceAdapter.seedMemoryData('emar_projections', []);
    persistenceAdapter.seedMemoryData('pharmacy_projections', []);
    persistenceAdapter.seedMemoryData('medication_audit_projections', []);

    // Execute Deterministic Rebuild
    const rebuildRes = await medicationProjectionEngine.rebuildAllProjections();
    expect(rebuildRes.success).toBe(true);
    expect(rebuildRes.eventCount).toBe(4);

    // Verify eMAR Projection
    const emarDoc = await persistenceAdapter.findById('emar_projections', 'PAT-PROJ01');
    expect(emarDoc).toBeDefined();
    expect(emarDoc.administeredCount).toBe(1);
    expect(emarDoc.refusedCount).toBe(1);

    // Verify Pharmacy Projection
    const pharmDoc = await persistenceAdapter.findById('pharmacy_projections', rxRes.order.id);
    expect(pharmDoc.status).toBe(MEDICATION_ORDER_STATES.DISPENSED);
    expect(pharmDoc.dispenseInfo.batchNumber).toBe('BATCH-CIP-01');

    // Verify Audit Ledger Projection
    const auditDoc = await persistenceAdapter.findById('medication_audit_projections', rxRes.order.id);
    expect(auditDoc.history.length).toBe(4);
    expect(auditDoc.history[0].eventType).toBe('PRESCRIBE_MEDICATION');
    expect(auditDoc.history[2].eventType).toBe('ADMINISTER_DOSE');
  });

  // 2. Stale UI Attack Protection
  it('2. should reject administration from stale UI when doctor has cancelled the order', async () => {
    const enc = {
      id: 'ENC-STALE-ATTACK',
      patientId: 'PAT-STALE',
      patientName: 'Rina Sasmita',
      mrn: 'MRN-2026-STALE',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Doctor prescribes
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-STALE-ATTACK',
      patientId: 'PAT-STALE',
      patientName: 'Rina Sasmita',
      mrn: 'MRN-2026-STALE',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-DIGOXIN-025',
      medicationName: 'Digoxin 0.25 mg Tab',
      dose: 0.25,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD'
    });

    const slot1 = rxRes.order.scheduleSlots[0];

    // Doctor cancels order (e.g. Toxicity risk discovered)
    await medicationLifecycleEngine.cancelMedicationOrder({
      orderId: rxRes.order.id,
      cancelledById: 'DOC-001',
      cancelledByName: 'dr. Budi',
      cancellationReason: 'Discontinue due to bradycardia'
    });

    // Stale Nurse UI attempts administration without refreshing
    try {
      await medicationLifecycleEngine.administerDose({
        orderId: rxRes.order.id,
        slotId: slot1.slotId,
        nurseId: 'NURSE-001',
        nurseName: 'Ners Dewi',
        scannedPatientMrn: 'MRN-2026-STALE',
        scannedMedicationCode: 'MED-DIGOXIN-025'
      });
      expect.fail('Should have failed with ORDER_CANCELLED');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.ORDER_CANCELLED);
    }
  });

  // 3. Discharge Bedside Admin Block vs Take-Home Discharge Medication
  it('3. should block bedside administration on discharged patient but allow take-home discharge workflow', async () => {
    const enc = {
      id: 'ENC-DISCHARGE-DIFF',
      patientId: 'PAT-DISCH',
      patientName: 'Agus Salim',
      mrn: 'MRN-2026-AGUS',
      primaryState: CARE_STATES.DISCHARGED,
      status: 'DISCHARGED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Attempt 1: Routine Inpatient Prescription for Discharged Patient ➔ Blocked
    try {
      await medicationLifecycleEngine.prescribeMedication({
        encounterId: 'ENC-DISCHARGE-DIFF',
        patientId: 'PAT-DISCH',
        patientName: 'Agus Salim',
        mrn: 'MRN-2026-AGUS',
        prescriberId: 'DOC-001',
        prescriberName: 'dr. Budi',
        medicationCode: 'MED-FUROSEMIDE-40',
        medicationName: 'Furosemide 40 mg',
        dose: 40,
        doseUnit: 'mg',
        route: 'Oral',
        frequency: 'QD',
        workflowType: 'INPATIENT_ROUTINE'
      });
      expect.fail('Should have thrown PATIENT_TERMINAL');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.PATIENT_TERMINAL);
    }

    // Attempt 2: Discharge Take-Home Medication ➔ Allowed for home medication counseling
    const takeHomeRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-DISCHARGE-DIFF',
      patientId: 'PAT-DISCH',
      patientName: 'Agus Salim',
      mrn: 'MRN-2026-AGUS',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-FUROSEMIDE-40',
      medicationName: 'Furosemide 40 mg (Obat Pulang)',
      dose: 40,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD',
      workflowType: 'DISCHARGE_TAKE_HOME'
    });

    expect(takeHomeRes.success).toBe(true);
    expect(takeHomeRes.order.workflowType).toBe('DISCHARGE_TAKE_HOME');
  });
});
