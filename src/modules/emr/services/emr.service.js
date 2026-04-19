/**
 * EMR Domain — Service Layer
 * ✅ Abstraksi penuh untuk electronic medical records.
 * ✅ Append-only: tidak ada metode delete/update pada record medis.
 */
import { collection, getDocs, query, where, orderBy, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';

/**
 * Menyimpan SOAP note dan memicu audit log secara atomik (Spark compatible).
 * @param {Object} params
 */
export const saveSoapNote = async ({ patientId, encounterId, doctorEmail, soapData }) => {
  if (!encounterId) throw new Error('Encounter ID wajib disediakan untuk registrasi EMR.');

  const recordRef = doc(collection(db, COLLECTIONS.MEDICAL_RECORDS));
  const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));

  try {
    await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();

      const payload = {
        patientId,
        encounterId,
        doctor:           doctorEmail,
        type:             'SOAP_NOTE',
        subjective:       soapData.subjective,
        objective:        soapData.objective,
        assessment:       soapData.assessment,
        plan_medications: soapData.plan_medications || [],
        plan_instructions: soapData.plan_instructions || '',
        created_at:       timestamp,
        is_locked:        true,
      };

      // 1. Simpan SOAP Note
      transaction.set(recordRef, payload);

      // 2. Audit Log (JCI requirement)
      transaction.set(auditRef, {
        timestamp,
        user:          doctorEmail,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.MEDICAL_RECORDS,
        resource_id:   recordRef.id,
        delta: {
          patientId,
          encounterId,
          assessment:    soapData.assessment,
          medications:   soapData.plan_medications,
        },
        source: 'CLIENT_TRANSACTION_SPARK'
      });
    });

    return recordRef.id;
  } catch (err) {
    console.error('[EmrService] SOAP transaction failed:', err);
    throw err;
  }
};

/**
 * Mengambil semua rekam medis pasien (diurutkan terbaru).
 * @param {string} patientId
 * @returns {Promise<import('../../core/types').SoapNote[]>}
 */
export const getPatientRecords = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.MEDICAL_RECORDS),
    where('patientId', '==', patientId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
