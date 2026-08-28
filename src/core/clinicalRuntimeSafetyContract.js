/**
 * NurseFlow Enterprise HIS 2026 — Canonical Clinical Runtime Safety Contract
 * Standards: Joint Commission International (JCI), ISO/IEC 27001, RFC 7807 Problem Details, E5-F Audit Trail
 * 
 * Mandates:
 * 1. Fail-closed context locking before any clinical mutation.
 * 2. Active AbortController on patient-switch to kill in-flight requests.
 * 3. Deterministic response lineage validation to reject stale/cross-patient commits.
 * 4. Authoritative RFC 7807 422 error to UI Safety Modal mapping.
 * 5. E5-F WORM audit trail correlation with mandatory override reason tracking.
 */

export const CLINICAL_SAFETY_CONTRACT_VERSION = '1.0.0-D0.5';

/**
 * Standard Clinical Safety Error Codes
 */
export const ClinicalSafetyErrorCode = Object.freeze({
  ALLERGY_HARD_STOP: 'ALLERGY_HARD_STOP',
  DRUG_ALLERGY_CONTRAINDICATION: 'DRUG_ALLERGY_CONTRAINDICATION',
  HIGH_ALERT_DUAL_SIGN_REQUIRED: 'HIGH_ALERT_DUAL_SIGN_REQUIRED',
  EMERGENCY_PANIC: 'EMERGENCY_PANIC',
  CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
  PATIENT_CONTEXT_MISMATCH: 'PATIENT_CONTEXT_MISMATCH',
  CLINICAL_CONTEXT_LOCK_FAILURE: 'CLINICAL_CONTEXT_LOCK_FAILURE',
  LINEAGE_SAFETY_BREACH: 'LINEAGE_SAFETY_BREACH',
  ENCOUNTER_TERMINAL_STATE: 'ENCOUNTER_TERMINAL_STATE',
  CARE_STATE_TRANSITION_INVALID: 'CARE_STATE_TRANSITION_INVALID',
  INCOMPLETE_CLINICAL_INDICATION: 'INCOMPLETE_CLINICAL_INDICATION',
  INSUFFICIENT_FEFO_STOCK: 'INSUFFICIENT_FEFO_STOCK',
  STR_SIP_EXPIRED: 'STR_SIP_EXPIRED'
});

/**
 * Clinical Context Lock Exception (Fail-Closed)
 */
export class ClinicalContextLockError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ClinicalContextLockError';
    this.code = ClinicalSafetyErrorCode.CLINICAL_CONTEXT_LOCK_FAILURE;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Clinical Lineage Breach Exception (Patient Switch / Stale Response)
 */
export class ClinicalLineageBreachError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ClinicalLineageBreachError';
    this.code = ClinicalSafetyErrorCode.LINEAGE_SAFETY_BREACH;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Asserts that a clinical mutation request contains an active, valid patient and encounter context.
 * Strict fail-closed discipline: Throws ClinicalContextLockError if context is missing or invalid.
 */
export function assertClinicalContextLock(context = {}) {
  if (!context || typeof context !== 'object') {
    throw new ClinicalContextLockError(
      '[CRITICAL_SAFETY_FAIL_CLOSED] Clinical mutation blocked: Context is null or not an object.',
      { received: context }
    );
  }

  const patientId = context.patientId || context.patient_id || context.patient?.id;
  const encounterId = context.encounterId || context.encounter_id || context.encounter?.id;

  if (!patientId || String(patientId).trim() === '') {
    throw new ClinicalContextLockError(
      '[CRITICAL_SAFETY_FAIL_CLOSED] Clinical mutation blocked: Missing authoritative patientId.',
      { context }
    );
  }

  return {
    patientId: String(patientId).trim(),
    encounterId: encounterId ? String(encounterId).trim() : null,
    tenantId: context.tenantId || context.tenant_id || 'DEFAULT_TENANT',
    actorId: context.actorId || context.actor_id || context.userId || 'SYSTEM_ACTOR',
    actorRole: context.role || context.actorRole || 'PRACTITIONER',
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Clinical Execution Context tracking an active patient/encounter workspace.
 * Automatically wraps an AbortController for active in-flight network cancellation on patient-switch.
 */
export class ClinicalExecutionContext {
  constructor({
    patientId,
    encounterId = null,
    tenantId = 'DEFAULT_TENANT',
    actorId = 'SYSTEM',
    actorRole = 'PRACTITIONER'
  }) {
    if (!patientId) {
      throw new ClinicalContextLockError('Cannot instantiate ClinicalExecutionContext without patientId');
    }

    this.contextId = `CTX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.patientId = String(patientId).trim();
    this.encounterId = encounterId ? String(encounterId).trim() : null;
    this.tenantId = String(tenantId).trim();
    this.actorId = String(actorId).trim();
    this.actorRole = String(actorRole).trim();
    this.issuedAt = Date.now();
    this.abortController = new AbortController();
    this.isAborted = false;
    this.abortReason = null;
  }

  get signal() {
    return this.abortController.signal;
  }

  abort(reason = 'PATIENT_SWITCH_OR_CONTEXT_INVALIDATION') {
    if (this.isAborted) return;
    this.isAborted = true;
    this.abortReason = reason;
    try {
      this.abortController.abort({
        reason,
        contextId: this.contextId,
        patientId: this.patientId,
        encounterId: this.encounterId,
        abortedAt: Date.now()
      });
    } catch {
      this.abortController.abort();
    }
  }

  validateResponseLineage(responseMeta = {}) {
    const respPatientId = responseMeta.patientId || responseMeta.patient_id;
    const respEncounterId = responseMeta.encounterId || responseMeta.encounter_id;

    if (this.isAborted) {
      throw new ClinicalLineageBreachError(
        `[LINEAGE_SAFETY_BREACH] Response arrived for context ${this.contextId} after it was aborted. Mutation discarded.`,
        { contextId: this.contextId, patientId: this.patientId, abortReason: this.abortReason }
      );
    }

    if (respPatientId && String(respPatientId).trim() !== this.patientId) {
      throw new ClinicalLineageBreachError(
        `[LINEAGE_SAFETY_BREACH] Response patientId (${respPatientId}) does not match active workspace patientId (${this.patientId}). State mutation strictly blocked.`,
        { expectedPatientId: this.patientId, receivedPatientId: respPatientId }
      );
    }

    if (this.encounterId && respEncounterId && String(respEncounterId).trim() !== this.encounterId) {
      throw new ClinicalLineageBreachError(
        `[LINEAGE_SAFETY_BREACH] Response encounterId (${respEncounterId}) does not match active workspace encounterId (${this.encounterId}). State mutation strictly blocked.`,
        { expectedEncounterId: this.encounterId, receivedEncounterId: respEncounterId }
      );
    }

    return true;
  }
}

/**
 * Validates lineage between an incoming response and the currently active UI workspace context.
 */
export function validateResponseContextLineage(incomingContext = {}, activeContext = null) {
  if (!activeContext) {
    throw new ClinicalLineageBreachError(
      '[LINEAGE_SAFETY_BREACH] Mutation rejected: No active clinical workspace context found.',
      { incomingContext }
    );
  }

  const inPatientId = incomingContext.patientId || incomingContext.patient_id;
  const inEncounterId = incomingContext.encounterId || incomingContext.encounter_id;
  const activePatientId = activeContext.patientId || activeContext.patient_id;
  const activeEncounterId = activeContext.encounterId || activeContext.encounter_id;

  if (!activePatientId) {
    throw new ClinicalLineageBreachError(
      '[LINEAGE_SAFETY_BREACH] Active clinical context lacks patientId.',
      { activeContext }
    );
  }

  if (inPatientId && String(inPatientId).trim() !== String(activePatientId).trim()) {
    throw new ClinicalLineageBreachError(
      `[LINEAGE_SAFETY_BREACH] Cross-patient data mutation blocked. Incoming data for patient [${inPatientId}] cannot mutate active patient [${activePatientId}].`,
      { incomingPatientId: inPatientId, activePatientId }
    );
  }

  if (inEncounterId && activeEncounterId && String(inEncounterId).trim() !== String(activeEncounterId).trim()) {
    throw new ClinicalLineageBreachError(
      `[LINEAGE_SAFETY_BREACH] Cross-encounter data mutation blocked. Incoming data for encounter [${inEncounterId}] cannot mutate active encounter [${activeEncounterId}].`,
      { incomingEncounterId: inEncounterId, activeEncounterId }
    );
  }

  return true;
}

/**
 * Maps RFC 7807 Problem Details and Network Errors to Authoritative UI Clinical Safety Actions (Modals)
 */
export function mapErrorToClinicalSafetyAction(error = {}) {
  const code = error.code || error.error_code || error.type?.split('/').pop() || 'UNKNOWN_ERROR';
  const status = error.status || error.statusCode || 500;
  const correlationId = error.correlationId || error.correlation_id || `CORR-GEN-${Date.now()}`;
  const detail = error.detail || error.message || 'Terjadi kendala pada pemrosesan klinis.';

  // 1. ALLERGY HARD STOP (HTTP 422 / DRUG_ALLERGY_CONTRAINDICATION)
  if (
    code === ClinicalSafetyErrorCode.ALLERGY_HARD_STOP ||
    code === ClinicalSafetyErrorCode.DRUG_ALLERGY_CONTRAINDICATION ||
    detail.toLowerCase().includes('alergi') ||
    detail.toLowerCase().includes('allergy')
  ) {
    return {
      requiresModal: true,
      modalType: 'ALLERGY_HARD_STOP',
      severity: 'CRITICAL',
      title: '🚨 PERINGATAN KRITIS: KONTRAINDIKASI ALERGI OBAT',
      message: detail,
      code: ClinicalSafetyErrorCode.ALLERGY_HARD_STOP,
      correlationId,
      canOverride: true,
      requiresOverrideReason: true,
      requiresDualSign: false,
      recommendedAction: 'Hentikan peresepan atau lakukan telaah rasio risiko-manfaat dengan dokter spesialis farmakologi.'
    };
  }

  // 2. HIGH ALERT MEDICATION & DUAL SIGN REQUIRED
  if (
    code === ClinicalSafetyErrorCode.HIGH_ALERT_DUAL_SIGN_REQUIRED ||
    detail.toLowerCase().includes('dual-sign') ||
    detail.toLowerCase().includes('high alert') ||
    detail.toLowerCase().includes('saksi')
  ) {
    return {
      requiresModal: true,
      modalType: 'HIGH_ALERT_DUAL_SIGN',
      severity: 'HIGH',
      title: '⚠️ VERIFIKASI GANDA OBAT HIGH-ALERT DIPERLUKAN (JCI IPSG.3)',
      message: detail,
      code: ClinicalSafetyErrorCode.HIGH_ALERT_DUAL_SIGN_REQUIRED,
      correlationId,
      canOverride: false,
      requiresOverrideReason: false,
      requiresDualSign: true,
      recommendedAction: 'Wajibkan perawat verifikator ke-2 memasukkan PIN/kredensial sebelum pemberian obat dieksekusi.'
    };
  }

  // 3. EMERGENCY PANIC VALUE ALERT
  if (
    code === ClinicalSafetyErrorCode.EMERGENCY_PANIC ||
    detail.toLowerCase().includes('panic') ||
    detail.toLowerCase().includes('kritis')
  ) {
    return {
      requiresModal: true,
      modalType: 'EMERGENCY_PANIC',
      severity: 'CRITICAL',
      title: '⚡ NILAI KRITIS LABORATORIUM / DIAGNOSTIK (PANIC VALUE)',
      message: detail,
      code: ClinicalSafetyErrorCode.EMERGENCY_PANIC,
      correlationId,
      canOverride: true,
      requiresOverrideReason: true,
      requiresDualSign: false,
      recommendedAction: 'Segera lakukan read-back SBAR ke DPJP dalam waktu maksimal 15 menit.'
    };
  }

  // 4. CONCURRENCY CONFLICT & OPTIMISTIC LOCKING
  if (
    status === 409 ||
    code === ClinicalSafetyErrorCode.CONCURRENCY_CONFLICT ||
    code === 'CONCURRENCY_CONFLICT_VERSION_MISMATCH' ||
    detail.toLowerCase().includes('conflict') ||
    detail.toLowerCase().includes('versi')
  ) {
    return {
      requiresModal: true,
      modalType: 'CONCURRENCY_CONFLICT',
      severity: 'HIGH',
      title: '🔄 KONFLIK PEMBARUAN DATA (CONCURRENCY CONFLICT)',
      message: 'Rekam medis ini baru saja diperbarui oleh tenaga medis lain. Untuk mencegah data tertimpa, silakan muat ulang data terbaru.',
      code: ClinicalSafetyErrorCode.CONCURRENCY_CONFLICT,
      correlationId,
      canOverride: false,
      requiresOverrideReason: false,
      requiresDualSign: false,
      recommendedAction: 'Muat ulang data rekam medis untuk meninjau perubahan terakhir sebelum menyimpan kembali.'
    };
  }

  // 5. PATIENT / ENCOUNTER TERMINAL STATE OR CONTEXT MISMATCH
  if (
    code === ClinicalSafetyErrorCode.PATIENT_CONTEXT_MISMATCH ||
    code === ClinicalSafetyErrorCode.LINEAGE_SAFETY_BREACH ||
    code === ClinicalSafetyErrorCode.ENCOUNTER_TERMINAL_STATE ||
    code === 'ENCOUNTER_TERMINAL_STATE'
  ) {
    return {
      requiresModal: true,
      modalType: 'CLINICAL_WARNING',
      severity: 'HIGH',
      title: '🛑 PELANGGARAN KONTEKS / STATUS KUNJUNGAN TERMINAL',
      message: detail,
      code,
      correlationId,
      canOverride: false,
      requiresOverrideReason: false,
      requiresDualSign: false,
      recommendedAction: 'Periksa kembali rekam medis pasien yang aktif di navigasi.'
    };
  }

  // Default Standard Warning Modal or Toast
  return {
    requiresModal: status >= 500 || status === 422,
    modalType: 'STANDARD_ERROR',
    severity: status >= 500 ? 'CRITICAL' : 'MODERATE',
    title: '⚠️ KENDALA PEMROSESAN KLINIS',
    message: detail,
    code,
    correlationId,
    canOverride: false,
    requiresOverrideReason: false,
    requiresDualSign: false,
    recommendedAction: 'Silakan periksa kembali kelengkapan formulir klinis atau hubungi IT Support.'
  };
}

/**
 * Creates an authoritative E5-F forensic safety override payload ready for WORM audit persistence.
 */
export function createSafetyOverridePayload({
  safetyCode,
  overrideReason,
  witnessId = null,
  correlationId = null,
  patientId,
  encounterId = null,
  actorId = 'SYSTEM',
  actorRole = 'DOCTOR',
  originalPayload = {}
}) {
  if (!overrideReason || String(overrideReason).trim().length < 5) {
    throw new Error('[E5-F_SAFETY_VIOLATION] Override reason must be provided and contain at least 5 characters of clinical justification.');
  }

  if (!patientId) {
    throw new Error('[E5-F_SAFETY_VIOLATION] Cannot log safety override without valid patientId.');
  }

  return {
    eventType: 'CLINICAL_SAFETY_OVERRIDE',
    safetyCode: String(safetyCode).trim(),
    patientId: String(patientId).trim(),
    encounterId: encounterId ? String(encounterId).trim() : null,
    actorId: String(actorId).trim(),
    actorRole: String(actorRole).trim(),
    witnessId: witnessId ? String(witnessId).trim() : null,
    overrideReason: String(overrideReason).trim(),
    correlationId: correlationId || `CORR-OVR-${Date.now()}`,
    originalPayloadSnapshot: JSON.parse(JSON.stringify(originalPayload || {})),
    timestamp: new Date().toISOString(),
    isImmutable: true,
    targetAuditTable: 'universal_audit_logs'
  };
}

/**
 * Global Clinical Execution Workspace Manager (Singleton)
 */
class ClinicalWorkspaceManager {
  constructor() {
    this.activeContext = null;
    this.listeners = new Set();
  }

  getActiveContext() {
    return this.activeContext;
  }

  switchPatient(patientId, encounterId = null, metadata = {}) {
    if (this.activeContext) {
      this.activeContext.abort(`PATIENT_SWITCH_TO_${patientId}`);
    }

    this.activeContext = new ClinicalExecutionContext({
      patientId,
      encounterId,
      ...metadata
    });

    this.notifyListeners();
    return this.activeContext;
  }

  clearContext() {
    if (this.activeContext) {
      this.activeContext.abort('CONTEXT_CLEARED');
      this.activeContext = null;
      this.notifyListeners();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.activeContext);
      } catch (err) {
        console.error('[ClinicalWorkspaceManager] Listener error:', err);
      }
    }
  }
}

export const clinicalWorkspaceManager = new ClinicalWorkspaceManager();
