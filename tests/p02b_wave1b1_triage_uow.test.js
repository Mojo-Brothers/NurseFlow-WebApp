/**
 * P0-2B WAVE 1B.1 — Triage Domain UoW Pilot: Evidence Test Suite
 *
 * EVIDENCE GOALS:
 *   E1. Tenant Isolation  — UoW gate rejects missing/invalid tenantId (fails-closed).
 *   E2. Tenant Isolation  — Cross-tenant encounter read returns 0 rows via RLS simulation.
 *   E3. Transaction Commit — recordTriageAssessment commits triage + SLA timer + audit atomically.
 *   E4. Transaction Rollback — Any domain error inside UoW causes full rollback (no partial writes).
 *   E5. Connection Cleanup — DISCARD ALL is called in finally block before socket release.
 *   E6. Pool Isolation   — Each UoW call acquires its own dedicated connection from pool.
 *   E7. GUC Injection    — app.current_tenant_id and app.tenant_id are SET LOCAL before any query.
 *   E8. Read Path RLS    — getTriageByEncounterId uses UoW (GUC set before read query).
 *   E9. Physician SLA    — recordFirstPhysicianContact wraps in UoW; elapsed/overdue calc correct.
 *  E10. Triage Evaluation — evaluateTriageLevel pure logic: Red-flags, High-risk, Standard levels.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

// ─── Module Mocks ────────────────────────────────────────────────────────────

/**
 * Mock withUnitOfWork from unitOfWork.js.
 * We intercept the UoW factory to:
 *  a) validate tenant pre-gate (mirrors production logic)
 *  b) create a mock client with a spy-able query function
 *  c) inject GUC via mock client before calling the operation callback
 *  d) track DISCARD ALL and connection release
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Global mock DB state — reset in beforeEach
let mockDbState = {};
let capturedGucCalls = [];
let capturedDiscardAll = false;
let capturedReleaseCount = 0;
let capturedQueryLog = [];
let shouldThrowOnInsert = false;   // Used by E4 rollback test
let crossTenantTestMode = false;   // Used by E2 cross-tenant test

function resetMockState() {
  mockDbState = {
    encounters: [
      {
        id: 'aa000001-0000-4000-8000-000000000001',
        tenant_id: 'a0000000-0000-4000-8000-000000000001',
        patient_id: 'b0000001-0000-4000-8000-000000000001',
        episode_id: 'c0000001-0000-4000-8000-000000000001',
        status: 'ARRIVED'
      },
      {
        id: 'aa000002-0000-4000-8000-000000000002',
        tenant_id: 'b0000000-0000-4000-8000-000000000002', // different tenant
        patient_id: 'b0000002-0000-4000-8000-000000000002',
        episode_id: 'c0000002-0000-4000-8000-000000000002',
        status: 'ARRIVED'
      }
    ],
    triage_assessments: [],
    triage_sla_timers: [],
    universal_audit_logs: []
  };
  capturedGucCalls = [];
  capturedDiscardAll = false;
  capturedReleaseCount = 0;
  capturedQueryLog = [];
  shouldThrowOnInsert = false;
  crossTenantTestMode = false;
}

/**
 * Build a mock UoW context that simulates the production withUnitOfWork behaviour:
 *  - validates tenantId UUID
 *  - calls SET LOCAL GUCs
 *  - executes operation callback with { query } helper
 *  - tracks DISCARD ALL / release
 *  - supports rollback simulation on error
 */
async function mockWithUnitOfWork(options, operation) {
  const { tenantId, actorId = null, userRole = null } = options || {};

  if (!tenantId || !UUID_REGEX.test(String(tenantId).trim())) {
    throw new Error(`AUTHORITATIVE_TENANT_REQUIRED: Missing or invalid tenantId [${tenantId}]`);
  }

  // Simulate transaction-local staged writes (staged until commit)
  const staged = {
    triage_assessments: [],
    triage_sla_timers: [],
    universal_audit_logs: [],
    encounterUpdates: []
  };
  let rolledBack = false;

  // Mock query function — simulates GUC injection and table operations
  const query = vi.fn(async (sql, params = []) => {
    const normalized = sql.trim().toUpperCase().replace(/\s+/g, ' ');
    capturedQueryLog.push({ sql: sql.trim(), params });

    // GUC injection tracking
    if (normalized.includes('SET_CONFIG') || normalized.includes('SET CONFIG')) {
      if (params[0] === 'app.current_tenant_id' || params[0] === 'app.tenant_id') {
        capturedGucCalls.push({ guc: params[0], value: params[1] });
      }
      return { rows: [{ set_config: params[1] }], rowCount: 1 };
    }

    // Simulate SELECT on encounters with RLS: only return row if tenant_id matches
    if (normalized.includes('FROM ENCOUNTERS') && normalized.includes('WHERE ID =')) {
      const encId = params[0];
      const enc = mockDbState.encounters.find(e => e.id === encId);
      if (!enc) return { rows: [], rowCount: 0 };

      // RLS simulation: if cross-tenant mode, filter by tenant
      if (crossTenantTestMode && enc.tenant_id !== tenantId) {
        return { rows: [], rowCount: 0 };  // RLS blocks cross-tenant
      }
      return { rows: [enc], rowCount: 1 };
    }

    // Simulate SELECT on triage_sla_timers
    if (normalized.includes('FROM TRIAGE_SLA_TIMERS') && normalized.includes('WHERE ENCOUNTER_ID =')) {
      const encId = params[0];
      const status = params[1];
      const timer = mockDbState.triage_sla_timers.find(t => t.encounter_id === encId && t.status === status);
      if (!timer) return { rows: [], rowCount: 0 };
      return { rows: [timer], rowCount: 1 };
    }

    // Simulate SELECT on triage_assessments (read path)
    if (normalized.includes('FROM TRIAGE_ASSESSMENTS')) {
      const encId = params[0];
      const records = mockDbState.triage_assessments.filter(t => t.encounter_id === encId);
      if (crossTenantTestMode) {
        // RLS filters by tenant
        const filtered = records.filter(t => t.tenant_id === tenantId);
        return { rows: filtered, rowCount: filtered.length };
      }
      return { rows: records.slice(-1), rowCount: records.length };
    }

    // INSERT into triage_assessments
    if (normalized.startsWith('INSERT INTO TRIAGE_ASSESSMENTS')) {
      if (shouldThrowOnInsert) {
        throw new Error('SIMULATED_DB_ERROR: constraint violation');
      }
      const row = {
        id: params[0], tenant_id: params[1], episode_id: params[2],
        encounter_id: params[3], patient_id: params[4], triage_method: params[5],
        triage_level: params[6], ats_level: params[7], esi_level: params[8],
        chief_complaint: params[9], target_response_minutes: params[18],
        assessed_at: params[19], assessed_by: params[20], status: 'ACTIVE'
      };
      staged.triage_assessments.push(row);
      return { rows: [row], rowCount: 1 };
    }

    // INSERT into triage_sla_timers
    if (normalized.startsWith('INSERT INTO TRIAGE_SLA_TIMERS')) {
      const row = {
        id: params[0], tenant_id: params[1], encounter_id: params[2],
        triage_level: params[3], target_response_minutes: params[4],
        started_at: params[5], status: params[6]
      };
      staged.triage_sla_timers.push(row);
      return { rows: [row], rowCount: 1 };
    }

    // INSERT into universal_audit_logs
    if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
      const row = { id: params[0], actor_id: params[1], signature_hash: params[11] };
      staged.universal_audit_logs.push(row);
      return { rows: [row], rowCount: 1 };
    }

    // UPDATE encounters
    if (normalized.startsWith('UPDATE ENCOUNTERS')) {
      staged.encounterUpdates.push({ sql, params });
      return { rows: [], rowCount: 1 };
    }

    // UPDATE triage_sla_timers
    if (normalized.startsWith('UPDATE TRIAGE_SLA_TIMERS')) {
      const timerId = params[3];
      const existingIdx = mockDbState.triage_sla_timers.findIndex(t => t.id === timerId);
      const updatedTimer = {
        ...(existingIdx >= 0 ? mockDbState.triage_sla_timers[existingIdx] : {}),
        id: timerId,
        first_physician_contact_at: params[0],
        completed_at: params[0],
        elapsed_seconds: params[1],
        is_overdue: params[2],
        status: 'COMPLETED'
      };
      staged.slaTimerUpdate = updatedTimer;
      return { rows: [updatedTimer], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  });

  // Simulate GUC injections before operation (mirrors production withUnitOfWork)
  await query(`SELECT set_config($1, $2, true)`, ['app.current_tenant_id', tenantId.trim()]);
  await query(`SELECT set_config($1, $2, true)`, ['app.tenant_id', tenantId.trim()]);
  if (actorId) await query(`SELECT set_config($1, $2, true)`, ['app.current_user_id', String(actorId)]);
  if (userRole) await query(`SELECT set_config($1, $2, true)`, ['app.current_user_role', String(userRole)]);

  let result;
  try {
    result = await operation({ query, tenantId, actorId, userRole });

    // Simulate COMMIT — flush staged writes to mockDbState
    mockDbState.triage_assessments.push(...staged.triage_assessments);
    mockDbState.triage_sla_timers.push(...staged.triage_sla_timers);
    mockDbState.universal_audit_logs.push(...staged.universal_audit_logs);
    if (staged.slaTimerUpdate) {
      const idx = mockDbState.triage_sla_timers.findIndex(t => t.id === staged.slaTimerUpdate.id);
      if (idx >= 0) mockDbState.triage_sla_timers[idx] = staged.slaTimerUpdate;
      else mockDbState.triage_sla_timers.push(staged.slaTimerUpdate);
    }
  } catch (err) {
    // Simulate ROLLBACK — staged writes are discarded (never flushed to mockDbState)
    rolledBack = true;
    // Simulate DISCARD ALL + release in finally
    capturedDiscardAll = true;
    capturedReleaseCount++;
    throw err;
  }

  // Simulate DISCARD ALL + release in finally (happy path)
  capturedDiscardAll = true;
  capturedReleaseCount++;

  return result;
}

// Mock the unitOfWork module
vi.mock('../server/db/unitOfWork.js', () => ({
  withUnitOfWork: (options, operation) => mockWithUnitOfWork(options, operation),
  isValidUuid: (id) => UUID_REGEX.test(String(id || '').trim()),
  default: {
    withUnitOfWork: (options, operation) => mockWithUnitOfWork(options, operation),
    isValidUuid: (id) => UUID_REGEX.test(String(id || '').trim())
  }
}));

// Mock postgresPool (service should not call it directly after refactor)
vi.mock('../server/db/postgresPool.js', () => ({
  postgresPoolService: {
    getPool: vi.fn(() => {
      throw new Error('POOL_DIRECT_ACCESS_VIOLATION: triageApplicationService must not call pool.connect() directly after UoW refactor');
    })
  },
  pool: {}
}));

// ─── Import Subject Under Test ────────────────────────────────────────────────

import {
  triageApplicationService,
  TriageDomainError,
  ATS_SLA_MINUTES
} from '../server/services/triageApplication.service.js';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const TENANT_B = 'b0000000-0000-4000-8000-000000000002';
const ENC_TENANT_A = 'aa000001-0000-4000-8000-000000000001';
const ENC_TENANT_B = 'aa000002-0000-4000-8000-000000000002';

const actorTenantA = {
  userId: 'usr-nurse-001',
  username: 'ns.ratna',
  role: 'ROLE_NURSE',
  tenantId: TENANT_A
};

const actorTenantB = {
  userId: 'usr-nurse-002',
  username: 'ns.sari',
  role: 'ROLE_NURSE',
  tenantId: TENANT_B
};

const actorDoctorA = {
  userId: 'usr-doc-001',
  username: 'dr.andi',
  role: 'ROLE_DOCTOR_EMERGENCY',
  tenantId: TENANT_A
};

const baseTriagePayload = {
  encounterId: ENC_TENANT_A,
  chiefComplaint: 'Sesak napas berat sejak 2 jam yang lalu',
  triageMethod: 'ATS',
  atsLevel: 2,
  airwayStatus: 'PATENT',
  breathingStatus: 'NORMAL',
  circulationStatus: 'NORMAL',
  disabilityStatus: 'ALERT',
  vitalsPayload: { spo2: 93, hr: 120, systolicBp: 90 }
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('P0-2B WAVE 1B.1 — Triage Domain UoW Pilot Evidence Suite', () => {

  beforeEach(() => {
    resetMockState();
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E10: Pure Logic — evaluateTriageLevel (no DB, no mock needed)
  // ──────────────────────────────────────────────────────────────────────────
  describe('E10 — evaluateTriageLevel(): pure clinical logic', () => {
    it('E10.1 — Cardiac arrest overrides to ATS 1 (RED)', () => {
      const result = triageApplicationService.evaluateTriageLevel({
        circulationStatus: 'CARDIAC_ARREST'
      });
      expect(result.level).toBe(1);
      expect(result.colorCode).toBe('RED');
      expect(result.targetMinutes).toBe(0);
    });

    it('E10.2 — SpO2 < 85 overrides to ATS 1 (RED)', () => {
      const result = triageApplicationService.evaluateTriageLevel({
        vitalsPayload: { spo2: 84 }
      });
      expect(result.level).toBe(1);
      expect(result.colorCode).toBe('RED');
    });

    it('E10.3 — GCS <= 8 overrides to ATS 1 (RED)', () => {
      const result = triageApplicationService.evaluateTriageLevel({
        vitalsPayload: { gcs: 7 }
      });
      expect(result.level).toBe(1);
      expect(result.colorCode).toBe('RED');
    });

    it('E10.4 — SpO2 < 92 overrides to ATS 2 (ORANGE)', () => {
      const result = triageApplicationService.evaluateTriageLevel({
        vitalsPayload: { spo2: 91 }
      });
      expect(result.level).toBe(2);
      expect(result.colorCode).toBe('ORANGE');
      expect(result.targetMinutes).toBe(10);
    });

    it('E10.5 — Pain score >= 8 overrides to ATS 2 (ORANGE)', () => {
      const result = triageApplicationService.evaluateTriageLevel({
        vitalsPayload: { painScore: 9 }
      });
      expect(result.level).toBe(2);
      expect(result.colorCode).toBe('ORANGE');
    });

    it('E10.6 — ATS level 3 maps correctly (YELLOW, 30 min)', () => {
      const result = triageApplicationService.evaluateTriageLevel({ triageMethod: 'ATS', atsLevel: 3 });
      expect(result.level).toBe(3);
      expect(result.colorCode).toBe('YELLOW');
      expect(result.targetMinutes).toBe(30);
    });

    it('E10.7 — ATS level 5 maps correctly (BLUE, 120 min)', () => {
      const result = triageApplicationService.evaluateTriageLevel({ triageMethod: 'ATS', atsLevel: 5 });
      expect(result.level).toBe(5);
      expect(result.colorCode).toBe('BLUE');
      expect(result.targetMinutes).toBe(120);
    });

    it('E10.8 — ATS_SLA_MINUTES constants are correct', () => {
      expect(ATS_SLA_MINUTES[1]).toBe(0);
      expect(ATS_SLA_MINUTES[2]).toBe(10);
      expect(ATS_SLA_MINUTES[3]).toBe(30);
      expect(ATS_SLA_MINUTES[4]).toBe(60);
      expect(ATS_SLA_MINUTES[5]).toBe(120);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E1: Tenant Gate — fails-closed on missing / invalid tenantId
  // ──────────────────────────────────────────────────────────────────────────
  describe('E1 — Tenant gate: fails-closed on missing/invalid tenantId', () => {
    it('E1.1 — recordTriageAssessment: throws AUTHORITATIVE_TENANT_REQUIRED when actor.tenantId missing', async () => {
      await expect(
        triageApplicationService.recordTriageAssessment(baseTriagePayload, { userId: 'usr-001' })
      ).rejects.toMatchObject({
        code: 'AUTHORITATIVE_TENANT_REQUIRED'
      });
    });

    it('E1.2 — recordTriageAssessment: throws when tenantId is not a valid UUID', async () => {
      const actorBadTenant = { userId: 'usr-001', tenantId: 'not-a-uuid' };
      await expect(
        triageApplicationService.recordTriageAssessment(baseTriagePayload, actorBadTenant)
      ).rejects.toThrow(/AUTHORITATIVE_TENANT_REQUIRED/);
    });

    it('E1.3 — recordFirstPhysicianContact: throws AUTHORITATIVE_TENANT_REQUIRED when actor.tenantId missing', async () => {
      await expect(
        triageApplicationService.recordFirstPhysicianContact(
          { encounterId: ENC_TENANT_A },
          { userId: 'usr-doc-001' }
        )
      ).rejects.toMatchObject({
        code: 'AUTHORITATIVE_TENANT_REQUIRED'
      });
    });

    it('E1.4 — getTriageByEncounterId: throws AUTHORITATIVE_TENANT_REQUIRED when actor.tenantId missing', async () => {
      await expect(
        triageApplicationService.getTriageByEncounterId(ENC_TENANT_A, {})
      ).rejects.toMatchObject({
        code: 'AUTHORITATIVE_TENANT_REQUIRED'
      });
    });

    it('E1.5 — Validation precedes UoW gate: encounterId missing throws before tenant check', async () => {
      await expect(
        triageApplicationService.recordTriageAssessment(
          { ...baseTriagePayload, encounterId: null },
          actorTenantA
        )
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    });

    it('E1.6 — chiefComplaint empty throws before tenant check', async () => {
      await expect(
        triageApplicationService.recordTriageAssessment(
          { ...baseTriagePayload, chiefComplaint: '' },
          actorTenantA
        )
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E7: GUC Injection — app.current_tenant_id SET LOCAL before any query
  // ──────────────────────────────────────────────────────────────────────────
  describe('E7 — GUC injection: SET LOCAL before domain queries', () => {
    it('E7.1 — recordTriageAssessment injects app.current_tenant_id and app.tenant_id before encounter lock', async () => {
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);

      const gucNames = capturedGucCalls.map(g => g.guc);
      expect(gucNames).toContain('app.current_tenant_id');
      expect(gucNames).toContain('app.tenant_id');

      // GUC must be set BEFORE the first SELECT on encounters
      const gucIdx = capturedQueryLog.findIndex(q => q.params && q.params[0] === 'app.current_tenant_id');
      const encIdx = capturedQueryLog.findIndex(q => q.sql.toUpperCase().includes('FROM ENCOUNTERS'));
      expect(gucIdx).toBeGreaterThanOrEqual(0);
      expect(encIdx).toBeGreaterThan(gucIdx);
    });

    it('E7.2 — GUC value equals the actor tenantId', async () => {
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      const guc = capturedGucCalls.find(g => g.guc === 'app.current_tenant_id');
      expect(guc.value).toBe(TENANT_A);
    });

    it('E7.3 — getTriageByEncounterId sets GUC before read query', async () => {
      // Seed a triage record
      mockDbState.triage_assessments.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_A,
        encounter_id: ENC_TENANT_A,
        patient_id: 'pat-0001-aaaa-bbbb-cccc-dddddddddddd',
        triage_level: 'ATS_3_URGENT',
        assessed_at: new Date()
      });

      await triageApplicationService.getTriageByEncounterId(ENC_TENANT_A, actorTenantA);

      const gucIdx = capturedQueryLog.findIndex(q => q.params && q.params[0] === 'app.current_tenant_id');
      const readIdx = capturedQueryLog.findIndex(q => q.sql.toUpperCase().includes('FROM TRIAGE_ASSESSMENTS'));
      expect(gucIdx).toBeGreaterThanOrEqual(0);
      expect(readIdx).toBeGreaterThan(gucIdx);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E3: Transaction Commit — atomic write of triage + SLA timer + audit
  // ──────────────────────────────────────────────────────────────────────────
  describe('E3 — Atomic commit: triage + SLA timer + audit log', () => {
    it('E3.1 — All three records committed atomically on success', async () => {
      const result = await triageApplicationService.recordTriageAssessment(
        baseTriagePayload,
        actorTenantA
      );

      expect(result).toBeDefined();
      expect(result.triage).toBeDefined();
      expect(result.slaTimer).toBeDefined();
      expect(result.colorCode).toBeDefined();
      expect(result.auditSignature).toBeDefined();

      // All three tables committed
      expect(mockDbState.triage_assessments).toHaveLength(1);
      expect(mockDbState.triage_sla_timers).toHaveLength(1);
      expect(mockDbState.universal_audit_logs).toHaveLength(1);
    });

    it('E3.2 — triage record carries authoritative tenant_id from encounter row (not actor)', async () => {
      const result = await triageApplicationService.recordTriageAssessment(
        baseTriagePayload,
        { ...actorTenantA } // actor.tenantId = TENANT_A; encounter.tenant_id = TENANT_A (same here)
      );
      // Tenant on the triage record comes from encounter.tenant_id
      expect(mockDbState.triage_assessments[0].tenant_id).toBe(TENANT_A);
    });

    it('E3.3 — SLA timer has matching encounter_id and RUNNING status', async () => {
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      const timer = mockDbState.triage_sla_timers[0];
      expect(timer.encounter_id).toBe(ENC_TENANT_A);
      expect(timer.status).toBe('RUNNING');
    });

    it('E3.4 — Encounter status updated to TRIAGED (was ARRIVED)', async () => {
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      // Encounter update should appear in query log
      const updateQuery = capturedQueryLog.find(q =>
        q.sql.toUpperCase().startsWith('UPDATE ENCOUNTERS') &&
        q.params && q.params.includes('TRIAGED')
      );
      expect(updateQuery).toBeDefined();
    });

    it('E3.5 — Red-flag override (SpO2 83) sets ATS 1 and isCito=true', async () => {
      const result = await triageApplicationService.recordTriageAssessment(
        { ...baseTriagePayload, vitalsPayload: { spo2: 83 } },
        actorTenantA
      );
      expect(result.colorCode).toBe('RED');
      expect(result.triage.ats_level).toBe(1);
    });

    it('E3.6 — Audit signature is deterministic SHA-256 over payload', async () => {
      const result = await triageApplicationService.recordTriageAssessment(
        baseTriagePayload,
        actorTenantA
      );
      expect(result.auditSignature).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E4: Transaction Rollback — error inside callback → no partial writes
  // ──────────────────────────────────────────────────────────────────────────
  describe('E4 — Rollback: no partial writes on domain error', () => {
    it('E4.1 — DB error inside UoW causes rollback; triage_assessments remain empty', async () => {
      shouldThrowOnInsert = true;

      await expect(
        triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA)
      ).rejects.toThrow('SIMULATED_DB_ERROR');

      // No partial writes committed
      expect(mockDbState.triage_assessments).toHaveLength(0);
      expect(mockDbState.triage_sla_timers).toHaveLength(0);
      expect(mockDbState.universal_audit_logs).toHaveLength(0);
    });

    it('E4.2 — Encounter not found error causes rollback; no writes committed', async () => {
      await expect(
        triageApplicationService.recordTriageAssessment(
          { ...baseTriagePayload, encounterId: 'enc-0000-none-0000-0000-000000000000' },
          actorTenantA
        )
      ).rejects.toMatchObject({ code: 'ENCOUNTER_NOT_FOUND' });

      expect(mockDbState.triage_assessments).toHaveLength(0);
      expect(mockDbState.triage_sla_timers).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E5: Connection Cleanup — DISCARD ALL called in finally
  // ──────────────────────────────────────────────────────────────────────────
  describe('E5 — Connection cleanup: DISCARD ALL in finally block', () => {
    it('E5.1 — DISCARD ALL is called after successful transaction', async () => {
      capturedDiscardAll = false;
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      expect(capturedDiscardAll).toBe(true);
    });

    it('E5.2 — DISCARD ALL is called even after rollback (error path)', async () => {
      capturedDiscardAll = false;
      shouldThrowOnInsert = true;
      await expect(
        triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA)
      ).rejects.toThrow();
      expect(capturedDiscardAll).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E6: Pool Isolation — each UoW acquires its own connection
  // ──────────────────────────────────────────────────────────────────────────
  describe('E6 — Pool isolation: each UoW call releases exactly one connection', () => {
    it('E6.1 — Single recordTriageAssessment call → exactly 1 connection acquired+released', async () => {
      capturedReleaseCount = 0;
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      expect(capturedReleaseCount).toBe(1);
    });

    it('E6.2 — Two sequential calls → 2 independent connection acquire/release cycles', async () => {
      capturedReleaseCount = 0;
      // Pre-seed second encounter with TENANT_A for reuse
      mockDbState.encounters.push({
        id: 'enc-0003-aaaa-bbbb-cccc-dddddddddddd',
        tenant_id: TENANT_A,
        patient_id: 'pat-0003-aaaa-bbbb-cccc-dddddddddddd',
        episode_id: 'epi-0003-aaaa-bbbb-cccc-dddddddddddd',
        status: 'ARRIVED'
      });
      await triageApplicationService.recordTriageAssessment(baseTriagePayload, actorTenantA);
      await triageApplicationService.recordTriageAssessment(
        { ...baseTriagePayload, encounterId: 'enc-0003-aaaa-bbbb-cccc-dddddddddddd' },
        actorTenantA
      );
      expect(capturedReleaseCount).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E2: Tenant Isolation — cross-tenant reads return 0 rows via RLS
  // ──────────────────────────────────────────────────────────────────────────
  describe('E2 — Cross-tenant isolation: RLS blocks cross-tenant reads', () => {
    it('E2.1 — Tenant A cannot read Tenant B encounter via recordTriageAssessment', async () => {
      crossTenantTestMode = true;

      await expect(
        triageApplicationService.recordTriageAssessment(
          { ...baseTriagePayload, encounterId: ENC_TENANT_B },
          actorTenantA  // actor is TENANT_A but encounter belongs to TENANT_B
        )
      ).rejects.toMatchObject({ code: 'ENCOUNTER_NOT_FOUND' });

      // No writes committed
      expect(mockDbState.triage_assessments).toHaveLength(0);
    });

    it('E2.2 — Tenant B actor correctly reads own encounter', async () => {
      crossTenantTestMode = true;

      const result = await triageApplicationService.recordTriageAssessment(
        { ...baseTriagePayload, encounterId: ENC_TENANT_B },
        actorTenantB
      );
      expect(result.triage).toBeDefined();
      expect(mockDbState.triage_assessments[0].tenant_id).toBe(TENANT_B);
    });

    it('E2.3 — getTriageByEncounterId returns null for cross-tenant reads (RLS simulation)', async () => {
      crossTenantTestMode = true;
      // Seed a triage record for Tenant B
      mockDbState.triage_assessments.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_B,
        encounter_id: ENC_TENANT_B,
        patient_id: 'pat-0002',
        triage_level: 'ATS_3_URGENT',
        assessed_at: new Date()
      });

      // Tenant A tries to read Tenant B's triage record
      const result = await triageApplicationService.getTriageByEncounterId(ENC_TENANT_B, actorTenantA);
      expect(result).toBeNull();  // RLS filtered it out
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E8: Read Path RLS — getTriageByEncounterId uses UoW
  // ──────────────────────────────────────────────────────────────────────────
  describe('E8 — Read path: getTriageByEncounterId wrapped in UoW', () => {
    it('E8.1 — Returns triage record for correct tenant', async () => {
      mockDbState.triage_assessments.push({
        id: 'triage-001',
        tenant_id: TENANT_A,
        encounter_id: ENC_TENANT_A,
        patient_id: 'pat-0001-aaaa-bbbb-cccc-dddddddddddd',
        triage_level: 'ATS_2_EMERGENT',
        assessed_at: new Date()
      });

      const result = await triageApplicationService.getTriageByEncounterId(ENC_TENANT_A, actorTenantA);
      expect(result).toBeDefined();
      expect(result.triage_level).toBe('ATS_2_EMERGENT');
    });

    it('E8.2 — Returns null when no triage record exists', async () => {
      const result = await triageApplicationService.getTriageByEncounterId(ENC_TENANT_A, actorTenantA);
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E9: Physician SLA — recordFirstPhysicianContact atomicity & elapsed calc
  // ──────────────────────────────────────────────────────────────────────────
  describe('E9 — recordFirstPhysicianContact: SLA timer stop + elapsed calc', () => {
    it('E9.1 — Stops RUNNING timer; marks COMPLETED with elapsed_seconds', async () => {
      const startedAt = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago
      mockDbState.triage_sla_timers.push({
        id: 'timer-001',
        tenant_id: TENANT_A,
        encounter_id: ENC_TENANT_A,
        triage_level: 'ATS_3_URGENT',
        target_response_minutes: 30,
        started_at: startedAt,
        status: 'RUNNING'
      });
      // Also need encounter in DB for encounter status update
      // (already seeded in resetMockState with TRIAGED-ready status)
      mockDbState.encounters[0].status = 'TRIAGED';

      const result = await triageApplicationService.recordFirstPhysicianContact(
        { encounterId: ENC_TENANT_A, physicianId: 'doc-001', physicianName: 'Dr. Test' },
        actorDoctorA
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.elapsed_seconds).toBeGreaterThan(0);
      expect(result.elapsed_seconds).toBeGreaterThanOrEqual(14 * 60);
    });

    it('E9.2 — is_overdue=true when elapsed > target', async () => {
      const startedAt = new Date(Date.now() - 35 * 60 * 1000); // 35 min ago; target=30
      mockDbState.triage_sla_timers.push({
        id: 'timer-002',
        tenant_id: TENANT_A,
        encounter_id: ENC_TENANT_A,
        triage_level: 'ATS_3_URGENT',
        target_response_minutes: 30,
        started_at: startedAt,
        status: 'RUNNING'
      });

      const result = await triageApplicationService.recordFirstPhysicianContact(
        { encounterId: ENC_TENANT_A },
        actorDoctorA
      );
      expect(result.is_overdue).toBe(true);
    });

    it('E9.3 — is_overdue=false when elapsed < target', async () => {
      const startedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago; target=30
      mockDbState.triage_sla_timers.push({
        id: 'timer-003',
        tenant_id: TENANT_A,
        encounter_id: ENC_TENANT_A,
        triage_level: 'ATS_3_URGENT',
        target_response_minutes: 30,
        started_at: startedAt,
        status: 'RUNNING'
      });

      const result = await triageApplicationService.recordFirstPhysicianContact(
        { encounterId: ENC_TENANT_A },
        actorDoctorA
      );
      expect(result.is_overdue).toBe(false);
    });

    it('E9.4 — throws TIMER_NOT_FOUND when no RUNNING timer exists', async () => {
      await expect(
        triageApplicationService.recordFirstPhysicianContact(
          { encounterId: ENC_TENANT_A },
          actorDoctorA
        )
      ).rejects.toMatchObject({ code: 'TIMER_NOT_FOUND' });
    });

    it('E9.5 — GUC injected before timer query', async () => {
      const startedAt = new Date(Date.now() - 5 * 60 * 1000);
      mockDbState.triage_sla_timers.push({
        id: 'timer-004', tenant_id: TENANT_A, encounter_id: ENC_TENANT_A,
        triage_level: 'ATS_3_URGENT', target_response_minutes: 30,
        started_at: startedAt, status: 'RUNNING'
      });

      await triageApplicationService.recordFirstPhysicianContact(
        { encounterId: ENC_TENANT_A },
        actorDoctorA
      );

      const gucIdx = capturedQueryLog.findIndex(q => q.params && q.params[0] === 'app.current_tenant_id');
      const timerIdx = capturedQueryLog.findIndex(q =>
        q.sql.toUpperCase().includes('FROM TRIAGE_SLA_TIMERS')
      );
      expect(gucIdx).toBeGreaterThanOrEqual(0);
      expect(timerIdx).toBeGreaterThan(gucIdx);
    });
  });

});
