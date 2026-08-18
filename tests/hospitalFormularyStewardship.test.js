/**
 * NurseFlow Enterprise HIS 2026 — Hospital Formulary & Stewardship Test Suite (Sprint 1)
 * Standards: Permenkes 73/2016, JCI MMU.1
 */

import { describe, it, expect } from 'vitest';
import { hospitalFormularyService } from '../server/services/hospitalFormulary.service.js';

describe('Sprint 1: Hospital Formulary & Antibiotic Stewardship Guard', () => {

  // 1. Fetch Formulary List
  it('1. should retrieve active hospital formulary list with drug details', async () => {
    const list = await hospitalFormularyService.getFormulary({ organizationId: 'ORG-01' });

    expect(list.length).toBeGreaterThanOrEqual(4);
    const meropenem = list.find(f => f.drugId === 'MED-001');
    expect(meropenem).toBeDefined();
    expect(meropenem.formularyTier).toBe('RESTRICTED_ANTIBIOTIC');
    expect(meropenem.approvalLevelRequired).toBe('KFT_APPROVAL_REQUIRED');
  });

  // 2. Enforce Antibiotic Stewardship on Restricted Drugs
  it('2. should enforce KFT approval restriction for Meropenem prescription', async () => {
    const check = await hospitalFormularyService.checkPrescriptionStewardship('MED-001', 'PHYSICIAN_RESIDENT', 'DEPT-WARD-01');

    expect(check.isAllowed).toBe(false);
    expect(check.requiresSpecialApproval).toBe(true);
    expect(check.approvalType).toBe('KFT_APPROVAL_REQUIRED');
    expect(check.reason).toContain('RESTRICTED_ANTIBIOTIC');
  });

  // 3. Allow Standard First-Line Antibiotics without Barrier
  it('3. should allow unrestricted prescribing for first-line formulary drugs like Ceftriaxone', async () => {
    const check = await hospitalFormularyService.checkPrescriptionStewardship('MED-002', 'PHYSICIAN_GENERAL', 'DEPT-WARD-01');

    expect(check.isAllowed).toBe(true);
    expect(check.formularyTier).toBe('FORMULARIUM_RS');
    expect(check.maxPrescribingDays).toBe(14);
  });

  // 4. Enforce Departmental Restriction (e.g. Norepinephrine limited to ICU)
  it('4. should restrict departmental use (e.g. Norepinephrine restricted to ICU)', async () => {
    // Attempt in general ward -> Must be blocked
    const wardCheck = await hospitalFormularyService.checkPrescriptionStewardship('MED-009', 'PHYSICIAN_SPECIALIST', 'DEPT-GENERAL-WARD');
    expect(wardCheck.isAllowed).toBe(false);
    expect(wardCheck.approvalType).toBe('DEPARTMENT_RESTRICTED');

    // Attempt in ICU -> Must be allowed
    const icuCheck = await hospitalFormularyService.checkPrescriptionStewardship('MED-009', 'PHYSICIAN_SPECIALIST', 'DEPT-ICU');
    expect(icuCheck.isAllowed).toBe(true);
  });

});
