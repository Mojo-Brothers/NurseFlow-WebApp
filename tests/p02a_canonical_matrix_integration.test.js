import { describe, it, expect, beforeAll, vi } from 'vitest';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { createAuthorizationContext } from '../server/contracts/authorizationContext.contract.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';
import { authorizationDecisionService } from '../server/services/authorizationDecision.service.js';
import { clinicalAuditService } from '../server/services/clinicalAudit.service.js';
import {
  AUTHORIZATION_DECISIONS,
  getPersistableDecisions,
  isDecisionPersistable,
  getDecisionMetadata
} from '../server/contracts/authorizationDecision.contract.js';

describe('P0-2A Canonical Authorization Decision Matrix Integration Suite', () => {
  const TENANT_A = '10000000-0000-0000-0000-000000000001';
  const TENANT_B = '20000000-0000-0000-0000-000000000002';
  const SITI_AUTH_USER_ID = 'd0000000-0000-0000-0000-000000000001';
  const SITI_STAFF_ID = 'c0000000-0000-0000-0000-000000000001';
  const EXPIRED_STAFF_ID = 'c0000000-0000-0000-0000-000000000002';
  const REVOKED_STAFF_ID = 'c0000000-0000-0000-0000-000000000003';
  const INACTIVE_STAFF_ID = 'c0000000-0000-0000-0000-000000000004';

  let pool;

  beforeAll(async () => {
    pool = postgresPoolService.getPool();
  });

  const doctorContext = createAuthorizationContext({
    userId: SITI_AUTH_USER_ID,
    username: 'dr.siti',
    role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
    tenantId: TENANT_A,
    staffId: SITI_STAFF_ID
  });

  const assignedEncounter = {
    id: '00000000-0000-0000-0000-000000000401',
    tenant_id: TENANT_A,
    patient_id: '00000000-0000-0000-0000-000000000001',
    primary_doctor_id: 'DOC-01',
    encounter_class: 'AMB'
  };

  const unassignedEncounter = {
    id: '00000000-0000-0000-0000-000000000402',
    tenant_id: TENANT_A,
    patient_id: '00000000-0000-0000-0000-000000000001',
    primary_doctor_id: 'DOC-B-01',
    encounter_class: 'AMB'
  };

  it('Matrix 1: Master Engine evaluates and persists DENIED_CREDENTIAL_EXPIRED', async () => {
    const expiredDocContext = createAuthorizationContext({
      userId: 'd0000000-0000-0000-0000-000000000002',
      username: 'dr.expired',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: TENANT_A,
      staffId: EXPIRED_STAFF_ID
    });

    const corrId = 'CORR-MATRIX-CRED-EXP-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: expiredDocContext,
      action: 'EMR_WRITE_SOAP',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_CREDENTIAL_EXPIRED');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 2: Master Engine evaluates and persists DENIED_CREDENTIAL_REVOKED', async () => {
    const revokedDocContext = createAuthorizationContext({
      userId: 'd0000000-0000-0000-0000-000000000003',
      username: 'dr.revoked',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: TENANT_A,
      staffId: REVOKED_STAFF_ID
    });

    const corrId = 'CORR-MATRIX-CRED-REV-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: revokedDocContext,
      action: 'EMR_WRITE_SOAP',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_REVOKED);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_CREDENTIAL_REVOKED');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 3: Master Engine evaluates and persists DENIED_CREDENTIAL_MISSING', async () => {
    const uncredentialedContext = createAuthorizationContext({
      userId: 'd0000000-0000-0000-0000-000000000099',
      username: 'dr.nocred',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: TENANT_A,
      staffId: 'c0000000-0000-0000-0000-000000000099'
    });

    const corrId = 'CORR-MATRIX-CRED-MISS-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: uncredentialedContext,
      action: 'EMR_WRITE_SOAP',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_CREDENTIAL_MISSING');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 4: Master Engine evaluates and persists DENIED_STAFF_INACTIVE', async () => {
    const inactiveDocContext = createAuthorizationContext({
      userId: 'd0000000-0000-0000-0000-000000000004',
      username: 'dr.inactive',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: TENANT_A,
      staffId: INACTIVE_STAFF_ID
    });

    const corrId = 'CORR-MATRIX-STAFF-INACT-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: inactiveDocContext,
      action: 'EMR_WRITE_SOAP',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_STAFF_INACTIVE');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 5: Master Engine evaluates and persists DENIED_NO_PRIVILEGE', async () => {
    const corrId = 'CORR-MATRIX-NO-PRIV-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: doctorContext,
      action: 'EMR_WRITE_SOAP',
      procedureCode: 'PROC-UNAUTHORIZED-SURGERY-99',
      targetUnitId: 'POLI_PENYAKIT_DALAM',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_NO_PRIVILEGE');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 6: Master Engine evaluates and persists DENIED_NOT_ATTENDING_PROVIDER', async () => {
    const corrId = 'CORR-MATRIX-NOT-DPJP-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: doctorContext,
      action: 'EMR_WRITE_SOAP',
      resource: unassignedEncounter,
      resourceType: 'ENCOUNTER',
      resourceId: unassignedEncounter.id,
      targetUnitId: 'POLI_PENYAKIT_DALAM',
      requiredCredentialType: 'SIP',
      correlationId: corrId,
      allowBreakTheGlass: false
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_NOT_ATTENDING_PROVIDER);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_NOT_ATTENDING_PROVIDER');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 7: Master Engine evaluates and persists DENIED_TENANT_MISMATCH', async () => {
    const crossTenantEncounter = {
      id: '00000000-0000-0000-0000-000000000499',
      tenant_id: TENANT_B,
      patient_id: '00000000-0000-0000-0000-000000000001',
      primary_doctor_id: 'DOC-01'
    };

    const corrId = 'CORR-MATRIX-TENANT-MISMATCH-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: doctorContext,
      action: 'EMR_WRITE_SOAP',
      resource: crossTenantEncounter,
      resourceType: 'ENCOUNTER',
      resourceId: crossTenantEncounter.id,
      targetUnitId: 'POLI_PENYAKIT_DALAM',
      requiredCredentialType: 'SIP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_TENANT_MISMATCH);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_TENANT_MISMATCH');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 8: Master Engine evaluates and persists DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION', async () => {
    const adminContext = createAuthorizationContext({
      userId: 'd0000000-0000-0000-0000-000000000005',
      username: 'super.admin',
      role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN,
      tenantId: TENANT_A
    });

    const corrId = 'CORR-MATRIX-ADMIN-RESTRICT-' + Date.now();
    const result = await authorizationDecisionService.evaluateAuthorization({
      context: adminContext,
      action: 'EMR_WRITE_SOAP',
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 9: Master Engine evaluates and persists DENIED_SEPARATION_OF_DUTIES', async () => {
    const selfPrescriptionOrder = {
      id: '00000000-0000-0000-0000-000000000502',
      tenant_id: TENANT_A,
      ordering_doctor_id: SITI_AUTH_USER_ID,
      order_type: 'PHARMACY'
    };

    const corrId = 'CORR-MATRIX-SOD-' + Date.now();
    const dualRoleContext = createAuthorizationContext({
      userId: SITI_AUTH_USER_ID,
      username: 'dr.siti.dual',
      roles: [ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, ENTERPRISE_ROLES.ROLE_PHARMACIST],
      tenantId: TENANT_A,
      staffId: SITI_STAFF_ID
    });

    const result = await authorizationDecisionService.evaluateAuthorization({
      context: dualRoleContext,
      action: 'PHARMACY_DISPENSE',
      resource: selfPrescriptionOrder,
      resourceType: 'ORDER',
      resourceId: selfPrescriptionOrder.id,
      correlationId: corrId
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.decision).toBe(AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES);

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT authorization_decision, is_authorized FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].authorization_decision).toBe('DENIED_SEPARATION_OF_DUTIES');
      expect(res.rows[0].is_authorized).toBe(false);
    } finally {
      client.release();
    }
  });

  it('Matrix 10: PostgreSQL Accepts 100% of all 23 persistable canonical decisions in clinical_authorization_logs', async () => {
    const persistable = getPersistableDecisions();
    expect(persistable.length).toBe(23);

    const client = await pool.connect();
    try {
      for (const dec of persistable) {
        const testCorrId = 'CORR-CANONICAL-AUDIT-' + dec + '-' + Date.now();
        const auditRow = await clinicalAuditService.logAuthorizationDecision({
          tenantId: TENANT_A,
          userId: SITI_AUTH_USER_ID,
          actionCode: 'CANONICAL_ACCEPTANCE_TEST',
          isAuthorized: dec.startsWith('AUTHORIZED'),
          decision: dec,
          correlationId: testCorrId
        });

        expect(auditRow).toBeDefined();
        expect(auditRow.id).toBeDefined();

        const verifyRes = await client.query(
          'SELECT authorization_decision FROM clinical_authorization_logs WHERE id = $1',
          [auditRow.id]
        );
        expect(verifyRes.rows.length).toBe(1);
        expect(verifyRes.rows[0].authorization_decision).toBe(dec);
      }
    } finally {
      client.release();
    }
  });

  it('Matrix 11: Safety State DENIED_AUDIT_PERSISTENCE_FAILURE is non-persistable and returns null without DB insert', async () => {
    const corrId = 'CORR-SAFETY-SKIP-' + Date.now();
    const auditResult = await clinicalAuditService.logAuthorizationDecision({
      tenantId: TENANT_A,
      userId: SITI_AUTH_USER_ID,
      actionCode: 'TEST_SAFETY_SKIP',
      isAuthorized: false,
      decision: AUTHORIZATION_DECISIONS.DENIED_AUDIT_PERSISTENCE_FAILURE,
      correlationId: corrId
    });

    expect(auditResult).toBeNull();

    const client = await pool.connect();
    try {
      const verifyRes = await client.query(
        'SELECT id FROM clinical_authorization_logs WHERE correlation_id = $1',
        [corrId]
      );
      expect(verifyRes.rows.length).toBe(0);
    } finally {
      client.release();
    }
  });
});
