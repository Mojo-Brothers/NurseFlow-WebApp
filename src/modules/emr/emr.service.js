/**
 * EMR Domain — Service Layer
 * ✅ Abstraksi penuh untuk electronic medical records.
 * ✅ Append-only: tidak ada metode delete/update pada record medis.
 */
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

/**
 * Menyimpan SOAP note dan memicu audit log secara otomatis.
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.doctorEmail
 * @param {Object} params.soapData
 * @returns {Promise<string>} - ID dokumen EMR baru
 */
export const saveSoapNote = async ({ patientId, doctorEmail, soapData }) => {
  const payload = {
    patientId,
    doctor:           doctorEmail,
    type:             'SOAP_NOTE',
    subjective:       soapData.subjective,
    objective:        soapData.objective,
    assessment:       soapData.assessment,
    plan_medications: soapData.plan_medications || [],
    plan_instructions: soapData.plan_instructions || '',
    created_at:       serverTimestamp(),
    is_locked:        true, // Append-only — langsung dikunci saat disimpan
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.MEDICAL_RECORDS), payload);

  await createAuditLog({
    userEmail:    doctorEmail,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: COLLECTIONS.MEDICAL_RECORDS,
    resourceId:   docRef.id,
    delta: {
      patientId,
      assessment:    soapData.assessment,
      medications:   soapData.plan_medications,
    },
  });

  return docRef.id;
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
