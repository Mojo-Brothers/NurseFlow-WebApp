import { describe, it, expect } from 'vitest';
import { abacSecurityService } from '../server/services/abacSecurity.service.js';

describe('ABAC (Attribute-Based Access Control) & Row-Level Security', () => {
  const patient = { id: 'P-1001', mrn: 'MRN-2026-001001' };
  const encounter = {
    id: 'ENC-001',
    primaryDoctorId: 'DOC-001',
    managingDepartmentId: 'DEPT-IRNA',
    serviceRoomId: 'WARD-MELATI-3A'
  };

  it('should grant access to the assigned primary DPJP doctor', () => {
    const access = abacSecurityService.evaluateAccess({
      user: { userId: 'DOC-001', role: 'ROLE_DOCTOR_DPJP' },
      patient,
      encounter,
      action: 'READ_MEDICAL_RECORD'
    });

    expect(access.isAllowed).toBe(true);
    expect(access.reason).toBe('ASSIGNED_PRIMARY_DPJP');
  });

  it('should deny access to a nurse assigned to a different ward', () => {
    const access = abacSecurityService.evaluateAccess({
      user: { userId: 'NUR-002', role: 'ROLE_NURSE', assignedWardId: 'WARD-MAWAR-2B' },
      patient,
      encounter,
      action: 'READ_MEDICAL_RECORD'
    });

    expect(access.isAllowed).toBe(false);
    expect(access.reason).toBe('DENIED_DIFFERENT_WARD');
  });

  it('should allow Emergency Break-The-Glass override for critical patient care', () => {
    const access = abacSecurityService.evaluateAccess({
      user: { userId: 'DOC-999', role: 'ROLE_DOCTOR_EMERGENCY' },
      patient,
      encounter,
      action: 'EMERGENCY_INTERVENTION',
      isEmergencyBreakTheGlass: true
    });

    expect(access.isAllowed).toBe(true);
    expect(access.reason).toBe('EMERGENCY_BREAK_THE_GLASS_OVERRIDE');
    expect(access.requiresAuditFlag).toBe(true);
  });
});
