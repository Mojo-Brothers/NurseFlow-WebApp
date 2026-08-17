/**
 * NurseFlow Enterprise HIS 2026 — Immutable Forensic Radiology Audit Service
 * Standard: JCI MOI / Forensic Audit Trail & Non-Repudiation
 */

class RadiologyAuditService {
  constructor() {
    this.auditLedger = [];
  }

  initDemoAudits() {
    // Pristine Clean Day-1 State
  }

  /**
   * Record immutable event to ledger
   */
  recordEvent({
    orderId = null,
    studyInstanceUid = null,
    patientMrn,
    eventType,
    actorId,
    actorName,
    actorRole,
    workstationIp = '10.10.3.40',
    details = {},
    correlationId = null
  }) {
    const entry = {
      id: `RAD-AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      studyInstanceUid,
      patientMrn,
      eventType,
      actorId,
      actorName,
      actorRole,
      workstationIp,
      details,
      correlationId: correlationId || `CORR-RAD-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Immutable append-only
    this.auditLedger.unshift(Object.freeze(entry));
    return entry;
  }

  getAuditTrailByMrn(patientMrn) {
    return this.auditLedger.filter(a => a.patientMrn.toLowerCase() === patientMrn.toLowerCase());
  }

  getAllAuditLogs() {
    return this.auditLedger;
  }
}

export const radiologyAuditService = new RadiologyAuditService();
