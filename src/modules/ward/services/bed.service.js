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
  try {
    const q = query(collection(db, COLLECTIONS.BEDS), orderBy('bed_name', 'asc'));
    const snap = await getDocs(q);
    const firestoreBeds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (firestoreBeds.length > 0) return firestoreBeds;
  } catch (err) {
    console.warn('[BedService] Firestore query error:', err);
  }

  // Master Bed Hierarchy (Clean Initial State - All Vacant)
  const defaultMasterBeds = [
    { id: 'bed-101', bed_name: 'Bed M-101 (Bangsal Melati VVIP)', ward: 'Melati VVIP', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null },
    { id: 'bed-102', bed_name: 'Bed M-102 (Bangsal Melati VVIP)', ward: 'Melati VVIP', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null },
    { id: 'bed-201', bed_name: 'Bed ICU-01 (Intensive Care Unit)', ward: 'ICU', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null },
    { id: 'bed-202', bed_name: 'Bed ICU-02 (Intensive Care Unit)', ward: 'ICU', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null },
    { id: 'bed-301', bed_name: 'Bed IGD-RED-01 (Zona Merah)', ward: 'IGD Darurat', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null },
    { id: 'bed-302', bed_name: 'Bed IGD-YELLOW-02 (Zona Kuning)', ward: 'IGD Darurat', is_occupied: false, patient_name: null, mrn: null, gender: null, dpjp: null }
  ];

  return defaultMasterBeds;
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
