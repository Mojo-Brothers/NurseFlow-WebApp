import { describe, it, expect } from 'vitest';
import { careWorkspaceResolver } from '../src/core/services/careWorkspaceResolver.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Gate 0G & Non-Negotiable Rule 5: Context-Aware CareWorkspaceResolver', () => {
  it('1. should route Doctor and Nurse to role-specific workspaces for INPATIENT_ACTIVE', () => {
    const doctorResolution = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'DOCTOR'
    });
    expect(doctorResolution.path).toBe('/doctor-workspace');
    expect(doctorResolution.workspaceName).toContain('Visite Dokter');

    const nurseResolution = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'NURSE'
    });
    expect(nurseResolution.path).toBe('/nursing-workspace');
    expect(nurseResolution.workspaceName).toContain('Nursing Care & eMAR');

    const pharmacistResolution = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'PHARMACIST'
    });
    expect(pharmacistResolution.path).toBe('/pharmacy-enterprise');
  });

  it('2. should support context-aware overrides (ICU Nurse vs OK Nurse vs Ward Nurse)', () => {
    const icuNurseRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'NURSE',
      specialty: 'ICU_CRITICAL_CARE'
    });
    expect(icuNurseRes.path).toBe('/icu-acuity');

    const okNurseRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.INPATIENT_ACTIVE,
      role: 'NURSE',
      department: 'IBS_SURGERY'
    });
    expect(okNurseRes.path).toBe('/operating-theatre');
  });

  it('3. should route emergency states correctly', () => {
    const triageRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.TRIAGE_PENDING,
      role: 'NURSE'
    });
    expect(triageRes.path).toBe('/triage');

    const emergencyNurseRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.IGD_ACTIVE,
      role: 'NURSE'
    });
    expect(emergencyNurseRes.path).toBe('/emergency');

    const emergencyDoctorRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.IGD_ACTIVE,
      role: 'DOCTOR'
    });
    expect(emergencyDoctorRes.path).toBe('/doctor-workspace');
  });

  it('4. should enforce Readonly / Historical mode for closed/terminal encounters', () => {
    const closedRes = careWorkspaceResolver.resolve({
      careState: CARE_STATES.DISCHARGED,
      role: 'DOCTOR',
      encounterId: 'ENC-HIST-123',
      isTerminal: true
    });
    expect(closedRes.isReadOnly).toBe(true);
    expect(closedRes.path).toBe('/reporting/ENC-HIST-123');
    expect(closedRes.workspaceName).toContain('Historis');
  });
});
