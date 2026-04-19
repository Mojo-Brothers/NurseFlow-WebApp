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
  const userSnap = await getDocs(query(collection(db, COLLECTIONS.USERS), where('uid', '==', userId)));
  let oldRole = 'UNKNOWN';

  if (!userSnap.empty) {
    oldRole = userSnap.docs[0].data().role;
  }

  // Update Firestore
  await updateDoc(userRef, {
    role: newRole,
    updated_at: serverTimestamp()
  });

  // Log audit
  await createAuditLog({
    userEmail: adminEmail,
    action: AUDIT_ACTIONS.UPDATE,
    resourceType: COLLECTIONS.USERS,
    resourceId: userId,
    delta: { role: { before: oldRole, after: newRole } }
  });

  console.log(`[AdminService] Role for ${userId} updated to ${newRole}`);
};
