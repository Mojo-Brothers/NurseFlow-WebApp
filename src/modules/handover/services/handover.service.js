/**
 * Handover Domain — Service Layer
 * Structured SBAR (Situation, Background, Assessment, Recommendation) logic.
 */
import { 
  collection, doc, getDocs, query, where, orderBy, limit, 
  serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, SYNC_PRIORITIES } from '../../../core/constants.js';

/**
 * Menyimpan catatan serah terima SBAR.
 */
export const saveHandover = async (handoverData) => {
  const handoverRef = doc(collection(db, COLLECTIONS.HANDOVER_LOGS));
  const timestamp = serverTimestamp();

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(handoverRef, {
        ...handoverData,
        timestamp,
        _v: 1
      });

      // Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          handoverData.sender_email,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.HANDOVER_LOGS,
        resource_id:   handoverRef.id,
        reason:        'SHIFT_HANDOVER_SBAR',
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta:         { patient_id: handoverData.patient_id }
      });
    });

    return handoverRef.id;
  } catch (err) {
    console.error('[HandoverService] Save failed:', err);
    throw err;
  }
};

/**
 * Mengambil catatan serah terima terakhir untuk pasien.
 */
export const getLatestHandover = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.HANDOVER_LOGS),
    where('patient_id', '==', patientId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};
