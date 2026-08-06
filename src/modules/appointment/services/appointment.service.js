import { collection, doc, serverTimestamp, runTransaction, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, SYNC_PRIORITIES } from '../../../core/constants.js';

/**
 * Membuat janji temu baru (Phase 1)
 */
export const createAppointment = async (appointmentData, createdBy) => {
  const appointmentRef = doc(collection(db, COLLECTIONS.APPOINTMENTS || 'appointments'));
  
  try {
    await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();
      
      const payload = {
        ...appointmentData,
        status: 'BOOKED',
        created_at: timestamp,
        created_by: createdBy || 'system',
      };
      
      transaction.set(appointmentRef, payload);
      
      // Audit Log
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user: createdBy || 'system',
        action: AUDIT_ACTIONS.CREATE,
        resource_type: 'appointments',
        resource_id: appointmentRef.id,
        reason: 'NEW_APPOINTMENT_BOOKING',
        source: 'WEB_APP',
        sync_priority: SYNC_PRIORITIES.NORMAL,
        delta: { appointment_date: appointmentData.schedule?.date }
      });
    });
    return appointmentRef.id;
  } catch (error) {
    console.error('[AppointmentService] Create failed:', error);
    throw error;
  }
};

/**
 * Mengambil daftar janji temu terbaru
 */
export const getLatestAppointments = async (maxResults = 50) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.APPOINTMENTS || 'appointments'),
      orderBy('created_at', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[AppointmentService] Fetch failed:', error);
    return [];
  }
};
