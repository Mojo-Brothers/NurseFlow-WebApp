import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

const AUDIT_COLLECTION = 'audit_logs';

/**
 * Creates an immutable audit trail entry obeying JCI standards.
 * Signature changed to single object for consistency with modular services.
 * @param {Object} params
 * @param {string} params.userEmail
 * @param {string} params.action - CREATE | UPDATE | DELETE | etc.
 * @param {string} params.resourceType - collection name
 * @param {string} params.resourceId 
 * @param {Object} [params.delta] - changed fields
 */
export const createAuditLog = async ({ userEmail, action, resourceType, resourceId, delta = {} }) => {
  try {
    const auditData = {
      timestamp:      serverTimestamp(),
      user:           userEmail,
      action:         action?.toUpperCase(),
      resource_type:  resourceType,
      resource_id:    resourceId,
      delta:          delta,
      ip_address:     'CLIENT_INTERNAL'
    };

    await addDoc(collection(db, AUDIT_COLLECTION), auditData);
  } catch (error) {
    console.error("FATAL: Audit Log failed to write.", error);
  }
};
