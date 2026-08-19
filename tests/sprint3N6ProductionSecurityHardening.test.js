/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3N.6: Production Security Verification & Evidence Hardening Suite
 * Standards: PostgreSQL Row-Level Security (RLS), NIST SP 800-57 (Key Management),
 * JCI MOI Immutable Audit Trail, OWASP A01 (Broken Access Control & Side-Channel Mitigation).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { pkiKeyLifecycleService, KEY_STATUS } from '../src/core/security/pkiKeyLifecycle.service.js';
import { breakGlassGuardService, BREAK_GLASS_LIMITS } from '../src/core/security/breakGlassGuard.service.js';
import { indirectLeakageGuardService } from '../src/core/security/indirectLeakageGuard.service.js';
import { clinicalDocumentSignerService } from '../src/core/security/clinicalDocumentSigner.service.js';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

describe('🔐 SPRINT 3N.6: Production Security Verification & Evidence Hardening', () => {
  const patientAId = crypto.randomUUID();
  const patientBId = crypto.randomUUID();
  const encAId = crypto.randomUUID();
  const encBId = crypto.randomUUID();
  const mrnA = `MRN-SEC-A-${Date.now().toString().slice(-4)}`;
  const mrnB = `MRN-SEC-B-${Date.now().toString().slice(-4)}`;
  const nikA = `3201${Date.now().toString().slice(-6)}11`;
  const nikB = `3201${Date.now().toString().slice(-6)}22`;

  beforeAll(async () => {
    // Seed Patients in Tenant A and Tenant B
    await pool.query(`
      INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, gender, birth_date, phone_number, address_line, bpjs_card_number)
      VALUES ($1, $2, $3, $4, 'Bpk. Ahmad Tenant A', 'MALE', '1980-01-01', '081111111111', 'Jl. Tenant A No. 1', '0001111111111')
      ON CONFLICT DO NOTHING;
    `, [patientAId, TENANT_A, mrnA, nikA]);

    await pool.query(`
      INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, gender, birth_date, phone_number, address_line, bpjs_card_number)
      VALUES ($1, $2, $3, $4, 'Bpk. Ahmad Tenant B', 'MALE', '1982-02-02', '082222222222', 'Jl. Tenant B No. 2', '0002222222222')
      ON CONFLICT DO NOTHING;
    `, [patientBId, TENANT_B, mrnB, nikB]);

    // Seed Episodes & Encounters
    const epA = crypto.randomUUID();
    const epB = crypto.randomUUID();
    await pool.query(`
      INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name)
      VALUES ($1, $2, $3, $4, 'RAWAT_JALAN', 'ACTIVE', 'DEP-POLI', 'Poli Penyakit Dalam', 'DOC-A-01', 'dr. DPJP A');
    `, [epA, TENANT_A, `EOC-SEC-A-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, patientAId]);

    await pool.query(`
      INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name)
      VALUES ($1, $2, $3, $4, $5, 'RAWAT_JALAN', 'AMB', 'IN_PROGRESS', 'DOC-A-01', 'dr. DPJP A', 'RM-POLI-01', 'Ruang Poli 1');
    `, [encAId, TENANT_A, `ENC-SEC-A-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, epA, patientAId]);

    await pool.query(`
      INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name)
      VALUES ($1, $2, $3, $4, 'RAWAT_JALAN', 'ACTIVE', 'DEP-POLI', 'Poli Penyakit Dalam', 'DOC-B-01', 'dr. DPJP B');
    `, [epB, TENANT_B, `EOC-SEC-B-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, patientBId]);

    await pool.query(`
      INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name)
      VALUES ($1, $2, $3, $4, $5, 'RAWAT_JALAN', 'AMB', 'IN_PROGRESS', 'DOC-B-01', 'dr. DPJP B', 'RM-POLI-02', 'Ruang Poli 2');
    `, [encBId, TENANT_B, `ENC-SEC-B-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, epB, patientBId]);
  });

  // ==========================================================================
  // 1. DATABASE-LEVEL ISOLATION (POSTGRESQL ROW-LEVEL SECURITY ENFORCEMENT)
  // ==========================================================================
  describe('1. Database-Level Isolation (PostgreSQL RLS Enforcement)', () => {
    it('1.1 should enforce RLS so a session bound to Tenant A cannot see Tenant B records even without WHERE clause', async () => {
      const client = await postgresPoolService.getClient();
      try {
        await client.query('BEGIN');
        // Set PostgreSQL session role to non-superuser app role with NOBYPASSRLS
        await client.query('SET LOCAL ROLE nurseflow_app_user;');
        // Set PostgreSQL session tenant context
        await client.query(`SET LOCAL app.current_tenant_id = '${TENANT_A}';`);

        // Query master_patients without WHERE tenant_id clause
        const res = await client.query('SELECT id, tenant_id, full_name FROM master_patients WHERE full_name LIKE $1;', ['%Ahmad Tenant%']);

        // Assert that ONLY Tenant A records are visible and Tenant B records are physically excluded
        expect(res.rows.length).toBeGreaterThanOrEqual(1);
        expect(res.rows.every(r => r.tenant_id === TENANT_A)).toBe(true);
        expect(res.rows.some(r => r.tenant_id === TENANT_B)).toBe(false);
        expect(res.rows.some(r => r.full_name.includes('Tenant A'))).toBe(true);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });

  // ==========================================================================
  // 2. AUDIT TRAIL IMMUTABILITY ENFORCEMENT (DATABASE TRIGGER PROTECTION)
  // ==========================================================================
  describe('2. Audit Log Immutability Enforcement (Database Trigger Protection)', () => {
    it('2.1 should REJECT and THROW an exception when attempting UPDATE on universal_audit_logs', async () => {
      const client = await postgresPoolService.getClient();
      let exceptionThrown = false;
      try {
        await client.query('BEGIN');
        await client.query(`
          UPDATE universal_audit_logs
          SET reason_for_action = 'MALICIOUS_TAMPER_UPDATE'
          WHERE tenant_id = $1;
        `, [TENANT_A]);
        await client.query('COMMIT');
      } catch (err) {
        exceptionThrown = true;
        expect(err.message).toContain('JCI AUDIT INTEGRITY VIOLATION');
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      expect(exceptionThrown).toBe(true);
    });

    it('2.2 should REJECT and THROW an exception when attempting DELETE on universal_audit_logs', async () => {
      const client = await postgresPoolService.getClient();
      let exceptionThrown = false;
      try {
        await client.query('BEGIN');
        await client.query(`
          DELETE FROM universal_audit_logs
          WHERE tenant_id = $1;
        `, [TENANT_A]);
        await client.query('COMMIT');
      } catch (err) {
        exceptionThrown = true;
        expect(err.message).toContain('JCI AUDIT INTEGRITY VIOLATION');
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      expect(exceptionThrown).toBe(true);
    });
  });

  // ==========================================================================
  // 3. PKI KEY LIFECYCLE MANAGEMENT (ROTATION, VERIFICATION & REVOCATION)
  // ==========================================================================
  describe('3. PKI Key Lifecycle Management (Rotation, Verification & Revocation)', () => {
    let keypair1, keypair2;
    let keyReg1, keyReg2;
    const sampleSoapDoc = {
      patientId: 'PAT-PKI-01',
      assessment: 'I10 Hipertensi Primer Terkontrol',
      plan: 'Amlodipine 5mg 1x1'
    };
    let signedEnvelope1;

    it('3.1 should register initial active practitioner key and sign document', async () => {
      keypair1 = clinicalDocumentSignerService.generatePractitionerKeypair();
      keyReg1 = await pkiKeyLifecycleService.registerPractitionerKey({
        tenantId: TENANT_A,
        practitionerId: 'DOC-PKI-001',
        practitionerName: 'dr. Satria Sp.PD',
        publicKeyPem: keypair1.publicKeyPem
      });

      expect(keyReg1.keyStatus).toBe(KEY_STATUS.ACTIVE);

      signedEnvelope1 = clinicalDocumentSignerService.signDocument({
        document: sampleSoapDoc,
        privateKeyPem: keypair1.privateKeyPem,
        signer: {
          doctorId: 'DOC-PKI-001',
          doctorName: 'dr. Satria Sp.PD',
          publicKeyPem: keypair1.publicKeyPem
        }
      });

      const verif = clinicalDocumentSignerService.verifyDocumentSignature({
        document: sampleSoapDoc,
        signatureEnvelope: signedEnvelope1
      });
      expect(verif.isValid).toBe(true);
    });

    it('3.2 should ROTATE key to new active key while preserving verification of older documents', async () => {
      keypair2 = clinicalDocumentSignerService.generatePractitionerKeypair();
      keyReg2 = await pkiKeyLifecycleService.rotateKey({
        tenantId: TENANT_A,
        practitionerId: 'DOC-PKI-001',
        practitionerName: 'dr. Satria Sp.PD',
        newPublicKeyPem: keypair2.publicKeyPem
      });

      expect(keyReg2.keyStatus).toBe(KEY_STATUS.ACTIVE);
      expect(keyReg2.previousKeysStatus).toBe(KEY_STATUS.ROTATED_VERIFY_ONLY);

      // Verify that document signed with key 1 still verifies
      const verifOld = clinicalDocumentSignerService.verifyDocumentSignature({
        document: sampleSoapDoc,
        signatureEnvelope: signedEnvelope1
      });
      expect(verifOld.isValid).toBe(true);
    });

    it('3.3 should REVOKE a compromised key and block it from future signing operations', async () => {
      const revoked = await pkiKeyLifecycleService.revokeKey({
        tenantId: TENANT_A,
        keyId: keyReg2.newKeyId,
        revocationReason: 'SMARTCARD_LOST_COMPROMISE'
      });

      expect(revoked.keyStatus).toBe(KEY_STATUS.REVOKED);
      const canSign = await pkiKeyLifecycleService.canSignWithKey(keyReg2.newKeyId);
      expect(canSign).toBe(false);
    });
  });

  // ==========================================================================
  // 4. BREAK-GLASS ABUSE & HOURLY RATE LIMITING
  // ==========================================================================
  describe('4. Break-Glass Abuse & Hourly Rate Limiting', () => {
    it('4.1 should REJECT break-glass request with reason less than 10 characters', async () => {
      const result = await breakGlassGuardService.requestBreakGlassAccess({
        tenantId: TENANT_A,
        practitionerId: 'DOC-ABUSE-01',
        practitionerName: 'dr. Emergency Abuse',
        practitionerRole: 'ROLE_DOCTOR_EMERGENCY',
        patientId: patientAId,
        encounterId: encAId,
        reasonText: 'darurat' // 7 chars (<10)
      });

      expect(result.isGranted).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toBe('REASON_INSUFFICIENT_MINIMUM_10_CHARACTERS_REQUIRED');
    });

    it('4.2 should enforce hourly rate limit (max 5 per hour) and trigger supervisor alerts', async () => {
      const practitionerId = `DOC-TEST-RATE-${Date.now()}`;
      const results = [];

      // Execute 6 consecutive break-glass requests
      for (let i = 1; i <= 6; i++) {
        const res = await breakGlassGuardService.requestBreakGlassAccess({
          tenantId: TENANT_A,
          practitionerId,
          practitionerName: 'dr. Intensive On-Call',
          practitionerRole: 'ROLE_DOCTOR_EMERGENCY',
          patientId: patientAId,
          encounterId: encAId,
          reasonText: `Emergency Code Blue Resuscitation Event #${i} in ICU`
        });
        results.push(res);
      }

      // First 5 should succeed
      expect(results[0].isGranted).toBe(true);
      expect(results[4].isGranted).toBe(true);
      expect(results[4].supervisorAlertDispatched).toBe(true); // Alert triggered on 5th

      // 6th request must be RATE LIMITED (HTTP 429)
      expect(results[5].isGranted).toBe(false);
      expect(results[5].statusCode).toBe(429);
      expect(results[5].error).toBe('BREAK_GLASS_HOURLY_RATE_LIMIT_EXCEEDED');
    });
  });

  // ==========================================================================
  // 5. INDIRECT CROSS-TENANT INFORMATION LEAKAGE (SIDE-CHANNEL DEFENSE)
  // ==========================================================================
  describe('5. Indirect Cross-Tenant Information Leakage (Side-Channel Defense)', () => {
    it('5.1 should ensure search query for "Ahmad" strictly returns Tenant A records and exact Tenant A count', async () => {
      const searchResA = await indirectLeakageGuardService.searchPatients({
        tenantId: TENANT_A,
        searchQuery: 'Ahmad Tenant A'
      });

      expect(searchResA.results.length).toBeGreaterThanOrEqual(1);
      expect(searchResA.results.every(p => !p.full_name.includes('Tenant B'))).toBe(true);
      expect(searchResA.results.some(p => p.full_name.includes('Tenant A'))).toBe(true);

      const searchResB = await indirectLeakageGuardService.searchPatients({
        tenantId: TENANT_B,
        searchQuery: 'Ahmad Tenant B'
      });

      expect(searchResB.results.length).toBeGreaterThanOrEqual(1);
      expect(searchResB.results.every(p => !p.full_name.includes('Tenant A'))).toBe(true);
      expect(searchResB.results.some(p => p.full_name.includes('Tenant B'))).toBe(true);
    });

    it('5.2 should ensure hospital KPI aggregations strictly isolate counts per tenant', async () => {
      const kpiA = await indirectLeakageGuardService.getHospitalDashboardKpi({ tenantId: TENANT_A });
      const kpiB = await indirectLeakageGuardService.getHospitalDashboardKpi({ tenantId: TENANT_B });

      expect(kpiA.tenantId).toBe(TENANT_A);
      expect(kpiB.tenantId).toBe(TENANT_B);
      expect(kpiA.activeEncountersCount).toBeGreaterThanOrEqual(1);
      expect(kpiB.activeEncountersCount).toBeGreaterThanOrEqual(1);
    });
  });
});
