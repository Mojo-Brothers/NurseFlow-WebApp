/**
 * Admin Domain — Alert Management Service (V10 Chaos Resilience)
 * ✅ Purifikasi: Deduplikasi alert untuk mencegah Fatigue.
 * ✅ Akuntabilitas: Alur Active -> Acknowledged -> Resolved.
 * ✅ Eskalasi: Jejak audit penugasan owner.
 */

import {
  collection, addDoc, getDocs, query, orderBy, limit,
  where, updateDoc, doc, serverTimestamp, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, ALERT_STATUSES, AUDIT_ACTIONS, SLA_TARGETS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * Membuat alert baru dengan mekanisme deduplikasi (mencegah spam).
 * @param {Object} alertData - { patientId, type, message, severity, userEmail }
 */
export const createAlertWithDeduplication = async ({ patientId, type, message, severity, userEmail }) => {
  // 1. Cek deduplikasi (Window 60 detik + Tipe Sama + Pasien Sama)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const q = query(
    collection(db, COLLECTIONS.ALERTS),
    where('type', '==', type),
    where('patient_id', '==', patientId),
    where('status', '==', ALERT_STATUSES.ACTIVE),
    where('created_at', '>', Timestamp.fromDate(oneMinuteAgo))
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    console.log(`[AlertService] Deduplication triggered for ${type} on patient ${patientId}. Skipping duplicate.`);
    return null;
  }

  // 2. Jika unik, buat alert baru
  const alertRef = await addDoc(collection(db, COLLECTIONS.ALERTS), {
    patient_id: patientId,
    type,
    message,
    severity,
    status: ALERT_STATUSES.ACTIVE,
    assigned_to: null,
    acknowledged_at: null,
    resolved_at: null,
    user: userEmail,
    created_at: serverTimestamp()
  });

  return alertRef.id;
};

/**
 * Acknowledge alert oleh staf (Personal Responsibility).
 * @param {string} alertId
 * @param {string} staffEmail
 */
export const acknowledgeAlert = async (alertId, staffEmail) => {
  const alertRef = doc(db, COLLECTIONS.ALERTS, alertId);
  
  await updateDoc(alertRef, {
    status: ALERT_STATUSES.ACKNOWLEDGED,
    assigned_to: staffEmail,
    acknowledged_at: serverTimestamp()
  });

  await createAuditLog({
    userEmail: staffEmail,
    action: AUDIT_ACTIONS.ALERT_ACK,
    resourceType: COLLECTIONS.ALERTS,
    resourceId: alertId,
    delta: { status: ALERT_STATUSES.ACKNOWLEDGED, owner: staffEmail }
  });
};

/**
 * Resolve alert setelah masalah selesai.
 */
export const resolveAlert = async (alertId, staffEmail) => {
  const alertRef = doc(db, COLLECTIONS.ALERTS, alertId);
  
  await updateDoc(alertRef, {
    status: ALERT_STATUSES.RESOLVED,
    resolved_at: serverTimestamp(),
    resolved_by: staffEmail
  });
};

/**
 * Cek SLA proaktif untuk pasien yang sedang menunggu.
 * Bisa dijalankan via Cloud Function atau interval di Admin Hub.
 */
export const checkAndTriggerSLAAlerts = async (encounters, userEmail) => {
  const now = Date.now();
  
  for (const encounter of encounters) {
    if (encounter.status !== 'WAITING') continue;
    
    const startTime = encounter.created_at?.toMillis ? encounter.created_at.toMillis() : encounter.created_at;
    const duration = (now - startTime) / 1000;

    if (duration > SLA_TARGETS.WAITING) {
      await createAlertWithDeduplication({
        patientId: encounter.patient_id,
        type: 'OVER_SLA',
        message: `Pasien ${encounter.patient_name || encounter.patient_id} telah menunggu > 15 menit di fase WAITING.`,
        severity: 'HIGH',
        userEmail: 'SYSTEM_WATCHDOG'
      });
    }
  }
};

/**
 * Subscription real-time untuk Alert Aktif (Command Center).
 */
export const subscribeToOperationalAlerts = (callback) => {
  const q = query(
    collection(db, COLLECTIONS.ALERTS),
    where('status', 'in', [ALERT_STATUSES.ACTIVE, ALERT_STATUSES.ACKNOWLEDGED]),
    orderBy('created_at', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
};
