/**
 * NurseFlow Enterprise HIS 2026 — Phase D0: UI Runtime Safety Contract
 * 
 * Core Mandates:
 * 1. Single Source of Truth (SSOT) Clinical Context Binding.
 * 2. Asynchronous Response Context-Matching Guard (Auto-abort in-flight requests on patient switch).
 * 3. Canonical Safety Error-to-Clinical-UX Mapper (Transforms 400/422 errors into Actionable Modals).
 * 4. Stale-State and Race-Condition Invalidation Barrier.
 * 
 * Standards: Joint Commission International (JCI IPSG 1 & 2), NIST IR 7804 EHR Safety Rubric.
 */

export const CLINICAL_SAFETY_ACTIONS = {
  SHOW_ALLERGY_OVERRIDE_MODAL: 'SHOW_ALLERGY_OVERRIDE_MODAL',
  SHOW_DDI_OVERRIDE_MODAL: 'SHOW_DDI_OVERRIDE_MODAL',
  PROMPT_WITNESS_NURSE_PIN: 'PROMPT_WITNESS_NURSE_PIN',
  SHOW_CRITICAL_PANIC_INTERRUPT: 'SHOW_CRITICAL_PANIC_INTERRUPT',
  PROMPT_STALE_RECORD_REFRESH: 'PROMPT_STALE_RECORD_REFRESH',
  BLOCK_UNAUTHORIZED_MUTATION: 'BLOCK_UNAUTHORIZED_MUTATION',
  GENERIC_SAFETY_ERROR: 'GENERIC_SAFETY_ERROR'
};

/**
 * 1. Enforces that a clinical mutation is strictly bound to an active patient and encounter.
 */
export function enforceActiveClinicalContext(context, operationName = 'Operasi Klinis') {
  if (!context || !context.patientId) {
    const error = new Error(`[SAFETY_BLOCKED] ${operationName} ditolak: Konteks Pasien Wajib Dipilih (Standar JCI IPSG 1).`);
    error.code = 'NO_ACTIVE_PATIENT_CONTEXT';
    error.isSafetyViolation = true;
    throw error;
  }
  return true;
}

/**
 * 2. Creates an AbortController bound to the active patient.
 * Automatically aborts pending async fetch/calculations if the clinician switches patients in-flight.
 */
export function createContextBoundAbortController(activePatientId) {
  const controller = new AbortController();

  if (typeof window !== 'undefined' && window.addEventListener && activePatientId) {
    const handleSwitch = (e) => {
      if (e.detail?.patientId !== activePatientId) {
        controller.abort(new Error(`[CONTEXT_SWITCHED] Permintaan dibatalkan otomatis karena konteks pasien berpindah ke ${e.detail?.patientId}.`));
        window.removeEventListener('nurseflow:context-switched', handleSwitch);
      }
    };
    window.addEventListener('nurseflow:context-switched', handleSwitch);
  }

  return controller;
}

/**
 * 3. Verifies that an incoming asynchronous payload matches the active UI context before state commit.
 * Prevents race condition where slow async response for Patient A commits to Patient B's open chart.
 */
export function validateResponseContextLineage(payloadPatientId, activePatientId) {
  if (!payloadPatientId || !activePatientId) return true; // Non-patient-specific payload
  if (payloadPatientId !== activePatientId) {
    console.warn(`[SAFETY_RACE_INTERCEPTED] Respons untuk Pasien [${payloadPatientId}] dibuang karena pengguna telah beralih ke Pasien [${activePatientId}].`);
    return false;
  }
  return true;
}

/**
 * 4. Canonical Backend Safety Error Mapper
 * Translates backend domain codes into structured actionable clinical UI intents.
 */
export function mapBackendSafetyErrorToClinicalAction(error) {
  if (!error) return null;

  const code = error.code || error.error || error.name || '';
  const message = error.message || error.detail || 'Terjadi kesalahan keselamatan klinis.';

  switch (code) {
    case 'ALLERGY_HARD_STOP':
      return {
        action: CLINICAL_SAFETY_ACTIONS.SHOW_ALLERGY_OVERRIDE_MODAL,
        severity: 'CRITICAL_HARD_STOP',
        requiresJustification: true,
        title: '⛔ Peringatan Alergi Berat (Hard-Stop CDSS)',
        message,
        details: error.details || []
      };

    case 'OVERRIDE_REASON_REQUIRED':
      return {
        action: CLINICAL_SAFETY_ACTIONS.SHOW_ALLERGY_OVERRIDE_MODAL,
        severity: 'WARNING',
        requiresJustification: true,
        title: 'Alasan Justifikasi Klinis Wajib Diisi',
        message: 'Mohon cantumkan justifikasi klinis mendalam (minimal 5 karakter) untuk melanjutkan peresepan.'
      };

    case 'DDI_SEVERE_WARNING':
    case 'SEVERE_DDI_BLOCKED':
      return {
        action: CLINICAL_SAFETY_ACTIONS.SHOW_DDI_OVERRIDE_MODAL,
        severity: 'CRITICAL_HARD_STOP',
        requiresJustification: true,
        title: '⚠️ Interaksi Obat Berat (Severe DDI)',
        message,
        details: error.details || []
      };

    case 'HIGH_ALERT_DUAL_SIGN_REQUIRED':
      return {
        action: CLINICAL_SAFETY_ACTIONS.PROMPT_WITNESS_NURSE_PIN,
        severity: 'MANDATORY_WITNESS',
        requiresJustification: false,
        title: '🔐 Verifikasi Ganda Perawat Saksi (High-Alert / Narkotika)',
        message
      };

    case 'EMERGENCY_PANIC':
    case 'CRITICAL_PANIC_ACK_REQUIRED':
      return {
        action: CLINICAL_SAFETY_ACTIONS.SHOW_CRITICAL_PANIC_INTERRUPT,
        severity: 'JCI_IPSG2_PANIC',
        requiresJustification: true,
        title: '🚨 HASIL KRITIS LABORATORIUM (PANIC VALUE INTERRUPT)',
        message
      };

    case 'CONCURRENCY_CONFLICT':
    case 'CONCURRENT_MODIFICATION':
      return {
        action: CLINICAL_SAFETY_ACTIONS.PROMPT_STALE_RECORD_REFRESH,
        severity: 'OCC_CONFLICT',
        requiresJustification: false,
        title: '🔄 Konflik Modifikasi Rekam Medis (Optimistic Concurrency)',
        message: 'Data rekam medis pasien telah diperbarui oleh pengguna lain. Mohon muat ulang untuk mencegah penimpaan data.'
      };

    case 'FORBIDDEN_PRESCRIBER_ROLE':
    case 'ROLE_FORBIDDEN':
      return {
        action: CLINICAL_SAFETY_ACTIONS.BLOCK_UNAUTHORIZED_MUTATION,
        severity: 'RBAC_REJECTED',
        requiresJustification: false,
        title: 'Wewenang Ditolak (RBAC)',
        message
      };

    default:
      return {
        action: CLINICAL_SAFETY_ACTIONS.GENERIC_SAFETY_ERROR,
        severity: 'ERROR',
        requiresJustification: false,
        title: 'Pemberitahuan Sistem',
        message
      };
  }
}
