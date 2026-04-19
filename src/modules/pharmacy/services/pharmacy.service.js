/**
 * Pharmacy Domain — Service Layer
 * Mengelola e-resep dan dispensing obat.
 * Pharmacist hanya bisa UPDATE status — tidak bisa CREATE/DELETE.
 */
import {
  collection, addDoc, getDocs, query, where,
  orderBy, updateDoc, doc, serverTimestamp, limit,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';

/**
 * @typedef {'PENDING' | 'DISPENSED' | 'ADMINISTERED' | 'CANCELLED'} MedStatus
 */

/**
 * Tambah satu/banyak medication order dari dokter (Spark compatible).
 * @param {Object[]} medications - Array medication objects
 * @param {string} encounterId   - WAJIB: Link ke kunjungan
 * @param {string} prescribedBy  - email dokter
 * @returns {Promise<string[]>} - array of dokumen IDs
 */
export const prescribeMedications = async (medications, encounterId, prescribedBy) => {
  if (!encounterId) throw new Error('Encounter ID wajib disediakan untuk peresepan.');

  const timestamp = serverTimestamp();
  const ids = [];

  try {
    await runTransaction(db, async (transaction) => {
      for (const med of medications) {
        const medRef = doc(collection(db, COLLECTIONS.MEDICATIONS));
        
        const payload = {
          ...med,
          encounter_id:   encounterId,
          prescribed_by:  prescribedBy,
          status:         'PENDING',
          prescribed_at:  timestamp,
          dispensed_at:   null,
          dispensed_by:   null,
        };

        transaction.set(medRef, payload);
        ids.push(medRef.id);

        // 2. Alert Trigger Manual: Cek rute berisiko tinggi (IV, SC, IM)
        const highRiskRoutes = ['IV', 'SC', 'IM', 'INTRAVENA', 'SUBCUTAN'];
        const route = (med.route || '').toUpperCase();

        if (highRiskRoutes.some(r => route.includes(r))) {
          const alertRef = doc(collection(db, 'alerts'));
          transaction.set(alertRef, {
            type:          'PARENTERAL_MEDICATION',
            patient_id:    med.patient_id,
            med_order_id:  medRef.id,
            med_name:      med.medication_name,
            route:         med.route,
            triggered_at:  timestamp,
            triggered_by:  prescribedBy,
            resolved:      false,
            message:       `🔔 PARENTERAL ALERT: ${med.medication_name} via ${med.route}. Pastikan observasi pasca-pemberian.`,
          });
        }
      }

      // 3. Multi-resource Audit
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          prescribedBy,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.MEDICATIONS,
        resource_id:   ids.join(','),
        delta: { 
          encounterId, 
          count: medications.length, 
          meds: medications.map(m => m.medication_name) 
        },
        source: 'CLIENT_TRANSACTION_SPARK'
      });
    });

    return ids;
  } catch (err) {
    console.error('[PharmacyService] Prescription transaction failed:', err);
    throw err;
  }
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
