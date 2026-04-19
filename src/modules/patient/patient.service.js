/**
 * Patient Domain — Service Layer
 * ✅ Semua Firebase call dilokalisir di sini.
 * ❌ Komponen UI TIDAK boleh import firebase/firestore langsung.
 */
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

/**
 * Mendaftarkan pasien baru dan menghasilkan MRN otomatis.
 * @param {Object} patientData
 * @param {string} registeredBy - email staff yang mendaftar
 * @returns {Promise<import('../../core/types').Patient>}
 */
export const registerPatient = async (patientData, registeredBy) => {
  const randomMRN = Math.floor(100000 + Math.random() * 900000);
  const formattedMRN = `00-${String(randomMRN).substring(0, 2)}-${String(randomMRN).substring(2, 4)}`;

  const payload = {
    ...patientData,
    mrn:           formattedMRN,
    is_active:     true,
    registered_at: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), payload);

  await createAuditLog({
    userEmail:    registeredBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: COLLECTIONS.PATIENTS,
    resourceId:   docRef.id,
    delta:        { mrn: formattedMRN, name: patientData.name },
  });

  return { id: docRef.id, ...payload };
};

/**
 * Mengambil semua pasien, diurutkan dari yang terbaru.
 * @returns {Promise<import('../../core/types').Patient[]>}
 */
export const getAllPatients = async () => {
  const q = query(
    collection(db, COLLECTIONS.PATIENTS),
    orderBy('registered_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
