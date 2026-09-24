/**
 * NurseFlow Enterprise HIS 2026 — P0-2A Authorization Foundation Verification Suite
 * Standards: ISO 27001 Multi-Tenancy Isolation, JCI MOI / KARS KPS & NIST SP 800-162 ABAC
 * 
 * Verifies all 8 Core Dimensions of the Canonical Authorization Foundation:
 * 1. Server-Authoritative Tenant Boundary & Anti-Spoofing
 * 2. Super Administrator Hardening (System Admin != Clinical Authority)
 * 3. Clinical Licensure (SIP/STR) Runtime Validation
 * 4. Enterprise Role & Granular Permission Enforcement
 * 5. Resource Ownership & Care-Team Context Access
 * 6. Clinical Separation of Duties (SoD) & Four-Eyes Principle
 * 7. Deterministic Fail-Closed Semantics
 * 8. Production JWT Secret Boundary & Startup Validation
 * 9. Forensic Audit Trail Persistence & Metadata Redaction
 */

/* global process */
import { describe, it, expect, vi } from 'vitest';
import { createAuthorizationContext } from '../server/contracts/authorizationContext.contract.js';
import { assertResourceTenant } from '../server/middlewares/tenantMiddleware.js';
import { rbacGuardService } from '../src/core/security/rbacGuard.service.js';
import { ENTERPRISE_ROLES, CLINICAL_PERMISSIONS, isClinicalPermission } from '../src/shared/constants/roles.js';
import { clinicalCredentialService } from '../server/services/clinicalCredential.service.js';
import { resourceAuthorizationService } from '../server/services/resourceAuthorization.service.js';
import { separationOfDutiesService } from '../server/services/separationOfDuties.service.js';
import { authorizationDecisionService } from '../server/services/authorizationDecision.service.js';
import { clinicalAuditService } from '../server/services/clinicalAudit.service.js';
import { getJwtSecret } from '../src/core/security/jwtSecurity.service.js';
import { validateEnvironment } from '../server/config/envValidator.js';

describe('P0-2A — Authorization Foundation Remediation Verification', () => {

  const TENANT_A = '10000000-0000-0000-0000-000000000001';
  const TENANT_B = '20000000-0000-0000-0000-000000000002';
  const DOCTOR_USER_ID = 'd0000000-0000-0000-0000-000000000001';
  const DOCTOR_STAFF_ID = 'c0000000-0000-0000-0000-000000000001';
  const ADMIN_USER_ID = '55555555-5555-5555-5555-555555555555';

  // ─── 1. TENANT CONTEXT & ANTI-SPOOFING TESTS ───
  describe('Dimension 1: Tenant Context Foundation & Anti-Spoofing', () => {
    it('should build valid AuthorizationContext when authenticated user has valid tenant', () => {
      const payload = {
        userId: DOCTOR_USER_ID,
        username: 'dr.gatot',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
        tenantId: TENANT_A,
        staffId: DOCTOR_STAFF_ID
      };

      const ctx = createAuthorizationContext(payload);
      expect(ctx.actorId).toBe(DOCTOR_USER_ID);
      expect(ctx.tenantId).toBe(TENANT_A);
      expect(ctx.roles).toContain(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP);
      expect(ctx.isClinicalActor).toBe(true);
      expect(ctx.isSuperAdmin).toBe(false);
    });

    it('should REJECT context creation if tenantId is missing or invalid UUID (Rule 4: Zero Fallback)', () => {
      const payloadMissingTenant = {
        userId: DOCTOR_USER_ID,
        username: 'dr.gatot',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      };

      expect(() => createAuthorizationContext(payloadMissingTenant)).toThrowError(/Invalid or missing server-verified tenantId/);

      const payloadInvalidUUID = {
        userId: DOCTOR_USER_ID,
        username: 'dr.gatot',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
        tenantId: 'not-a-valid-uuid'
      };

      expect(() => createAuthorizationContext(payloadInvalidUUID)).toThrowError(/Invalid or missing server-verified tenantId/);
    });

    it('should DENY request if client sends X-Tenant-ID header conflicting with server token (Anti-Spoofing)', () => {
      const payload = {
        userId: DOCTOR_USER_ID,
        tenantId: TENANT_A,
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      };

      const fakeReq = {
        headers: { 'x-tenant-id': TENANT_B }
      };

      expect(() => createAuthorizationContext(payload, fakeReq)).toThrowError(/TENANT_SPOOFING_ATTEMPT/);
    });

    it('should DENY request if client sends body tenantId conflicting with server token (Anti-Spoofing)', () => {
      const payload = {
        userId: DOCTOR_USER_ID,
        tenantId: TENANT_A,
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      };

      const fakeReq = {
        headers: {},
        body: { tenantId: TENANT_B }
      };

      expect(() => createAuthorizationContext(payload, fakeReq)).toThrowError(/TENANT_SPOOFING_ATTEMPT/);
    });

    it('should assert cross-tenant resource access as DENIED (assertResourceTenant)', () => {
      expect(() => assertResourceTenant(TENANT_A, TENANT_B)).toThrowError(/CROSS_TENANT_VIOLATION/);
      expect(assertResourceTenant(TENANT_A, TENANT_A)).toBe(true);
    });
  });

  // ─── 2. SUPER ADMIN HARDENING TESTS ───
  describe('Dimension 2: Super Administrator Hardening (System Admin != Clinical Authority)', () => {
    it('should classify clinical permissions accurately', () => {
      expect(isClinicalPermission('CPOE_ORDER_CREATE')).toBe(true);
      expect(isClinicalPermission('EMR_WRITE_SOAP')).toBe(true);
      expect(isClinicalPermission('MEDICATION_ADMINISTER')).toBe(true);
      expect(isClinicalPermission('PHARMACY_DISPENSE')).toBe(true);
      expect(isClinicalPermission('LAB_RESULT_VALIDATE')).toBe(true);
      expect(isClinicalPermission('SYSTEM_CONFIG')).toBe(false);
      expect(isClinicalPermission('USER_PROVISION')).toBe(false);
    });

    it('should NOT allow Super Admin wildcard (*) to match clinical permissions', () => {
      // Super Admin role has permissions: ['*'] in matrix
      const adminRole = ENTERPRISE_ROLES.ROLE_SUPER_ADMIN;

      // Clinical actions MUST be denied
      expect(rbacGuardService.hasPermission(adminRole, 'CPOE_ORDER_CREATE')).toBe(false);
      expect(rbacGuardService.hasPermission(adminRole, 'EMR_WRITE_SOAP')).toBe(false);
      expect(rbacGuardService.hasPermission(adminRole, 'MEDICATION_ADMINISTER')).toBe(false);
      expect(rbacGuardService.hasPermission(adminRole, 'PHARMACY_DISPENSE')).toBe(false);
      expect(rbacGuardService.hasPermission(adminRole, 'LAB_RESULT_VALIDATE')).toBe(false);

      // Administrative actions MUST still be allowed
      expect(rbacGuardService.hasPermission(adminRole, 'SYSTEM_CONFIG')).toBe(true);
      expect(rbacGuardService.hasPermission(adminRole, 'USER_PROVISION')).toBe(true);
    });

    it('should explicitly DENY Super Admin in evaluateAuthorization with DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION', async () => {
      const adminContext = createAuthorizationContext({
        userId: ADMIN_USER_ID,
        username: 'super.admin',
        roles: [ENTERPRISE_ROLES.ROLE_SUPER_ADMIN],
        tenantId: TENANT_A
      });

      const decision = await authorizationDecisionService.evaluateAuthorization({
        context: adminContext,
        action: 'CPOE_ORDER_CREATE'
      });

      expect(decision.isAuthorized).toBe(false);
      expect(decision.decision).toBe('DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION');
      expect(decision.reason).toContain('System administrators do not possess clinical practice authority');
    });
  });

  // ─── 3. CLINICAL CREDENTIAL (SIP/STR) TESTS ───
  describe('Dimension 3: Runtime Clinical Credential & Licensure Verification (SIP/STR)', () => {
    it('should return DENIED_CREDENTIAL_MISSING if clinician has no registered credential', async () => {
      // Mock verifyCredential directly for isolated unit testing
      const result = await clinicalCredentialService.verifyCredential({
        staffId: 'non-existent-staff-uuid',
        tenantId: TENANT_A,
        credentialType: 'SIP'
      });

      expect(result.isEligible).toBe(false);
      expect(['DENIED_CREDENTIAL_MISSING', 'DENIED_STAFF_INACTIVE']).toContain(result.decision);
    });

    it('should accurately detect expired credentials against database records', async () => {
      // dr. Expired Licensure (c0000000-0000-0000-0000-000000000002) in tenant 10000000-0000-0000-0000-000000000001
      const expiredStaffId = 'c0000000-0000-0000-0000-000000000002';
      const liveTenantId = '10000000-0000-0000-0000-000000000001';

      const res = await clinicalCredentialService.verifyCredential({
        staffId: expiredStaffId,
        tenantId: liveTenantId,
        credentialType: 'SIP',
        evaluationDate: new Date('2026-09-24')
      });

      expect(res.isEligible).toBe(false);
      expect(res.decision).toBe('DENIED_CREDENTIAL_EXPIRED');
    });

    it('should return eligible when clinician has an active, verified, non-expired SIP from database', async () => {
      // dr. Siti Wijaya (c0000000-0000-0000-0000-000000000001) in tenant 10000000-0000-0000-0000-000000000001
      const activeStaffId = 'c0000000-0000-0000-0000-000000000001';
      const liveTenantId = '10000000-0000-0000-0000-000000000001';

      const res = await clinicalCredentialService.verifyCredential({
        staffId: activeStaffId,
        tenantId: liveTenantId,
        credentialType: 'SIP',
        evaluationDate: new Date('2026-09-24')
      });

      expect(res.isEligible).toBe(true);
      expect(res.decision).toBe('AUTHORIZED');
      expect(res.credentialNumber).toBe('SIP/503/SITI/IDI/2026');
    });
  });

  // ─── 4. ROLE & GRANULAR PERMISSION TESTS ───
  describe('Dimension 4: Role & Granular Permission Verification', () => {
    it('should grant access when clinician role contains the required permission', () => {
      const doctorRoles = [ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP];
      expect(rbacGuardService.hasPermission(doctorRoles, 'EMR_WRITE_SOAP')).toBe(true);
      expect(rbacGuardService.hasPermission(doctorRoles, 'CPOE_ORDER_CREATE')).toBe(true);
      expect(rbacGuardService.hasPermission(doctorRoles, 'DISCHARGE_AUTHORIZE')).toBe(true);
    });

    it('should deny access when clinician role does not contain the permission', () => {
      const nurseRoles = [ENTERPRISE_ROLES.ROLE_NURSE];
      // Nurses cannot sign SOAP as DPJP or dispense pharmacy drugs
      expect(rbacGuardService.hasPermission(nurseRoles, 'EMR_WRITE_SOAP')).toBe(false);
      expect(rbacGuardService.hasPermission(nurseRoles, 'PHARMACY_DISPENSE')).toBe(false);
      expect(rbacGuardService.hasPermission(nurseRoles, 'DISCHARGE_AUTHORIZE')).toBe(false);

      // Nurses can administer medication and record observations
      expect(rbacGuardService.hasPermission(nurseRoles, 'MEDICATION_ADMINISTER')).toBe(true);
      expect(rbacGuardService.hasPermission(nurseRoles, 'OBSERVATION_WRITE')).toBe(true);
    });
  });

  // ─── 5. RESOURCE OWNERSHIP & CARE-TEAM ACCESS TESTS ───
  describe('Dimension 5: Contextual Resource Ownership & Care-Team Access', () => {
    const doctorContext = createAuthorizationContext({
      userId: DOCTOR_USER_ID,
      username: 'dr.gatot',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: TENANT_A,
      staffId: DOCTOR_STAFF_ID
    });

    it('should DENY access if resource belongs to another tenant (Cross-Tenant Deny)', async () => {
      const crossTenantEncounter = {
        id: 'enc-001',
        tenant_id: TENANT_B, // Different Tenant!
        primary_doctor_id: DOCTOR_STAFF_ID,
        encounter_class: 'AMB'
      };

      const res = await resourceAuthorizationService.verifyResourceAccess({
        context: doctorContext,
        action: 'EMR_WRITE_SOAP',
        resource: crossTenantEncounter,
        resourceType: 'ENCOUNTER'
      });

      expect(res.isAuthorized).toBe(false);
      expect(res.decision).toBe('DENIED_TENANT_MISMATCH');
    });

    it('should ALLOW access when clinician is the primary attending doctor (DPJP) of the encounter', async () => {
      const assignedEncounter = {
        id: 'enc-001',
        tenant_id: TENANT_A,
        primary_doctor_id: DOCTOR_STAFF_ID,
        encounter_class: 'AMB'
      };

      const res = await resourceAuthorizationService.verifyResourceAccess({
        context: doctorContext,
        action: 'EMR_WRITE_SOAP',
        resource: assignedEncounter,
        resourceType: 'ENCOUNTER'
      });

      expect(res.isAuthorized).toBe(true);
      expect(res.decision).toBe('AUTHORIZED');
    });

    it('should DENY access when a DPJP doctor accesses an encounter they are not assigned to', async () => {
      const unassignedEncounter = {
        id: 'enc-002',
        tenant_id: TENANT_A,
        primary_doctor_id: 'some-other-doctor-uuid',
        encounter_class: 'IMP'
      };

      const res = await resourceAuthorizationService.verifyResourceAccess({
        context: doctorContext,
        action: 'EMR_WRITE_SOAP',
        resource: unassignedEncounter,
        resourceType: 'ENCOUNTER'
      });

      expect(res.isAuthorized).toBe(false);
      expect(res.decision).toBe('DENIED_NOT_ATTENDING_PROVIDER');
    });

    it('should ALLOW access under explicit Break-The-Glass protocol with audit logging', async () => {
      const unassignedEncounter = {
        id: 'enc-002',
        tenant_id: TENANT_A,
        primary_doctor_id: 'some-other-doctor-uuid',
        encounter_class: 'IMP'
      };

      const res = await resourceAuthorizationService.verifyResourceAccess({
        context: doctorContext,
        action: 'EMR_WRITE_SOAP',
        resource: unassignedEncounter,
        resourceType: 'ENCOUNTER',
        allowBreakTheGlass: true,
        breakTheGlassReason: 'Emergency patient code blue resuscitation required'
      });

      expect(res.isAuthorized).toBe(true);
      expect(res.decision).toBe('AUTHORIZED_BREAK_THE_GLASS');
    });
  });

  // ─── 6. SEPARATION OF DUTIES (SOD) TESTS ───
  describe('Dimension 6: Clinical Separation of Duties (Dual-Control & Four-Eyes Principle)', () => {
    it('should DENY clinician from dispensing their own prescription order (CPOE vs Pharmacy Dispense)', () => {
      const prescriptionOrder = {
        id: 'ord-001',
        ordering_doctor_id: DOCTOR_USER_ID,
        status: 'ORDERED'
      };

      const sodResult = separationOfDutiesService.evaluateSoD({
        actorId: DOCTOR_USER_ID,
        action: 'PHARMACY_DISPENSE',
        targetResource: prescriptionOrder
      });

      expect(sodResult.satisfiesSoD).toBe(false);
      expect(sodResult.decision).toBe('DENIED_SEPARATION_OF_DUTIES');
      expect(sodResult.ruleId).toBe('SOD-CPOE-PHARMACY-DUAL-CONTROL');
    });

    it('should ALLOW different clinical staff (Pharmacist) to dispense the prescription order', () => {
      const prescriptionOrder = {
        id: 'ord-001',
        ordering_doctor_id: DOCTOR_USER_ID,
        status: 'ORDERED'
      };

      const PHARMACIST_ID = 'pharmacist-uuid-777';
      const sodResult = separationOfDutiesService.evaluateSoD({
        actorId: PHARMACIST_ID,
        action: 'PHARMACY_DISPENSE',
        targetResource: prescriptionOrder
      });

      expect(sodResult.satisfiesSoD).toBe(true);
      expect(sodResult.decision).toBe('AUTHORIZED');
    });

    it('should DENY clinician administering controlled substance from witnessing their own transaction', () => {
      const transactionContext = {
        administeredBy: DOCTOR_USER_ID
      };

      const sodResult = separationOfDutiesService.evaluateSoD({
        actorId: DOCTOR_USER_ID,
        action: 'CONTROLLED_DRUG_WITNESS',
        transactionContext
      });

      expect(sodResult.satisfiesSoD).toBe(false);
      expect(sodResult.decision).toBe('DENIED_SEPARATION_OF_DUTIES');
      expect(sodResult.ruleId).toBe('SOD-CONTROLLED-DRUG-WITNESS-SELF');
    });
  });

  // ─── 7. DETERMINISTIC FAIL-CLOSED SEMANTICS ───
  describe('Dimension 7: Deterministic Fail-Closed Semantics', () => {
    it('should fail closed when context is null or unauthenticated', async () => {
      const decision = await authorizationDecisionService.evaluateAuthorization({
        context: null,
        action: 'CPOE_ORDER_CREATE'
      });

      expect(decision.isAuthorized).toBe(false);
      expect(decision.decision).toBe('DENIED_AUTHENTICATION_REQUIRED');
    });

    it('should fail closed when database lookup errors occur during evaluation', async () => {
      const doctorContext = createAuthorizationContext({
        userId: DOCTOR_USER_ID,
        tenantId: TENANT_A,
        roles: [ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP],
        staffId: DOCTOR_STAFF_ID
      });

      // Simulate a DB error in credential verification
      vi.spyOn(clinicalCredentialService, 'verifyCredential').mockRejectedValueOnce(new Error('PostgreSQL connection drop'));

      const decision = await authorizationDecisionService.evaluateAuthorization({
        context: doctorContext,
        action: 'CPOE_ORDER_CREATE'
      });

      // MUST NOT SILENTLY ALLOW!
      expect(decision.isAuthorized).toBe(false);
    });
  });

  // ─── 8. PRODUCTION JWT SECRET & STARTUP BOUNDARY ───
  describe('Dimension 8: Production JWT Secret Boundary & Startup Validation', () => {
    it('should throw fatal error if JWT_SECRET is missing in production mode', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '5000',
        POSTGRES_PASSWORD: 'secure_password_here'
        // JWT_SECRET intentionally omitted
      };

      const validation = validateEnvironment(prodEnv);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);

      // getJwtSecret() test in production
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        expect(() => getJwtSecret()).toThrowError(/JWT_SECRET environment variable is strictly required in production/);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origSecret) process.env.JWT_SECRET = origSecret;
      }
    });

    it('should reject weak or placeholder JWT_SECRET in production mode', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '5000',
        JWT_SECRET: 'default-secret-short', // weak and placeholder
        POSTGRES_PASSWORD: 'secure_password_here'
      };

      const validation = validateEnvironment(prodEnv);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Insecure JWT_SECRET detected'))).toBe(true);
    });
  });

  // ─── 9. FORENSIC AUDIT TRAIL SANITIZATION ───
  describe('Dimension 9: Forensic Audit Trail & Secret Redaction', () => {
    it('should strictly redact passwords, tokens, and cryptographic keys before persistence', () => {
      const rawMetadata = {
        action: 'CPOE_ORDER_CREATE',
        patientId: 'pat-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitivePayload',
        userPassword: 'SecretPassword123!',
        bearerToken: 'Bearer abcdef123456',
        cookie: 'access_token=xyz'
      };

      const sanitized = clinicalAuditService.sanitizeMetadata(rawMetadata);
      expect(sanitized.action).toBe('CPOE_ORDER_CREATE');
      expect(sanitized.patientId).toBe('pat-123');
      expect(sanitized.token).toBe('[REDACTED_BY_SECURITY_POLICY]');
      expect(sanitized.userPassword).toBe('[REDACTED_BY_SECURITY_POLICY]');
      expect(sanitized.bearerToken).toBe('[REDACTED_BY_SECURITY_POLICY]');
      expect(sanitized.cookie).toBe('[REDACTED_BY_SECURITY_POLICY]');
    });

    it('should persist authorization evaluation to PostgreSQL clinical_authorization_logs', async () => {
      const liveTenantId = '10000000-0000-0000-0000-000000000001';
      const correlationId = `CORR-AUDIT-TEST-${Date.now()}`;

      const inserted = await clinicalAuditService.logAuthorizationDecision({
        tenantId: liveTenantId,
        actorId: 'test-auditor-id',
        actionCode: 'CPOE_ORDER_CREATE',
        procedureCode: 'ICD9CM-47.0',
        targetUnitId: 'UNIT-ICU-01',
        resourceType: 'ENCOUNTER',
        resourceId: 'enc-test-999',
        isAuthorized: false,
        decision: 'DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION',
        denialReason: 'System administrator denied clinical prescribing authority',
        correlationId,
        evaluationMetadata: { testRun: true }
      });

      expect(inserted).not.toBeNull();
      expect(inserted.id).toBeDefined();
      expect(inserted.is_authorized).toBe(false);
      expect(inserted.authorization_decision).toBe('DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION');
    });
  });
});
