/**
 * Pharmacy Domain — Service Layer
 * Mengelola e-resep dan dispensing obat.
 * Pharmacist hanya bisa UPDATE status — tidak bisa CREATE/DELETE.
 */
import {
  collection, addDoc, getDocs, query, where,
  orderBy, updateDoc, doc, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

/**
 * @typedef {'PENDING' | 'DISPENSED' | 'ADMINISTERED' | 'CANCELLED'} MedStatus
 */

/**
 * Tambah satu/banyak medication order dari dokter.
 * @param {Object[]} medications - Array medication objects
 * @param {string} prescribedBy  - email dokter
 * @returns {Promise<string[]>} - array of dokumen IDs
 */
export const prescribeMedications = async (medications, prescribedBy) => {
  const ids = [];
  for (const med of medications) {
    const payload = {
      ...med,
      prescribed_by:  prescribedBy,
      status:         'PENDING',
      prescribed_at:  serverTimestamp(),
      dispensed_at:   null,
      dispensed_by:   null,
    };
    const ref = await addDoc(collection(db, COLLECTIONS.MEDICATIONS), payload);
    ids.push(ref.id);
  }

  await createAuditLog({
    userEmail:    prescribedBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: COLLECTIONS.MEDICATIONS,
    resourceId:   ids.join(','),
    delta:        { count: medications.length, medications: medications.map(m => m.medication_name) },
  });

  return ids;
};

/**
 * Farmasi: Dispensing obat (update status PENDING → DISPENSED).
 * @param {string} medicationId
 * @param {string} dispensedBy - email apoteker
 */
export const dispenseMedication = async (medicationId, dispensedBy) => {
  const ref = doc(db, COLLECTIONS.MEDICATIONS, medicationId);
  await updateDoc(ref, {
    status:       'DISPENSED',
    dispensed_at: serverTimestamp(),
    dispensed_by: dispensedBy,
  });

  await createAuditLog({
    userEmail:    dispensedBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: COLLECTIONS.MEDICATIONS,
    resourceId:   medicationId,
    delta:        { status: { before: 'PENDING', after: 'DISPENSED' } },
  });
};

/**
 * Batalkan medication order (doctor atau admin only — via Firestore rule).
 */
export const cancelMedication = async (medicationId, cancelledBy) => {
  const ref = doc(db, COLLECTIONS.MEDICATIONS, medicationId);
  await updateDoc(ref, { status: 'CANCELLED' });

  await createAuditLog({
    userEmail:    cancelledBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: COLLECTIONS.MEDICATIONS,
    resourceId:   medicationId,
    delta:        { status: { before: 'PENDING', after: 'CANCELLED' } },
  });
};

/**
 * Ambil semua resep PENDING untuk antrian farmasi.
 */
export const getPendingMedications = async () => {
  const q = query(
    collection(db, COLLECTIONS.MEDICATIONS),
    where('status', '==', 'PENDING'),
    orderBy('prescribed_at', 'asc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Ambil semua resep milik satu pasien.
 */
export const getPatientMedications = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.MEDICATIONS),
    where('patient_id', '==', patientId),
    orderBy('prescribed_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
