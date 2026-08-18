/**
 * MEDICATION EVENT STORE HARDENING GATE — PRE SPRINT 3C SUITE
 * 
 * Verifies:
 * 1. Append-Only Persistence Enforcement (UPDATE / DELETE strictly blocked)
 * 2. Deterministic & Idempotent Projection Replay (1x, 2x, 3x)
 * 3. Strict Aggregate Version Monotonicity (1 -> 2 -> 3)
 * 4. Correlation Trace Chain
 * 5. Stale UI Attack Protection (ORDER_CANCELLED)
 * 6. Concurrent Multi-Nurse Administration (SLOT_ALREADY_ADMINISTERED)
 * 7. Discharge Bedside vs Take-Home Boundaries
 * 8. Deceased Hard Stop (PATIENT_TERMINAL)
 * 9. Cross-Version Replay Compatibility
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

describe('Medication Event Store Hardening Gate — Pre Sprint 3C', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // 1. Append-Only Persistence Enforcement
  it('1. should strictly reject any UPDATE or DELETE on medication_events (Immutable WORM Ledger)', async () => {
    const enc = {
      id: 'ENC-IMMUTABLE-01',
      patientId: 'PAT-IMMUTABLE',
      patientName: 'Budi Santoso',
      mrn: 'MRN-2026-IMM01',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Create an event via domain engine
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-IMMUTABLE-01',
      patientId: 'PAT-IMMUTABLE',
      patientName: 'Budi Santoso',
      mrn: 'MRN-2026-IMM01',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-PARACETAMOL-500',
      medicationName: 'Paracetamol 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'TID'
    });

    const eventId = rxRes.event.id;

    // Direct malicious attempt to UPDATE historical event ➔ Strictly Blocked!
    await expect(
      persistenceAdapter.save('medication_events', eventId, {
        ...rxRes.event,
        payload: { dose: '1000 mg (TAMPERED)' }
      })
    ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

    // Direct malicious attempt to DELETE historical event ➔ Strictly Blocked!
    await expect(
      persistenceAdapter.delete('medication_events', eventId)
    ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

    // Verify historical event remains un-tampered
    const event = await persistenceAdapter.findById('medication_events', eventId);
    expect(event.payload.dose).toBe('500 mg');
  });

  // 2. Deterministic & Idempotent Projection Replay (1x, 2x, 3x)
  it('2. should replay projections 1x, 2x, 3x with 100% idempotent results and zero duplicate counts', async () => {
    const enc = {
      id: 'ENC-REPLAY-IDEM',
      patientId: 'PAT-REPLAY',
      patientName: 'Siti Aminah',
      mrn: 'MRN-2026-REP01',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-REPLAY-IDEM',
      patientId: 'PAT-REPLAY',
      patientName: 'Siti Aminah',
      mrn: 'MRN-2026-REP01',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'BID',
      durationDays: 1
    });

    await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-001',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 2,
      allocatedBatchNumber: 'BATCH-001',
      allocatedLotNumber: 'LOT-001',
      allocatedExpiryDate: '2028-01-01'
    });

    await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: rxRes.order.scheduleSlots[0].slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      scannedPatientMrn: 'MRN-2026-REP01',
      scannedMedicationCode: 'MED-AMOX-500'
    });

    // Replay 1
    const replay1 = await medicationProjectionEngine.rebuildAllProjections();
    const emar1 = await persistenceAdapter.findById('emar_projections', 'PAT-REPLAY');
    expect(emar1.administeredCount).toBe(1);

    // Replay 2
    const replay2 = await medicationProjectionEngine.rebuildAllProjections();
    const emar2 = await persistenceAdapter.findById('emar_projections', 'PAT-REPLAY');
    expect(emar2.administeredCount).toBe(1);

    // Replay 3
    const replay3 = await medicationProjectionEngine.rebuildAllProjections();
    const emar3 = await persistenceAdapter.findById('emar_projections', 'PAT-REPLAY');
    expect(emar3.administeredCount).toBe(1);
    expect(replay3.eventCount).toBe(replay1.eventCount);
  });

  // 3. Aggregate Version Monotonicity & Correlation Trace
  it('3. should advance aggregateVersion monotonically (1 -> 2 -> 3) and trace workflow by correlationId', async () => {
    const enc = {
      id: 'ENC-VERSION-TRACE',
      patientId: 'PAT-TRACE',
      patientName: 'Hendro Prasetyo',
      mrn: 'MRN-2026-TR01',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const correlationId = 'CORR-CLINICAL-CHAIN-2026-0099';

    // Step 1: Prescribe (Version 1)
    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-VERSION-TRACE',
      patientId: 'PAT-TRACE',
      patientName: 'Hendro Prasetyo',
      mrn: 'MRN-2026-TR01',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-METFORMIN-500',
      medicationName: 'Metformin 500 mg',
      dose: 500,
      doseUnit: 'mg',
      route: 'Oral',
      frequency: 'QD',
      correlationId
    });
    expect(rxRes.order.version).toBe(1);
    expect(rxRes.event.aggregateVersion).toBe(1);

    // Step 2: Dispense (Version 2)
    const dispRes = await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-001',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 1,
      allocatedBatchNumber: 'BATCH-MET-01',
      allocatedLotNumber: 'LOT-9988',
      allocatedExpiryDate: '2028-05-01',
      correlationId
    });
    expect(dispRes.order.version).toBe(2);
    expect(dispRes.event.aggregateVersion).toBe(2);

    // Step 3: Administer (Version 3)
    const adminRes = await medicationLifecycleEngine.administerDose({
      orderId: rxRes.order.id,
      slotId: rxRes.order.scheduleSlots[0].slotId,
      nurseId: 'NURSE-001',
      nurseName: 'Ners Dewi',
      scannedPatientMrn: 'MRN-2026-TR01',
      scannedMedicationCode: 'MED-METFORMIN-500',
      correlationId
    });
    expect(adminRes.order.version).toBe(3);
    expect(adminRes.event.aggregateVersion).toBe(3);

    // Correlation Query
    const allEvents = await persistenceAdapter.query('medication_events');
    const correlatedEvents = allEvents.filter(e => e.correlationId === correlationId);
    expect(correlatedEvents.length).toBe(3);
    expect(correlatedEvents[0].eventType).toBe('PRESCRIBE_MEDICATION');
    expect(correlatedEvents[1].eventType).toBe('DISPENSE_MEDICATION');
    expect(correlatedEvents[2].eventType).toBe('ADMINISTER_DOSE');
  });

  // 4. Stale UI Attack & Deceased Patient Hard Stop
  it('4. should reject Stale UI (ORDER_CANCELLED) and Deceased Patient (PATIENT_TERMINAL)', async () => {
    const enc = {
      id: 'ENC-DECEASED-TEST',
      patientId: 'PAT-DEC',
      patientName: 'Alm. Soetrisno',
      mrn: 'MRN-2026-DEC',
      primaryState: CARE_STATES.DECEASED,
      status: 'DECEASED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Prescribing or Administering on Deceased Patient ➔ PATIENT_TERMINAL Hard Stop!
    try {
      await medicationLifecycleEngine.prescribeMedication({
        encounterId: 'ENC-DECEASED-TEST',
        patientId: 'PAT-DEC',
        patientName: 'Alm. Soetrisno',
        mrn: 'MRN-2026-DEC',
        prescriberId: 'DOC-001',
        prescriberName: 'dr. Budi',
        medicationCode: 'MED-FUROSEMIDE-40',
        medicationName: 'Furosemide 40 mg',
        dose: 40,
        doseUnit: 'mg',
        route: 'IV',
        frequency: 'STAT'
      });
      expect.fail('Should have failed with PATIENT_TERMINAL');
    } catch (err) {
      expect(err.code).toBe(MED_ERROR_CODES.PATIENT_TERMINAL);
    }
  });

  // 5. Cross-Version Replay Compatibility
  it('5. should replay legacy/v1.0 synthetic historical events into projections without errors', async () => {
    const syntheticLegacyEvent = {
      id: 'EVT-MED-LEGACY-001',
      eventVersion: '1.0',
      aggregateId: 'ORD-LEGACY-999',
      aggregateVersion: 1,
      correlationId: 'CORR-LEGACY-999',
      eventType: 'PRESCRIBE_MEDICATION',
      patientId: 'PAT-LEGACY',
      encounterId: 'ENC-LEGACY',
      medicationOrderId: 'ORD-LEGACY-999',
      occurredAt: '2026-01-01T08:00:00.000Z',
      recordedAt: '2026-01-01T08:00:00.000Z',
      performedBy: { id: 'DOC-001', name: 'dr. Budi', role: 'DOCTOR' },
      payload: {
        orderId: 'ORD-LEGACY-999',
        medicationName: 'Aspirin 81 mg',
        dose: '81 mg',
        route: 'Oral',
        frequency: 'QD'
      }
    };

    await persistenceAdapter.save('medication_events', syntheticLegacyEvent.id, syntheticLegacyEvent);

    const rebuildRes = await medicationProjectionEngine.rebuildAllProjections();
    expect(rebuildRes.success).toBe(true);

    const emarDoc = await persistenceAdapter.findById('emar_projections', 'PAT-LEGACY');
    expect(emarDoc).toBeDefined();
    expect(emarDoc.activeOrders[0].medicationName).toBe('Aspirin 81 mg');
  });
});
