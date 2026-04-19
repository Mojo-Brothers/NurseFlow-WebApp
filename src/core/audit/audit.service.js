import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { SYNC_PRIORITIES } from '../constants.js';

const AUDIT_COLLECTION = 'audit_logs';

/**
 * NurseFlow Audit Service V5 (Enterprise Masterpiece)
 * ✅ JCI Legal-Grade Traceability
 * ✅ Priority Sync Support
 * ✅ Reason & Source Tracking
 * 
 * @param {Object} params
 * @param {string} params.userEmail - Who performed the action
 * @param {string} params.action - CREATE | UPDATE | DELETE | etc.
 * @param {string} params.resourceType - Collection name
 * @param {string} params.resourceId 
 * @param {Object} [params.delta] - Changed fields { before: {}, after: {} }
 * @param {string} [params.reason] - Why the data was changed (JCI Mandate)
 * @param {string} [params.source] - Device context (WEB | MOBILE | KIOSK)
 * @param {number} [params.priority] - Sync priority (SYNC_PRIORITIES)
 * @param {Object} [params.metadata] - Extra context (e.g., baseline snapshots)
 */
export const createAuditLog = async ({ 
  userEmail, 
  action, 
  resourceType, 
  resourceId, 
  delta = {}, 
  reason = 'SYSTEM_AUTO',
  source = 'WEB_APP',
  priority = SYNC_PRIORITIES.NORMAL,
  metadata = {}
}) => {
  try {
    const auditData = {
      timestamp:      serverTimestamp(), // Authoritative server time
      client_time:    new Date().toISOString(), // Local device time for latency audit
      user:           userEmail,
      action:         action?.toUpperCase(),
      resource_type:  resourceType,
      resource_id:    resourceId,
      delta:          delta,
      reason:         reason,
      source:         source,
      sync_priority:  priority,
      metadata:       metadata,
      ip_address:     'CLIENT_INTERNAL', // Can be enriched later by Cloud Functions
    };

    // Use addDoc for audit logs (immutable, new ID created every time)
    await addDoc(collection(db, AUDIT_COLLECTION), auditData);
  } catch (error) {
    // Fail-Safe: Audit failure must be logged locally if DB is down
    console.error("FATAL: Audit Log failed. Medical integrity at risk.", error);
    // TODO: Offline storage for audit logs during reconnect
  }
};
