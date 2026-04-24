/**
 * Admin Domain — Service Layer
 * Mengelola audit trail (read-only) dan manajemen user/role.
 */
import {
  collection, getDocs, query, orderBy, limit,
  where, updateDoc, doc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * Subscription real-time untuk Alert yang belum diresolusi (Observability).
 */
export const subscribeToActiveAlerts = (callback) => {
  const q = query(
    collection(db, COLLECTIONS.ALERTS),
    where('resolved', '==', false),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
};

/**
 * Subscription real-time untuk Patient Flow (Observability).
 * Menghitung distribusi status encounter yang sedang aktif.
 */
export const subscribeToPatientFlowMetrics = (callback) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS),
    where('status', '!=', 'DISCHARGED')
  );
  
  return onSnapshot(q, (snap) => {
    const counts = {
      WAITING: 0,
      TRIAGE: 0,
      IN_TREATMENT: 0,
      TOTAL: snap.size
    };
    
    snap.docs.forEach(d => {
      const status = d.data().status;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    callback(counts);
  });
};

/**
 * Fetch data telemetry kesehatan sistem.
 */
export const fetchSystemHealth = async () => {
  const q = query(
    collection(db, COLLECTIONS.SYSTEM_METRICS),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

/**
 * Fetch logs dari audit_logs collection (Admin only).
 */
export const fetchAuditLogs = async (logLimit = 100) => {
  const q = query(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    orderBy('timestamp', 'desc'),
    limit(logLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch semua user untuk manajemen role.
 */
export const fetchAllUsers = async () => {
  const q = query(collection(db, COLLECTIONS.USERS), orderBy('email', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Update role user (Junction point untuk syncUserRole Cloud Function).
 * @param {string} userId
 * @param {string} newRole
 * @param {string} adminEmail
 */
export const updateUserRole = async (userId, newRole, adminEmail) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("User record not found in Firestore.");
    
    const oldRole = userSnap.data().role;

    // 1. Update User Role & Metadata
    transaction.update(userRef, {
      role: newRole,
      updated_at: serverTimestamp(),
      _last_modified_by: adminEmail
    });

    // 2. Atomic Audit Log Entry
    transaction.set(auditRef, {
      timestamp: serverTimestamp(),
      user: adminEmail,
      action: AUDIT_ACTIONS.UPDATE,
      resource_type: COLLECTIONS.USERS,
      resource_id: userId,
      delta: { role: { before: oldRole, after: newRole } },
      source: 'WEB_APP_ADMIN',
      reason: 'ADMIN_ROLE_MANAGEMENT'
    });
  });

  console.log(`[AdminService] Role for ${userId} successfully updated to ${newRole} with audit log.`);
};
