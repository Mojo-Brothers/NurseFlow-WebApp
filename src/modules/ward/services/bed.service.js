/**
 * Bed Domain — Service Layer
 * Visual Ward Management & ADT (Admission, Discharge, Transfer) Logic.
 */
import { 
  collection, doc, getDocs, query, where, orderBy, 
  serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, SYNC_PRIORITIES } from '../../../core/constants.js';

/**
 * Mengambil daftar seluruh tempat tidur di bangsal.
 */
export const getAllBeds = async () => {
  const q = query(collection(db, COLLECTIONS.BEDS), orderBy('bed_name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Menempatkan pasien ke Bed tertentu (ADT Assignment).
 */
export const assignBed = async (bedId, encounterId, patientId, userEmail) => {
  const bedRef = doc(db, COLLECTIONS.BEDS, bedId);
  const timestamp = serverTimestamp();

  try {
    await runTransaction(db, async (transaction) => {
      const bedSnap = await transaction.get(bedRef);
      if (!bedSnap.exists()) throw new Error('Bed tidak ditemukan.');
      if (bedSnap.data().is_occupied) throw new Error('Bed sudah terisi oleh pasien lain.');

      transaction.update(bedRef, {
        is_occupied:  true,
        encounter_id: encounterId,
        patient_id:   patientId,
        assigned_at:  timestamp,
        assigned_by:  userEmail
      });

      // Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          userEmail,
        action:        AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.BEDS,
        resource_id:   bedId,
        reason:        'PATIENT_BED_ASSIGNMENT',
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta:         { encounter_id: encounterId, is_occupied: true }
      });
    });
  } catch (err) {
    console.error('[BedService] Assign failed:', err);
    throw err;
  }
};

/**
 * Melepaskan Bed (Discharge/Transfer).
 */
export const releaseBed = async (bedId, userEmail) => {
  const bedRef = doc(db, COLLECTIONS.BEDS, bedId);
  const timestamp = serverTimestamp();

  try {
    await runTransaction(db, async (transaction) => {
      transaction.update(bedRef, {
        is_occupied:  false,
        encounter_id: null,
        patient_id:   null,
        released_at:  timestamp
      });

      // Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          userEmail,
        action:        AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.BEDS,
        resource_id:   bedId,
        reason:        'PATIENT_BED_RELEASE',
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta:         { is_occupied: false }
      });
    });
  } catch (err) {
    console.error('[BedService] Release failed:', err);
    throw err;
  }
};
