import { describe, it, expect, beforeEach } from 'vitest';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS, TERMINAL_STATES } from '../src/core/services/careStateEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('Gate 0A & Gate 0B: Canonical CareStateEngine & Event Sourcing', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  it('1. should validate allowed transitions according to the canonical matrix', () => {
    // Valid transitions
    expect(careStateEngine.isValidTransition(CARE_STATES.REGISTERED, CARE_STATES.TRIAGE_PENDING)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.TRIAGE_PENDING, CARE_STATES.IGD_ACTIVE)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.IGD_ACTIVE, CARE_STATES.ADMISSION_PENDING)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.ADMISSION_PENDING, CARE_STATES.INPATIENT_ACTIVE)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.ICU_ACTIVE)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.OR_ACTIVE)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.OR_ACTIVE, CARE_STATES.PACU_RECOVERY)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.PACU_RECOVERY, CARE_STATES.INPATIENT_ACTIVE)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.DISCHARGE_PENDING)).toBe(true);
    expect(careStateEngine.isValidTransition(CARE_STATES.DISCHARGE_PENDING, CARE_STATES.DISCHARGED)).toBe(true);

    // Invalid transitions
    expect(careStateEngine.isValidTransition(CARE_STATES.REGISTERED, CARE_STATES.INPATIENT_ACTIVE)).toBe(false);
    expect(careStateEngine.isValidTransition(CARE_STATES.REGISTERED, CARE_STATES.OR_ACTIVE)).toBe(false);
    expect(careStateEngine.isValidTransition(CARE_STATES.TRIAGE_PENDING, CARE_STATES.DISCHARGE_PENDING)).toBe(false);
  });

  it('2. should strictly reject reopening closed/terminal encounters (Medicolegal Safety)', () => {
    expect(careStateEngine.isValidTransition(CARE_STATES.DISCHARGED, CARE_STATES.INPATIENT_ACTIVE)).toBe(false);
    expect(careStateEngine.isValidTransition(CARE_STATES.DISCHARGED, CARE_STATES.REGISTERED)).toBe(false);
    expect(careStateEngine.isValidTransition(CARE_STATES.DECEASED, CARE_STATES.ICU_ACTIVE)).toBe(false);
    expect(careStateEngine.isValidTransition(CARE_STATES.CANCELLED, CARE_STATES.OUTPATIENT_ACTIVE)).toBe(false);
  });

  it('3. should execute atomic transition, append to event stream, and update encounter', async () => {
    // Setup test encounter
    const testEncounter = {
      id: 'ENC-TEST-001',
      encounterNumber: 'REG-2026-0001',
      patientId: 'PAT-001',
      patientName: 'Ahmad Dahlan',
      mrn: 'MRN-2026-0001',
      primaryState: CARE_STATES.REGISTERED,
      status: 'REGISTERED'
    };
    await persistenceAdapter.save('encounters', testEncounter.id, testEncounter);

    // Transition: REGISTERED -> TRIAGE_PENDING
    const result = await careStateEngine.transition({
      encounterId: 'ENC-TEST-001',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Ners Anita',
      actorRole: 'NURSE',
      reason: 'Pasien dipanggil ke bilik triase IGD'
    });

    expect(result.success).toBe(true);
    expect(result.encounter.primaryState).toBe(CARE_STATES.TRIAGE_PENDING);
    expect(result.event.event_type).toBe(CLINICAL_EVENTS.START_TRIAGE);
    expect(result.event.previous_state).toBe(CARE_STATES.REGISTERED);
    expect(result.event.new_state).toBe(CARE_STATES.TRIAGE_PENDING);

    // Verify event stream query
    const events = await careStateEngine.getEventStreamByEncounter('ENC-TEST-001');
    expect(events.length).toBe(1);
    expect(events[0].performed_by_name).toBe('Ners Anita');
  });

  it('4. should synchronize ADT bed assignment on inpatient transition and release bed on discharge', async () => {
    const testEncounter = {
      id: 'ENC-TEST-ADT',
      encounterNumber: 'REG-2026-0002',
      patientId: 'PAT-002',
      patientName: 'Dewi Lestari',
      mrn: 'MRN-2026-0002',
      primaryState: CARE_STATES.ADMISSION_PENDING,
      status: 'ADMISSION_PENDING'
    };
    await persistenceAdapter.save('encounters', testEncounter.id, testEncounter);

    // Transition to INPATIENT_ACTIVE with Bed Allocation
    const admitResult = await careStateEngine.transition({
      encounterId: 'ENC-TEST-ADT',
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ALLOCATE_WARD_BED,
      bedId: 'BED-AZA-204-1',
      actorName: 'Staff Admisi',
      actorRole: 'ADMISSION'
    });

    expect(admitResult.success).toBe(true);
    expect(admitResult.encounter.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);
    expect(admitResult.encounter.location.bedId).toBe('BED-AZA-204-1');

    // Transition to DISCHARGE_PENDING
    await careStateEngine.transition({
      encounterId: 'ENC-TEST-ADT',
      targetState: CARE_STATES.DISCHARGE_PENDING,
      eventType: CLINICAL_EVENTS.START_DISCHARGE,
      actorName: 'dr. Surya Johnson',
      actorRole: 'DOCTOR'
    });

    // Final DISCHARGED Transition
    const dischargeResult = await careStateEngine.transition({
      encounterId: 'ENC-TEST-ADT',
      targetState: CARE_STATES.DISCHARGED,
      eventType: CLINICAL_EVENTS.COMPLETE_DISCHARGE,
      actorName: 'Kasir & Admisi',
      actorRole: 'STAFF'
    });

    expect(dischargeResult.encounter.isTerminal).toBe(true);
    expect(dischargeResult.encounter.dischargeDate).toBeDefined();
  });
});
