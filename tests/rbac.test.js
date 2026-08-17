import { describe, it, expect } from 'vitest';
import { rbacGuardService, ENTERPRISE_ROLES } from '../src/core/security/rbacGuard.service.js';

describe('RBAC Security & Permission Matrix', () => {
  it('should grant Super Admin wildcard access (*)', () => {
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_SUPER_ADMIN, 'ANY_IMAGINABLE_PERMISSION')).toBe(true);
  });

  it('should allow DPJP Doctor to sign SOAP and verify CPPT, but forbid cashier actions', () => {
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, 'EMR_WRITE_SOAP')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, 'CPPT_VERIFY')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, 'PAYMENT_PROCESS')).toBe(false);
  });

  it('should allow Clinical Pharmacist to review prescriptions and dispense, but forbid SOAP doctor signing', () => {
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_PHARMACIST, 'PHARMACY_REVIEW')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_PHARMACIST, 'PHARMACY_DISPENSE')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_PHARMACIST, 'EMR_WRITE_SOAP')).toBe(false);
  });

  it('should allow Cashier to process payments and create invoices', () => {
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_CASHIER, 'PAYMENT_PROCESS')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_CASHIER, 'INVOICE_CREATE')).toBe(true);
    expect(rbacGuardService.hasPermission(ENTERPRISE_ROLES.ROLE_CASHIER, 'TRIAGE_WRITE')).toBe(false);
  });
});
