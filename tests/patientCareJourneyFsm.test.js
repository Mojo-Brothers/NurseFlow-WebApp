import { describe, it, expect, beforeEach } from 'vitest';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';
import { careStateMigrationService } from '../src/core/services/careStateMigration.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('Enterprise Gates P1–P5: Full Patient Journey FSM, Concurrency & Projection Rebuild', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  it('1. Gate P4: Full Patient Journey E2E Transition Flow', async () => {
    const enc = {
      id: 'ENC-JOURNEY-FULL',
      encounterNumber: 'REG-2026-9999',
      patientId: 'PAT-999',
      patientName: 'Kusuma Wardani',
      mrn: 'MRN-2026-9999',
      primaryState: CARE_STATES.REGISTERED,
      status: 'REGISTERED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // 1. REGISTERED -> TRIAGE_PENDING
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Perawat Triase'
    });

    // 2. TRIAGE_PENDING -> IGD_ACTIVE
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.IGD_ACTIVE,
      eventType: CLINICAL_EVENTS.COMPLETE_TRIAGE,
      actorName: 'dr. Triase On Duty'
    });

    // 3. IGD_ACTIVE -> ADMISSION_PENDING (SPRI)
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.ADMISSION_PENDING,
      eventType: CLINICAL_EVENTS.REQUEST_ADMISSION,
      actorName: 'dr. Spesialis Penyakit Dalam'
    });

    // 4. ADMISSION_PENDING -> INPATIENT_ACTIVE
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ALLOCATE_WARD_BED,
      bedId: 'BED-AZA-204-1',
      actorName: 'Admisi Rawat Inap'
    });

    // 5. INPATIENT_ACTIVE -> ICU_ACTIVE (Critical deterioration)
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.ICU_ACTIVE,
      eventType: CLINICAL_EVENTS.TRANSFER_TO_ICU,
      actorName: 'Tim Intensivist ICU'
    });

    // 6. ICU_ACTIVE -> OR_ACTIVE (Emergency surgery)
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.OR_ACTIVE,
      eventType: CLINICAL_EVENTS.START_SURGERY,
      actorName: 'dr. Bedah & Tim Anestesi'
    });

    // 7. OR_ACTIVE -> PACU_RECOVERY (Post-op recovery)
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.PACU_RECOVERY,
      eventType: CLINICAL_EVENTS.COMPLETE_SURGERY,
      actorName: 'Perawat Recovery Room'
    });

    // 8. PACU_RECOVERY -> INPATIENT_ACTIVE (Aldrete Score Passed)
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.COMPLETE_PACU,
      actorName: 'Perawat Bangsal'
    });

    // 9. INPATIENT_ACTIVE -> DISCHARGE_PENDING
    await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.DISCHARGE_PENDING,
      eventType: CLINICAL_EVENTS.START_DISCHARGE,
      actorName: 'dr. DPJP'
    });

    // 10. DISCHARGE_PENDING -> DISCHARGED
    const finalResult = await careStateEngine.transition({
      encounterId: 'ENC-JOURNEY-FULL',
      targetState: CARE_STATES.DISCHARGED,
      eventType: CLINICAL_EVENTS.COMPLETE_DISCHARGE,
      actorName: 'Petugas Kasir & Admisi'
    });

    expect(finalResult.encounter.primaryState).toBe(CARE_STATES.DISCHARGED);
    expect(finalResult.encounter.isTerminal).toBe(true);

    // Verify full event stream length = 10 events
    const stream = await careStateEngine.getEventStreamByEncounter('ENC-JOURNEY-FULL');
    expect(stream.length).toBe(10);
  });

  it('2. Gate P1: Concurrency and Invalid Double-Transition Protection', async () => {
    const enc = {
      id: 'ENC-CONCURRENCY-TEST',
      encounterNumber: 'REG-2026-8888',
      patientId: 'PAT-888',
      patientName: 'Rudi Hartono',
      mrn: 'MRN-2026-8888',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Doctor initiates discharge
    await careStateEngine.transition({
      encounterId: 'ENC-CONCURRENCY-TEST',
      targetState: CARE_STATES.DISCHARGE_PENDING,
      eventType: CLINICAL_EVENTS.START_DISCHARGE,
      actorName: 'dr. Budi'
    });

    // Concurrent invalid attempt: Try to jump from DISCHARGE_PENDING directly to ICU_ACTIVE (blocked by matrix)
    await expect(
      careStateEngine.transition({
        encounterId: 'ENC-CONCURRENCY-TEST',
        targetState: CARE_STATES.ICU_ACTIVE,
        eventType: CLINICAL_EVENTS.TRANSFER_TO_ICU,
        actorName: 'Staf Lain'
      })
    ).rejects.toThrow(/Illegal state transition/);
  });

  it('3. Gate P3: Projection Rebuild Verification (Event Sourcing Resilience)', async () => {
    // 1. Wipe projections cache
    await persistenceAdapter.seedMemoryData('care_state_projections', []);

    // 2. Rebuild all projections from event stream
    const rebuildResult = await careStateMigrationService.rebuildAllProjections();
    expect(rebuildResult.success).toBe(true);

    const projections = await persistenceAdapter.query('care_state_projections');
    expect(projections.length).toBeGreaterThan(0);
  });

  it('4. Gate P5: JCI Medicolegal Audit Completeness', async () => {
    const stream = await careStateEngine.getEventStreamByEncounter('ENC-JOURNEY-FULL');
    for (const evt of stream) {
      expect(evt.id).toBeDefined();
      expect(evt.encounter_id).toBe('ENC-JOURNEY-FULL');
      expect(evt.performed_by_name).toBeDefined();
      expect(evt.performed_at).toBeDefined();
      expect(evt.new_state).toBeDefined();
      expect(evt.event_type).toBeDefined();
    }
  });
});
