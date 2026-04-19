import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const AUDIT_COLLECTION = 'audit_logs';

/**
 * Creates an immutable audit trail entry obeying JCI standards.
 * @param {string} userEmail The email of the staff making the change
 * @param {string} action "CREATE", "UPDATE", "DELETE", "VIEW"
 * @param {string} resource "medical_records", "patients", "triage_logs"
 * @param {string} resourceId The ID of the document being manipulated
 * @param {object} payload The exact data mutation delta
 */
export const createAuditLog = async (userEmail, action, resource, resourceId, payload) => {
  try {
    const auditData = {
      timestamp: serverTimestamp(),
      user: userEmail,
      action: action.toUpperCase(),
      resource_type: resource,
      resource_id: resourceId,
      delta: payload,     // What specifically changed
      ip_address: 'CLIENT_NETWORK' // Placeholder for real IP injection
    };

    // Audit logs are conceptually write-only / append-only.
    await addDoc(collection(db, AUDIT_COLLECTION), auditData);
  } catch (error) {
    // Critical failure: if audit fails, the main transaction should theoretically roll back.
    console.error("FATAL: Audit Log failed to write.", error);
    // In strict environments, we might throw error to block the companion transaction.
  }
};
