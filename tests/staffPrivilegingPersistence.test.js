/**
 * NurseFlow Enterprise HIS 2026 — Staff Scheduling, Credentialing & Clinical Privileging Test Suite (Gate 1D.6)
 * Standards: JCI Governance, Leadership & Direction (GLD), KARS KPS & Permenkes No. 755/2011
 */

import { describe, it, expect } from 'vitest';
import { staffSchedulingService, STAFF_CATEGORIES, PRIVILEGE_LEVELS } from '../server/services/staffScheduling.service.js';

describe('Gate 1D.6: Clinical Staff Scheduling, Credentialing & Privileging Persistence', () => {
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const TENANT_B = '00000000-0000-0000-0000-000000000002';
  const targetDate = new Date('2026-09-01T09:00:00Z');

  // 1. Staff Profile Registration
  it('1. should register a specialist clinician profile', () => {
    const doctor = staffSchedulingService.registerStaffProfile({
      id: 'STAFF-DOC-01',
      tenantId: TENANT_A,
      staffNumber: 'DOK-2026-001',
      fullName: 'dr. Budi Santoso, Sp.B, Subsp.BD(K)',
      staffCategory: STAFF_CATEGORIES.SPECIALIST_DOCTOR,
      primarySpecialty: 'Bedah Digestif',
      primaryDepartmentId: 'DEPT-IBS-BEDAH',
      employmentStatus: 'PERMANENT',
      isActive: true
    });

    expect(doctor.fullName).toContain('Budi Santoso');
    expect(doctor.staffCategory).toBe(STAFF_CATEGORIES.SPECIALIST_DOCTOR);
  });

  // 2. Credential Registration with Effective Dating (STR & SIP)
  it('2. should register STR & SIP with effective dating and reject inverted validity dates', () => {
    // Inverted dates must fail
    expect(() => {
      staffSchedulingService.registerCredential({
        tenantId: TENANT_A,
        staffId: 'STAFF-DOC-01',
        credentialType: 'STR',
        credentialNumber: 'STR-INVALID-01',
        issuedAt: '2026-01-01',
        validFrom: '2026-12-31',
        validUntil: '2026-01-01' // INVERTED!
      });
    }).toThrow(/INVALID_DATES/);

    // Valid STR (Valid until 2029)
    const str = staffSchedulingService.registerCredential({
      id: 'CRED-STR-01',
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      credentialType: 'STR',
      credentialNumber: 'STR-KKI-3112998877',
      issuingAuthority: 'Konsil Kedokteran Indonesia (KKI)',
      issuedAt: '2024-01-01',
      validFrom: '2024-01-01',
      validUntil: '2029-01-01',
      verificationStatus: 'ACTIVE_VERIFIED'
    });

    // Valid SIP (Valid until 2028)
    const sip = staffSchedulingService.registerCredential({
      id: 'CRED-SIP-01',
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      credentialType: 'SIP',
      credentialNumber: 'SIP-DINKES-JKT-2024/099',
      issuingAuthority: 'Dinas Kesehatan Provinsi DKI Jakarta',
      issuedAt: '2024-01-01',
      validFrom: '2024-01-01',
      validUntil: '2028-01-01',
      verificationStatus: 'ACTIVE_VERIFIED'
    });

    expect(str.verificationStatus).toBe('ACTIVE_VERIFIED');
    expect(sip.verificationStatus).toBe('ACTIVE_VERIFIED');
  });

  // 3. Clinical Privilege (RKK/SPK) Granting
  it('3. should grant clinical privilege (RKK) with prerequisite active STR/SIP check', () => {
    // Attempting to grant privilege to a doctor without active STR/SIP must fail
    staffSchedulingService.registerStaffProfile({
      id: 'STAFF-DOC-NO-STR',
      tenantId: TENANT_A,
      staffNumber: 'DOK-UNLICENSED',
      fullName: 'dr. Unlicensed Doctor',
      staffCategory: STAFF_CATEGORIES.GENERAL_PRACTITIONER,
      primarySpecialty: 'Umum',
      primaryDepartmentId: 'DEPT-IGD'
    });

    expect(() => {
      staffSchedulingService.grantClinicalPrivilege({
        tenantId: TENANT_A,
        staffId: 'STAFF-DOC-NO-STR',
        departmentId: 'DEPT-IGD',
        procedureCode: 'PROC-SUTURING',
        procedureName: 'Wound Suturing',
        effectiveFrom: '2026-01-01',
        effectiveUntil: '2027-01-01'
      });
    }).toThrow(/AUTHORIZATION_DENIED.*STR\/SIP/);

    // Grant Laparoscopic Appendectomy to licensed specialist
    const priv = staffSchedulingService.grantClinicalPrivilege({
      id: 'PRIV-LAP-APP-01',
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      departmentId: 'DEPT-IBS-BEDAH',
      procedureCode: 'PROC-LAP-APP',
      procedureName: 'Laparoscopic Appendectomy',
      privilegeLevel: PRIVILEGE_LEVELS.INDEPENDENT,
      effectiveFrom: '2026-01-01',
      effectiveUntil: '2027-12-31',
      spkDocumentNumber: 'SPK-KOMMED-2026-01'
    });

    expect(priv.privilegeLevel).toBe(PRIVILEGE_LEVELS.INDEPENDENT);
    expect(priv.procedureCode).toBe('PROC-LAP-APP');
  });

  // 4. Shift Assignment & Conflict Protection
  it('4. should assign duty shift and reject duplicate shift on same date', () => {
    const shift = staffSchedulingService.assignShift({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      staffName: 'dr. Budi Santoso',
      departmentId: 'DEPT-IBS-BEDAH',
      date: '2026-09-01',
      shiftCode: 'PAGI',
      unitId: 'DEPT-IBS-BEDAH',
      unitName: 'Instalasi Bedah Sentral'
    });

    expect(shift.shiftCode).toBe('PAGI');

    // Duplicate shift on same date must fail
    expect(() => {
      staffSchedulingService.assignShift({
        tenantId: TENANT_A,
        staffId: 'STAFF-DOC-01',
        staffName: 'dr. Budi Santoso',
        departmentId: 'DEPT-IBS-BEDAH',
        date: '2026-09-01',
        shiftCode: 'SIANG'
      });
    }).toThrow(/Konflik Jadwal/);
  });

  // ─── PART B: CLINICAL AUTHORIZATION EVALUATION ENGINE (NEGATIVE & POSITIVE PATHS) ───

  // 5. Successful Clinical Authorization
  it('5. should authorize procedure when clinician has active STR, active SPK, and is on duty', () => {
    const auth = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: targetDate // 2026-09-01 09:00:00
    });

    expect(auth.isAuthorized).toBe(true);
    expect(auth.authorizationDecision).toBe('AUTHORIZED');
    expect(auth.evaluationMetadata.privilegeLevel).toBe(PRIVILEGE_LEVELS.INDEPENDENT);
  });

  // 6. Barrier: Credential Expired
  it('6. should DENY authorization if clinician STR or SIP is expired at evaluation datetime', () => {
    const authFuture = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: '2030-01-01T00:00:00Z' // FUTURE: STR expired in 2029!
    });

    expect(authFuture.isAuthorized).toBe(false);
    expect(authFuture.authorizationDecision).toBe('DENIED_CREDENTIAL_EXPIRED');
  });

  // 7. Barrier: Credential Revoked
  it('7. should DENY authorization if clinician license has been revoked', () => {
    staffSchedulingService.registerStaffProfile({
      id: 'STAFF-DOC-REVOKED',
      tenantId: TENANT_A,
      staffNumber: 'DOK-REV-01',
      fullName: 'dr. Malpractice',
      staffCategory: STAFF_CATEGORIES.SPECIALIST_DOCTOR,
      primarySpecialty: 'Bedah',
      primaryDepartmentId: 'DEPT-IBS-BEDAH'
    });

    staffSchedulingService.registerCredential({
      id: 'CRED-REVOKED-01',
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-REVOKED',
      credentialType: 'STR',
      credentialNumber: 'STR-REVOKED-01',
      issuedAt: '2024-01-01',
      validFrom: '2024-01-01',
      validUntil: '2029-01-01',
      verificationStatus: 'REVOKED',
      revokedAt: '2026-05-01T00:00:00Z',
      revocationReason: 'Sanksi Disiplin MKDKI'
    });

    const authRevoked = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-REVOKED',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: targetDate
    });

    expect(authRevoked.isAuthorized).toBe(false);
    expect(authRevoked.authorizationDecision).toBe('DENIED_CREDENTIAL_REVOKED');
  });

  // 8. Barrier: No Privilege for Specific Procedure
  it('8. should DENY authorization if clinician lacks clinical privilege for the procedure', () => {
    // Dr. Budi is a Digestive Surgeon, attempting Open Heart Bypass
    const authWrongProc = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-CABG-OPEN-HEART', // Out of scope!
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: targetDate
    });

    expect(authWrongProc.isAuthorized).toBe(false);
    expect(authWrongProc.authorizationDecision).toBe('DENIED_NO_PRIVILEGE');
  });

  // 9. Barrier: Wrong Unit / Department
  it('9. should DENY authorization if privilege is restricted to another unit/department', () => {
    // Attempting procedure in Radiology instead of IBS
    const authWrongUnit = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-RADIOLOGY-CATHLAB',
      evaluationTimestamp: targetDate
    });

    expect(authWrongUnit.isAuthorized).toBe(false);
    expect(authWrongUnit.authorizationDecision).toBe('DENIED_WRONG_UNIT');
  });

  // 10. Barrier: Not on Duty
  it('10. should DENY authorization if clinician is not on active shift or on-call on target date', () => {
    // Evaluating on a date with no shift assignment (2026-09-15)
    const authOffDuty = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: '2026-09-15T09:00:00Z'
    });

    expect(authOffDuty.isAuthorized).toBe(false);
    expect(authOffDuty.authorizationDecision).toBe('DENIED_NOT_ON_DUTY');

    // But if On-Call is registered for 2026-09-15, authorization passes!
    staffSchedulingService.registerOnCallSchedule({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      onCallDate: '2026-09-15',
      specialtyGroup: 'BEDAH_DIGESTIF'
    });

    const authOnCall = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: '2026-09-15T09:00:00Z'
    });

    expect(authOnCall.isAuthorized).toBe(true);
    expect(authOnCall.evaluationMetadata.dutyMode).toBe('ON_CALL_COVERAGE');
  });

  // 11. Barrier: Inactive Clinician or Cross-Tenant
  it('11. should DENY authorization if staff is inactive or cross-tenant evaluation is attempted', () => {
    staffSchedulingService.registerStaffProfile({
      id: 'STAFF-INACTIVE-01',
      tenantId: TENANT_A,
      staffNumber: 'DOK-INACT-01',
      fullName: 'dr. Retired Staff',
      employmentStatus: 'INACTIVE',
      isActive: false
    });

    const authInactive = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_A,
      staffId: 'STAFF-INACTIVE-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: targetDate
    });

    expect(authInactive.isAuthorized).toBe(false);
    expect(authInactive.authorizationDecision).toBe('DENIED_STAFF_INACTIVE');

    // Cross-tenant evaluation must be denied
    const authCrossTenant = staffSchedulingService.evaluateClinicalAuthorization({
      tenantId: TENANT_B, // WRONG TENANT
      staffId: 'STAFF-DOC-01',
      procedureCode: 'PROC-LAP-APP',
      targetUnitId: 'DEPT-IBS-BEDAH',
      evaluationTimestamp: targetDate
    });

    expect(authCrossTenant.isAuthorized).toBe(false);
    expect(authCrossTenant.authorizationDecision).toBe('DENIED_STAFF_INACTIVE');
  });
});
