/**
 * ============================================================================
 * ARCHITECTURE FREEZE — DOMAIN CONTRACT BASELINE v1.0
 * 
 * WARNING:
 * This contract is the authoritative architectural foundation of NurseFlow.
 * DO NOT MODIFY WITHOUT FORMAL ARCHITECTURAL REVIEW.
 * 
 * Version: 1.0 (Baseline Commit: 06c6b44 / Tag: architecture-baseline-v1.0)
 * Standard: JCI Dynamic Role-Based Clinical Routing
 * ============================================================================
 * 
 * NurseFlow Enterprise HIS — Dynamic Care Workspace Resolver
 * Resolves target route, title, clinical actions, and permissions based on:
 * (careState, userRole, department, specialty, location) — Gate 0G & Contextual Workspace Routing.
 */

import { CARE_STATES, TERMINAL_STATES } from './careStateEngine.service.js';

export const USER_ROLES = {
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  CASE_MANAGER: 'CASE_MANAGER',
  RADIOLOGIST: 'RADIOLOGIST',
  LAB_TECH: 'LAB_TECH',
  REGISTRATION: 'REGISTRATION'
};

class CareWorkspaceResolver {
  /**
   * Context-Aware Dynamic Workspace Resolver
   * Resolves: Care State + Role + Permission + Department + Specialty + Location
   */
  resolve({ 
    careState, 
    role = 'STAFF', 
    department = null,
    specialty = null,
    location = null,
    encounterId = null, 
    isTerminal = false 
  }) {
    const normalizedRole = (role || '').toUpperCase();
    const normalizedDept = (department || '').toUpperCase();
    const normalizedSpecialty = (specialty || '').toUpperCase();
    const effectiveState = careState || CARE_STATES.REGISTERED;
    const isEncounterClosed = isTerminal || TERMINAL_STATES.has(effectiveState);

    // 1. Terminal / Closed Encounters always route to Historical / Readonly View
    if (isEncounterClosed) {
      return {
        path: encounterId ? `/reporting/${encounterId}` : '/patients',
        workspaceName: 'Rekam Medis Historis (Readonly)',
        moduleDomain: 'REPORTING',
        isReadOnly: true,
        badgeLabel: effectiveState === CARE_STATES.DECEASED ? 'DECEASED' : 'CLOSED ENCOUNTER',
        badgeColor: effectiveState === CARE_STATES.DECEASED ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
      };
    }

    // 2. Specialty & Department Contextual Overrides (e.g. ICU Nurse vs OK Nurse vs Ward Nurse)
    if (normalizedRole.includes('NURSE')) {
      if (normalizedDept.includes('ICU') || normalizedSpecialty.includes('ICU') || location?.wardName?.includes('ICU')) {
        return { path: '/icu-acuity', workspaceName: 'ICU Acuity & Titrasi Obat (Intensive Care)', moduleDomain: 'EMERGENCY' };
      }
      if (normalizedDept.includes('IBS') || normalizedDept.includes('OK') || normalizedSpecialty.includes('SURGERY')) {
        return { path: '/operating-theatre', workspaceName: 'Kamar Bedah (IBS Perioperatif)', moduleDomain: 'SURGERY' };
      }
    }

    // 3. Role-Based Dynamic Matrix (Gate 0G)
    switch (effectiveState) {
      case CARE_STATES.REGISTERED:
        if (normalizedRole.includes('DOCTOR')) {
          return { path: '/doctor-workspace', workspaceName: 'Antrean Poliklinik Dokter', moduleDomain: 'CLINICAL' };
        }
        return { path: '/front-office', workspaceName: 'Loket Pendaftaran & Admisi', moduleDomain: 'PATIENTS' };

      case CARE_STATES.TRIAGE_PENDING:
        return { path: '/triage', workspaceName: 'Bilik Triase IGD (ESI v4)', moduleDomain: 'EMERGENCY' };

      case CARE_STATES.IGD_OBSERVATION:
      case CARE_STATES.IGD_ACTIVE:
        if (normalizedRole.includes('DOCTOR')) {
          return { path: '/doctor-workspace', workspaceName: 'IGD Doctor Consultation', moduleDomain: 'CLINICAL' };
        }
        if (normalizedRole.includes('PHARMAC')) {
          return { path: '/pharmacy-enterprise', workspaceName: 'Farmasi IGD & Cito', moduleDomain: 'PHARMACY' };
        }
        return { path: '/emergency', workspaceName: 'Emergency Workspace & Resus', moduleDomain: 'EMERGENCY' };

      case CARE_STATES.OUTPATIENT_ACTIVE:
        if (normalizedRole.includes('PHARMAC')) {
          return { path: '/pharmacy-enterprise', workspaceName: 'Farmasi Poliklinik', moduleDomain: 'PHARMACY' };
        }
        return { path: '/doctor-workspace', workspaceName: 'Poliklinik Rawat Jalan (CPPT/SOAP)', moduleDomain: 'CLINICAL' };

      case CARE_STATES.ADMISSION_PENDING:
        if (normalizedRole.includes('ADMIN') || normalizedRole.includes('REGISTR') || normalizedRole.includes('NURSE')) {
          return { path: '/bed-management', workspaceName: 'Bed Management & Alokasi Rawat Inap', moduleDomain: 'ADMINISTRATION' };
        }
        return { path: '/doctor-workspace', workspaceName: 'Instruksi Admisi Rawat Inap (SPRI)', moduleDomain: 'CLINICAL' };

      case CARE_STATES.INPATIENT_ACTIVE:
      case CARE_STATES.TRANSFERRED:
        if (normalizedRole.includes('DOCTOR')) {
          return { path: '/doctor-workspace', workspaceName: 'Visite Dokter Rawat Inap (CPPT)', moduleDomain: 'CLINICAL' };
        }
        if (normalizedRole.includes('PHARMAC')) {
          return { path: '/pharmacy-enterprise', workspaceName: 'Dispensing Depo Rawat Inap', moduleDomain: 'PHARMACY' };
        }
        if (normalizedRole.includes('CASE_MANAGER')) {
          return { path: '/patients', workspaceName: 'Kendali Mutu & Alur Rawat Inap', moduleDomain: 'PATIENTS' };
        }
        return { path: '/nursing-workspace', workspaceName: 'Nursing Care & eMAR (Rawat Inap)', moduleDomain: 'CLINICAL' };

      case CARE_STATES.ICU_ACTIVE:
        if (normalizedRole.includes('DOCTOR')) {
          return { path: '/doctor-workspace', workspaceName: 'ICU Critical Care CPPT', moduleDomain: 'CLINICAL' };
        }
        return { path: '/icu-acuity', workspaceName: 'ICU Acuity & Titrasi Obat', moduleDomain: 'EMERGENCY' };

      case CARE_STATES.OR_ACTIVE:
      case CARE_STATES.PACU_RECOVERY:
        return { path: '/operating-theatre', workspaceName: 'Kamar Bedah (IBS) & PACU Recovery', moduleDomain: 'SURGERY' };

      case CARE_STATES.TRANSFER_PENDING:
        return { path: '/bed-management', workspaceName: 'Transfer Ruangan / Bed Management', moduleDomain: 'ADMINISTRATION' };

      case CARE_STATES.DISCHARGE_PENDING:
        if (normalizedRole.includes('DOCTOR')) {
          return { path: '/doctor-workspace', workspaceName: 'Penyusunan Resume Medis Pulang', moduleDomain: 'CLINICAL' };
        }
        if (normalizedRole.includes('PHARMAC')) {
          return { path: '/pharmacy-enterprise', workspaceName: 'Rekonsiliasi Obat Pulang', moduleDomain: 'PHARMACY' };
        }
        return { path: '/nursing-workspace', workspaceName: 'Discharge Planning & Pelepasan Infus', moduleDomain: 'CLINICAL' };

      default:
        return { path: '/patients', workspaceName: 'Patient Master Index & Workstation', moduleDomain: 'PATIENTS' };
    }
  }
}

export const careWorkspaceResolver = new CareWorkspaceResolver();
export default careWorkspaceResolver;
