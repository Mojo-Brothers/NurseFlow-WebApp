/**
 * NurseFlow Enterprise HIS 2026 — Universal Audit Trail Engine
 * Centralized Single Source of Truth for all domain audits (JCI 7th Edition & KARS).
 */

const AUDIT_STORAGE_KEY = 'nurseflow_universal_audit_trail';

const getStoredAuditLogs = () => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[UniversalAuditTrail] Failed to read audit trail store:', e);
  }
  return [
    {
      id: 'AUD-INIT-01',
      event_type: 'INITIAL_SEED',
      entity_type: 'SYSTEM_CONFIG',
      entity_id: 'ENTERPRISE_CORE',
      before_state: null,
      after_state: { version: '2026-v5', status: 'ACTIVE' },
      actor: 'system@nurseflow.id',
      timestamp: new Date().toISOString(),
      branch_id: 'BRN-JKT-PST',
      ip_address: '127.0.0.1',
      reason: 'Inisialisasi Fondasi Master Data Enterprise Revisi 5'
    }
  ];
};

const saveStoredAuditLogs = (logs) => {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('[UniversalAuditTrail] Failed to persist audit trail store:', e);
  }
};

export const universalAuditTrailService = {
  /**
   * Log universal mutation event
   */
  logEvent: async ({
    eventType, // 'CREATE', 'UPDATE', 'SOFT_DELETE', 'MRN_MERGE', 'TRIAGE_ASSIGN', 'TRANSFER_BED', 'QUEUE_CALL'
    entityType, // 'PATIENT', 'ENCOUNTER', 'BED', 'TARIFF', 'MEDICATION', 'USER', 'QUEUE'
    entityId,
    beforeState = null,
    afterState = null,
    actor = 'admin@nurseflow.id',
    branchId = 'BRN-JKT-PST',
    ipAddress = '127.0.0.1',
    reason = ''
  }) => {
    const now = new Date().toISOString();
    const auditRecord = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      before_state: beforeState,
      after_state: afterState,
      actor,
      timestamp: now,
      branch_id: branchId,
      ip_address: ipAddress,
      reason
    };

    const currentLogs = getStoredAuditLogs();
    saveStoredAuditLogs([auditRecord, ...currentLogs]);
    return auditRecord;
  },

  /**
   * Query unified audit logs with filters
   */
  getAuditLogs: (filters = {}) => {
    let logs = getStoredAuditLogs();

    if (filters.entityType) {
      logs = logs.filter(l => l.entity_type === filters.entityType);
    }
    if (filters.entityId) {
      logs = logs.filter(l => l.entity_id === filters.entityId);
    }
    if (filters.actor) {
      logs = logs.filter(l => l.actor?.toLowerCase().includes(filters.actor.toLowerCase()));
    }
    if (filters.branchId) {
      logs = logs.filter(l => l.branch_id === filters.branchId);
    }

    return logs;
  }
};
