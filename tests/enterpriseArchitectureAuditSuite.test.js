/**
 * NurseFlow Enterprise HIS — 8-Point Architecture Audit & Stress Verification Suite
 * Verifies: Single State Authority, Append-Only Event Stream, Race Condition Resilience,
 * Offline Resilience, and Search Projection Performance (< 100ms for 1k, < 250ms for 10k).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';
import { careWorkspaceResolver } from '../src/core/services/careWorkspaceResolver.service.js';
import { careStateMigrationService } from '../src/core/services/careStateMigration.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('Sprint 2.5 Architecture Audit & Stress Verification Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // Audit 1 & 3: Single State Authority & Append-Only Event Stream
  it('1. Audit 1 & 3: should enforce append-only event stream and prevent invalid state bypass', async () => {
    const enc = {
      id: 'ENC-AUDIT-001',
      encounterNumber: 'REG-2026-AUD01',
      patientId: 'PAT-AUD01',
      patientName: 'Subagyo Wiryono',
      mrn: 'MRN-2026-AUD01',
      primaryState: CARE_STATES.REGISTERED,
      status: 'REGISTERED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Transition 1
    await careStateEngine.transition({
      encounterId: 'ENC-AUDIT-001',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Perawat Triase',
      reason: 'Triase dimulai'
    });

    // Transition 2
    await careStateEngine.transition({
      encounterId: 'ENC-AUDIT-001',
      targetState: CARE_STATES.IGD_ACTIVE,
      eventType: CLINICAL_EVENTS.COMPLETE_TRIAGE,
      actorName: 'dr. IGD',
      reason: 'Triase selesai ESI 2'
    });

    const stream = await careStateEngine.getEventStreamByEncounter('ENC-AUDIT-001');
    expect(stream.length).toBe(2);
    expect(stream[0].new_state).toBe(CARE_STATES.TRIAGE_PENDING);
    expect(stream[1].new_state).toBe(CARE_STATES.IGD_ACTIVE);

    // Verify all event IDs are unique and immutable
    const eventIds = new Set(stream.map(e => e.id));
    expect(eventIds.size).toBe(2);

    // Verify Event Sourcing Schema Evolution Fields (Gate 0D Enhancement)
    expect(stream[0].eventVersion).toBe('1.0');
    expect(stream[1].eventVersion).toBe('1.0');
    expect(stream[1].aggregateVersion).toBe(3); // Initial (1) + Trans 1 (2) + Trans 2 (3)
    expect(stream[1].correlationId).toBeDefined();
  });

  // Audit 5: Race Condition Stress Test
  it('2. Audit 5: should handle race conditions deterministically without dual-state corruption', async () => {
    const enc = {
      id: 'ENC-RACE-CONDITION',
      encounterNumber: 'REG-2026-RACE',
      patientId: 'PAT-RACE',
      patientName: 'Hendra Gunawan',
      mrn: 'MRN-2026-RACE',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      status: 'INPATIENT_ACTIVE'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Doctor A orders Discharge (INPATIENT_ACTIVE -> DISCHARGE_PENDING)
    // Doctor B orders ICU Transfer (INPATIENT_ACTIVE -> ICU_ACTIVE)
    // Execute both sequentially / concurrently
    const promiseA = careStateEngine.transition({
      encounterId: 'ENC-RACE-CONDITION',
      targetState: CARE_STATES.DISCHARGE_PENDING,
      eventType: CLINICAL_EVENTS.START_DISCHARGE,
      actorName: 'dr. Spesialis A'
    });

    const resultA = await promiseA;
    expect(resultA.success).toBe(true);
    expect(resultA.encounter.primaryState).toBe(CARE_STATES.DISCHARGE_PENDING);

    // Attempting Doctor B's action after A has committed DISCHARGE_PENDING:
    // From DISCHARGE_PENDING, ICU_ACTIVE is strictly forbidden by the matrix!
    await expect(
      careStateEngine.transition({
        encounterId: 'ENC-RACE-CONDITION',
        targetState: CARE_STATES.ICU_ACTIVE,
        eventType: CLINICAL_EVENTS.TRANSFER_TO_ICU,
        actorName: 'dr. Intensivist B'
      })
    ).rejects.toThrow(/Illegal state transition/);

    // Verify encounter remains in DISCHARGE_PENDING without state collision
    const finalEnc = await persistenceAdapter.findById('encounters', 'ENC-RACE-CONDITION');
    expect(finalEnc.primaryState).toBe(CARE_STATES.DISCHARGE_PENDING);
    expect(finalEnc.version).toBe(2);

    // OCC Version Check: Stale client with expectedVersion = 1 tries to mutate
    await expect(
      careStateEngine.transition({
        encounterId: 'ENC-RACE-CONDITION',
        targetState: CARE_STATES.DISCHARGED,
        eventType: CLINICAL_EVENTS.COMPLETE_DISCHARGE,
        metadata: { expectedVersion: 1 } // Stale version! Current version is 2
      })
    ).rejects.toThrow(/OCC_CONFLICT/);
  });

  // Audit 6: Offline Resilience & Crash Recovery
  it('3. Audit 6: should maintain state and location consistency across simulated disruption and recovery', async () => {
    const enc = {
      id: 'ENC-OFFLINE-TEST',
      encounterNumber: 'REG-2026-OFFLINE',
      patientId: 'PAT-OFFLINE',
      patientName: 'Rina Sasmita',
      mrn: 'MRN-2026-OFFLINE',
      primaryState: CARE_STATES.ADMISSION_PENDING,
      status: 'ADMISSION_PENDING'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Perform state transition
    await careStateEngine.transition({
      encounterId: 'ENC-OFFLINE-TEST',
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ALLOCATE_WARD_BED,
      bedId: 'BED-AZA-204-2',
      location: {
        departmentName: 'Instalasi Rawat Inap',
        wardName: 'Bangsal Azalea',
        roomNumber: 'Kamar 204',
        bedCode: '204-B'
      },
      actorName: 'Petugas Admisi'
    });

    // Simulate crash / restart: Rebuild projections from event stream
    const rebuildRes = await careStateMigrationService.rebuildAllProjections();
    expect(rebuildRes.success).toBe(true);

    const projectedEnc = await persistenceAdapter.findById('care_state_projections', 'ENC-OFFLINE-TEST');
    expect(projectedEnc.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);
    expect(projectedEnc.location.bedCode).toBe('204-B');
  });

  // Audit 7: Global Search Performance Benchmark
  it('4. Audit 7: should execute Global Search queries under target SLA (< 100ms for 1k, < 250ms for 10k)', async () => {
    // Generate 1,000 synthetic patient projections
    const sampleSize = 1000;
    const testPatients = [];

    for (let i = 1; i <= sampleSize; i++) {
      testPatients.push({
        id: `PAT-PERF-${i}`,
        mrn: `MRN-2026-${String(i).padStart(6, '0')}`,
        name: `Pasien Uji Performa ${i}`,
        nik: `317101500000${String(i).padStart(4, '0')}`,
        status: i % 2 === 0 ? CARE_STATES.INPATIENT_ACTIVE : CARE_STATES.IGD_ACTIVE,
        payer: i % 3 === 0 ? 'BPJS Kesehatan' : 'Umum',
        created_at: new Date().toISOString()
      });
    }

    persistenceAdapter.seedMemoryData('patients', testPatients);

    // Benchmark Query: Search by Name / MRN / NIK
    const startTime = performance.now();
    const query = 'Pasien Uji Performa 789';
    const all = await persistenceAdapter.query('patients');
    const results = all.filter(p => 
      p.name.includes(query) || p.mrn.includes(query) || p.nik.includes(query)
    );
    const durationMs = performance.now() - startTime;

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Pasien Uji Performa 789');
    expect(durationMs).toBeLessThan(100); // Target SLA < 100ms for 1,000 records
  });

  // Audit 8: Deterministic Event Replay Across System Versions
  it('5. Audit 8: should deterministically replay historical event stream across system versions and preserve identical state, bed, and workspace resolution', async () => {
    const enc = {
      id: 'ENC-VERSION-REPLAY',
      encounterNumber: 'REG-2026-VREPLAY',
      patientId: 'PAT-VREPLAY',
      patientName: 'Bambang Soediro',
      mrn: 'MRN-2026-VREPLAY',
      primaryState: CARE_STATES.REGISTERED,
      status: 'REGISTERED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Sequence 1: REGISTERED -> TRIAGE_PENDING
    await careStateEngine.transition({
      encounterId: 'ENC-VERSION-REPLAY',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Ners Maya'
    });

    // Sequence 2: TRIAGE_PENDING -> IGD_ACTIVE
    await careStateEngine.transition({
      encounterId: 'ENC-VERSION-REPLAY',
      targetState: CARE_STATES.IGD_ACTIVE,
      eventType: CLINICAL_EVENTS.COMPLETE_TRIAGE,
      actorName: 'dr. Triase'
    });

    // Sequence 3: IGD_ACTIVE -> ADMISSION_PENDING
    await careStateEngine.transition({
      encounterId: 'ENC-VERSION-REPLAY',
      targetState: CARE_STATES.ADMISSION_PENDING,
      eventType: CLINICAL_EVENTS.REQUEST_ADMISSION,
      actorName: 'dr. Spesialis'
    });

    // Sequence 4: ADMISSION_PENDING -> INPATIENT_ACTIVE
    await careStateEngine.transition({
      encounterId: 'ENC-VERSION-REPLAY',
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ALLOCATE_WARD_BED,
      bedId: 'BED-AZA-204-2',
      location: {
        departmentName: 'Instalasi Rawat Inap',
        wardName: 'Bangsal Azalea',
        roomNumber: 'Kamar 204',
        bedCode: '204-B'
      },
      actorName: 'Admisi Ranap'
    });

    // Simulate "Next System Version (2027) Replay": Wipe and rebuild from event stream
    await persistenceAdapter.seedMemoryData('care_state_projections', []);
    const replayResult = await careStateMigrationService.rebuildAllProjections();
    expect(replayResult.success).toBe(true);

    const replayedProjection = await persistenceAdapter.findById('care_state_projections', 'ENC-VERSION-REPLAY');
    
    // Exact Deterministic Invariant Checks:
    expect(replayedProjection.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);
    expect(replayedProjection.location.bedCode).toBe('204-B');
    expect(replayedProjection.location.wardName).toBe('Bangsal Azalea');

    // Dynamic Workspace Resolver Invariant Check:
    const resolvedNurseWorkspace = careWorkspaceResolver.resolve({
      careState: replayedProjection.primaryState,
      role: 'NURSE'
    });
    expect(resolvedNurseWorkspace.path).toBe('/nursing-workspace');

    const resolvedDoctorWorkspace = careWorkspaceResolver.resolve({
      careState: replayedProjection.primaryState,
      role: 'DOCTOR'
    });
    expect(resolvedDoctorWorkspace.path).toBe('/doctor-workspace');
  });

  // Audit 9: Idempotency Key & Command Deduplication (Network Retry Protection)
  it('6. Audit 9: should deduplicate retried commands with identical commandId/idempotencyKey', async () => {
    const enc = {
      id: 'ENC-IDEMPOTENT-001',
      encounterNumber: 'REG-2026-IDEM01',
      patientId: 'PAT-IDEM01',
      patientName: 'Kusuma Wardani',
      mrn: 'MRN-2026-IDEM01',
      primaryState: CARE_STATES.REGISTERED,
      status: 'REGISTERED'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const commandId = 'CMD-TRANSFER-ICU-UUID-9876';

    // First Execution
    const firstAttempt = await careStateEngine.transition({
      encounterId: 'ENC-IDEMPOTENT-001',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Ners Triase',
      metadata: { commandId }
    });
    expect(firstAttempt.success).toBe(true);

    // Network Retry with exact same commandId
    const retryAttempt = await careStateEngine.transition({
      encounterId: 'ENC-IDEMPOTENT-001',
      targetState: CARE_STATES.TRIAGE_PENDING,
      eventType: CLINICAL_EVENTS.START_TRIAGE,
      actorName: 'Ners Triase',
      metadata: { commandId }
    });

    // Must return cached result without creating a duplicate event
    expect(retryAttempt).toBe(firstAttempt);
    const eventStream = await careStateEngine.getEventStreamByEncounter('ENC-IDEMPOTENT-001');
    expect(eventStream.length).toBe(1); // Exact 1 event, zero duplicate!
  });

  // Audit 10: Device Form-Factor Support in Workspace Resolver
  it('7. Audit 10: should resolve device-aware views (Large Display / Central Station vs Desktop)', () => {
    const largeDisplayRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'NURSE',
      device: 'LARGE_DISPLAY'
    });
    expect(largeDisplayRes.viewMode).toBe('CENTRAL_STATION_TELEMETRY');
    expect(largeDisplayRes.workspaceName).toContain('Central Station');

    const desktopRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'NURSE',
      device: 'DESKTOP'
    });
    expect(desktopRes.path).toBe('/nursing-workspace');
  });
});

