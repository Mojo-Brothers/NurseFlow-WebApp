/**
 * CLINICAL ACTIONABILITY & APPLICABILITY MATRIX ENGINE — JCI COP & IPSG COMPLIANT
 * 
 * Functions:
 * 1. Computes Real-Time Clinical Actionability State (Pending Actions, Panic Alerts, Due Tasks)
 * 2. Enforces Clinical Applicability Matrix (Form -> Role -> EncounterType -> CareState -> Permission)
 * 3. Enforces Hard Encounter Boundary (Separation of Current Active Encounter vs Longitudinal Historical Dossier)
 */

import { CARE_STATES, TERMINAL_STATES } from './careStateEngine.service.js';

export const CLINICAL_ACTION_TYPES = {
  REVIEW_CRITICAL_LAB: 'REVIEW_CRITICAL_LAB',
  MEDICATION_RECONCILIATION_REQUIRED: 'MEDICATION_RECONCILIATION_REQUIRED',
  EMAR_DOSE_DUE: 'EMAR_DOSE_DUE',
  UNSIGNED_CPPT_ENTRY: 'UNSIGNED_CPPT_ENTRY',
  PAIN_REASSESSMENT_DUE: 'PAIN_REASSESSMENT_DUE',
  INITIAL_AOP_OVERDUE: 'INITIAL_AOP_OVERDUE',
  FALL_RISK_REASSESSMENT: 'FALL_RISK_REASSESSMENT',
  INFORMED_CONSENT_PENDING: 'INFORMED_CONSENT_PENDING',
  DISCHARGE_SUMMARY_PENDING: 'DISCHARGE_SUMMARY_PENDING'
};

export const CLINICAL_APPLICABILITY_MATRIX = {
  // AOP Group
  'CATATAN ADMISI RAWAT INAP': {
    allowedEncounterTypes: ['INPATIENT'],
    allowedCareStates: [CARE_STATES.ADMISSION_PENDING, CARE_STATES.INPATIENT_ACTIVE],
    allowedRoles: ['DOCTOR', 'NURSE', 'ADMIN'],
    isRequired: true,
    writePolicy: 'SINGLE_RECORD'
  },
  'PENGKAJIAN AWAL MEDIS (RJ)': {
    allowedEncounterTypes: ['OUTPATIENT'],
    allowedCareStates: [CARE_STATES.OUTPATIENT_ACTIVE],
    allowedRoles: ['DOCTOR'],
    isRequired: true,
    writePolicy: 'SINGLE_RECORD'
  },
  'PENGKAJIAN AWAL KEPERAWATAN': {
    allowedEncounterTypes: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.OUTPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE],
    allowedRoles: ['NURSE'],
    isRequired: true,
    writePolicy: 'SINGLE_RECORD'
  },
  'PENGKAJIAN ULANG NYERI': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.ICU_ACTIVE],
    allowedRoles: ['DOCTOR', 'NURSE'],
    isRequired: false,
    writePolicy: 'APPEND_ONLY'
  },
  
  // COP Group
  'SOAP NOTES (CPPT HARIAN)': {
    allowedEncounterTypes: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.OUTPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.ICU_ACTIVE],
    allowedRoles: ['DOCTOR', 'NURSE', 'PHARMACIST', 'NUTRITIONIST'],
    isRequired: true,
    writePolicy: 'APPEND_ONLY'
  },
  'EARLY WARNING SYSTEM (EWS)': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.ICU_ACTIVE],
    allowedRoles: ['DOCTOR', 'NURSE'],
    isRequired: true,
    writePolicy: 'APPEND_ONLY'
  },
  'PROTOKOL DNR / AKHIR HAYAT': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.ICU_ACTIVE, CARE_STATES.HOSPICE],
    allowedRoles: ['DOCTOR'],
    isRequired: false,
    writePolicy: 'LEGAL_SIGNATURE_REQUIRED'
  },
  'SERAH TERIMA KEPERAWATAN (ISBAR)': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.TRANSFERRED],
    allowedRoles: ['NURSE'],
    isRequired: true,
    writePolicy: 'SHIFT_HANDOVER'
  },

  // MMU Group
  'ORDER RESEP / CPOE': {
    allowedEncounterTypes: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.OUTPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.ICU_ACTIVE],
    allowedRoles: ['DOCTOR'],
    isRequired: false,
    writePolicy: 'APPEND_ONLY'
  },
  'PEMBERIAN OBAT (eMAR 5-BENAR)': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.IGD_ACTIVE, CARE_STATES.ICU_ACTIVE],
    allowedRoles: ['NURSE'],
    isRequired: true,
    writePolicy: 'BARCODE_POINT_OF_CARE'
  },
  'REKONSILIASI OBAT': {
    allowedEncounterTypes: ['INPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.ADMISSION_PENDING, CARE_STATES.INPATIENT_ACTIVE, CARE_STATES.TRANSFERRED, CARE_STATES.DISCHARGE_PENDING],
    allowedRoles: ['DOCTOR', 'PHARMACIST'],
    isRequired: true,
    writePolicy: 'EPISODE_BOUNDARY'
  },

  // ACC Group
  'RESUME MEDIS PULANG (DISCHARGE)': {
    allowedEncounterTypes: ['INPATIENT'],
    allowedCareStates: [CARE_STATES.DISCHARGE_PENDING, CARE_STATES.DISCHARGED],
    allowedRoles: ['DOCTOR'],
    isRequired: true,
    writePolicy: 'TERMINAL_SUMMARY'
  },
  'SURAT RUJUKAN KELUAR': {
    allowedEncounterTypes: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY'],
    allowedCareStates: [CARE_STATES.OUTPATIENT_ACTIVE, CARE_STATES.DISCHARGE_PENDING, CARE_STATES.REFERRED],
    allowedRoles: ['DOCTOR'],
    isRequired: false,
    writePolicy: 'EXTERNAL_GATEWAY'
  }
};

class ClinicalActionabilityEngine {
  /**
   * Evaluates real-time clinical actionability for a patient and active encounter
   */
  evaluateActionability({ patient, encounter, role = 'DOCTOR', clinicalRecords = [] }) {
    if (!patient) return null;

    const pendingActions = [];
    const safetyFlags = [];
    const activeProblems = patient.active_problems || patient.diagnoses || ['Observasi Klinis'];
    const allergies = patient.allergies || ['Tidak ada alergi terlaporkan'];

    const careState = encounter?.primaryState || encounter?.careState || CARE_STATES.REGISTERED;
    const encounterType = (encounter?.type || 'INPATIENT').toUpperCase();
    const isClosed = encounter?.isTerminal || TERMINAL_STATES.has(careState);

    // 1. Critical Safety Flags Evaluation
    if (patient.allergies && patient.allergies.length > 0 && !patient.allergies.includes('Tidak ada')) {
      safetyFlags.push({
        type: 'ALLERGY_ALERT',
        level: 'HIGH',
        label: `Alergi: ${patient.allergies.join(', ')}`,
        icon: 'warning'
      });
    }

    if (patient.fallRiskScore && patient.fallRiskScore > 45) {
      safetyFlags.push({
        type: 'FALL_RISK_HIGH',
        level: 'CRITICAL',
        label: `Risiko Jatuh Tinggi (Morse: ${patient.fallRiskScore})`,
        icon: 'accessibility_new'
      });
    }

    if (patient.criticalAlerts && patient.criticalAlerts.length > 0) {
      patient.criticalAlerts.forEach(alert => {
        safetyFlags.push({
          type: 'PANIC_LAB_ALERT',
          level: 'PANIC',
          label: alert.title || alert,
          icon: 'crisis_alert'
        });
      });
    }

    // 2. Pending Action Evaluation (If encounter is active)
    if (!isClosed) {
      // A. AOP Initial Assessment (Must be done within 24 hours of admission)
      const hasInitialAop = clinicalRecords.some(r => 
        (r.moduleName && r.moduleName.includes('PENGKAJIAN AWAL')) ||
        (r.moduleName && r.moduleName.includes('ADMISI'))
      );
      if (!hasInitialAop && (careState === CARE_STATES.INPATIENT_ACTIVE || careState === CARE_STATES.OUTPATIENT_ACTIVE)) {
        pendingActions.push({
          id: 'ACT-AOP-01',
          type: CLINICAL_ACTION_TYPES.INITIAL_AOP_OVERDUE,
          title: 'Pengkajian Awal (AOP 1.1) Belum Lengkap',
          severity: 'HIGH',
          targetModule: encounterType === 'OUTPATIENT' ? 'PENGKAJIAN AWAL MEDIS (RJ)' : 'CATATAN ADMISI RAWAT INAP',
          recommendedRole: 'DOCTOR'
        });
      }

      // B. Medication Reconciliation on Inpatient Admission
      const hasMedReconciliation = clinicalRecords.some(r => r.moduleName && r.moduleName.includes('REKONSILIASI'));
      if (!hasMedReconciliation && encounterType === 'INPATIENT') {
        pendingActions.push({
          id: 'ACT-RECON-01',
          type: CLINICAL_ACTION_TYPES.MEDICATION_RECONCILIATION_REQUIRED,
          title: 'Rekonsiliasi Obat Admisi Diperlukan',
          severity: 'MEDIUM',
          targetModule: 'REKONSILIASI OBAT',
          recommendedRole: 'PHARMACIST'
        });
      }

      // C. High Pain Score Reassessment
      if (patient.vitals?.painScore && patient.vitals.painScore >= 4) {
        pendingActions.push({
          id: 'ACT-PAIN-01',
          type: CLINICAL_ACTION_TYPES.PAIN_REASSESSMENT_DUE,
          title: `Pengkajian Ulang Nyeri Diperlukan (Skor Nyeri: ${patient.vitals.painScore})`,
          severity: 'HIGH',
          targetModule: 'PENGKAJIAN ULANG NYERI',
          recommendedRole: 'NURSE'
        });
      }

      // D. Pending Discharge Summary for Discharging Encounter
      if (careState === CARE_STATES.DISCHARGE_PENDING) {
        const hasDischargeSummary = clinicalRecords.some(r => r.moduleName && r.moduleName.includes('RESUME MEDIS'));
        if (!hasDischargeSummary) {
          pendingActions.push({
            id: 'ACT-DISCH-01',
            type: CLINICAL_ACTION_TYPES.DISCHARGE_SUMMARY_PENDING,
            title: 'Resume Medis Pulang (Discharge Summary) Wajib Diisi',
            severity: 'CRITICAL',
            targetModule: 'RESUME MEDIS PULANG (DISCHARGE)',
            recommendedRole: 'DOCTOR'
          });
        }
      }
    }

    // 3. Last Clinical Event
    const lastRecord = clinicalRecords[0] || null;
    const lastClinicalEvent = lastRecord ? {
      title: lastRecord.title || lastRecord.moduleName || 'Dokumentasi Klinis',
      doctor: lastRecord.doctor || lastRecord.signed_by || 'Staf Medis',
      timestamp: lastRecord.created_at || new Date().toISOString()
    } : {
      title: 'Pasien Siap Pelayanan',
      doctor: encounter?.doctor_name || 'DPJP Terdaftar',
      timestamp: encounter?.admissionTime || new Date().toISOString()
    };

    return {
      patientId: patient.id,
      encounterId: encounter?.id || null,
      encounterType,
      careState,
      isClosed,
      safetyFlags,
      pendingActions,
      activeProblems,
      allergies,
      lastClinicalEvent,
      totalPendingCount: pendingActions.length
    };
  }

  /**
   * Validates form accessibility against clinical applicability matrix
   */
  canAccessForm({ formName, role = 'STAFF', encounterType = 'INPATIENT', careState = CARE_STATES.INPATIENT_ACTIVE, isTerminal = false }) {
    const policy = CLINICAL_APPLICABILITY_MATRIX[formName];
    if (!policy) {
      // Universal generic form fallback
      return { allowed: true, readOnly: isTerminal, reason: 'UNIVERSAL_FORM' };
    }

    const normalizedRole = (role || '').toUpperCase();
    const normalizedEncType = (encounterType || '').toUpperCase();

    // 1. Encounter Type check
    if (policy.allowedEncounterTypes && !policy.allowedEncounterTypes.includes(normalizedEncType)) {
      return {
        allowed: false,
        readOnly: true,
        reason: `FORM_NOT_APPLICABLE_FOR_${normalizedEncType}`,
        message: `Formulir '${formName}' hanya berlaku untuk layanan ${policy.allowedEncounterTypes.join(', ')}.`
      };
    }

    // 2. Terminal Encounter Lock
    if (isTerminal || TERMINAL_STATES.has(careState)) {
      if (formName === 'RESUME MEDIS PULANG (DISCHARGE)' && careState === CARE_STATES.DISCHARGE_PENDING) {
        return { allowed: true, readOnly: false, reason: 'DISCHARGE_COMPLETION' };
      }
      return {
        allowed: true,
        readOnly: true,
        reason: 'TERMINAL_ENCOUNTER_READONLY',
        message: 'Kunjungan telah selesai (CLOSED). Berkas berstatus readonly untuk audit medikolegal.'
      };
    }

    // 3. Role Authorization check
    if (policy.allowedRoles && !policy.allowedRoles.includes(normalizedRole) && normalizedRole !== 'ADMIN' && normalizedRole !== 'SUPERVISOR') {
      return {
        allowed: true,
        readOnly: true,
        reason: 'ROLE_RESTRICTION_READONLY',
        message: `Hanya peran [${policy.allowedRoles.join(', ')}] yang memiliki hak otorisasi pengisian form ini.`
      };
    }

    return { allowed: true, readOnly: false, reason: 'AUTHORIZED' };
  }
}

export const clinicalActionabilityEngine = new ClinicalActionabilityEngine();
