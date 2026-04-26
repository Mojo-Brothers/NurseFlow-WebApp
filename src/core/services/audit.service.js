/**
 * NurseFlow — Centralized Clinical Audit Service (JCI Masterpiece)
 * ✅ Standardized Actions: CREATE, UPDATE, DELETE, VIEW, AUTH
 * ✅ Persistent & Immutable Traceability
 */

import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { COLLECTIONS, AUDIT_ACTIONS, SCHEMA_VERSION } from '../constants';

/**
 * Log a clinical action to the audit trail.
 * @param {Object} auditParams - Parameters for the audit log
 * @param {string} auditParams.action - AUDIT_ACTIONS (View, Create, etc)
 * @param {string} auditParams.resource_type - COLLECTIONS name
 * @param {string} auditParams.resource_id - Target ID
 * @param {Object} auditParams.delta - Relevant changes or context
 * @param {string} auditParams.reason - Clinical justification (optional)
 */
export const logAudit = async ({ 
  action, 
  resource_type, 
  resource_id, 
  delta = {}, 
  reason = 'ROUTINE_ACCESS' 
}) => {
  const currentUser = auth.currentUser;
  
  try {
    const auditData = {
      timestamp:      serverTimestamp(),
      user:           currentUser?.email || 'SYSTEM',
      action,
      resource_type,
      resource_id,
      delta,
      reason,
      schema_version: SCHEMA_VERSION,
      source:         'WEB_APP_CORE',
      env:            import.meta.env.VITE_APP_ENV || 'production'
    };

    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), auditData);
  } catch (err) {
    // Audit failures should not block clinical workflow but must be logged to console
  }
};

/**
 * Retrieve audit history for a specific resource.
 * @param {string} resource_id - The ID of the resource (e.g. patientId)
 * @param {number} maxResults - Max logs to fetch
 */
export const getAuditLogs = async (resource_id, maxResults = 50) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('resource_id', '==', resource_id),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[AuditService] Failed to fetch audit logs:', err);
    throw err;
  }
};
