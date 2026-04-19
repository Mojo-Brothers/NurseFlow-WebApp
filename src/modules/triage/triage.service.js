/**
 * Triage Domain — Service Layer
 * ✅ Satu-satunya tempat yang boleh menulis ke 'triage_logs'.
 * ✅ Setiap submit WAJIB dipasangkan dengan audit log (JCI).
 * ❌ Firebase TIDAK pernah dipanggil dari komponen Triage UI.
 */
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, TRIAGE_LEVELS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

/**
 * Submit data triage + otomatis trigger audit log.
 * @param {Object} params
 * @param {string} params.patientId
 * @param {import('../../core/types').VitalSigns} params.vitals
 * @param {number} params.news2Score
 * @param {import('../../core/types').TriageLevel} params.triageLevel
 * @param {string} params.assessedBy - email perawat
 * @returns {Promise<string>} - ID dokumen triage yang baru
 */
export const submitTriage = async ({ patientId, vitals, news2Score, triageLevel, assessedBy }) => {
  const payload = {
    patientId,
    vitals: {
      heartRate:      Number(vitals.heartRate),
      systolicBP:     Number(vitals.systolicBP),
      diastolicBP:    Number(vitals.diastolicBP),
      spo2:           Number(vitals.spo2),
      temperature:    Number(vitals.temperature),
    },
    news2_score:   news2Score,
    triage_level:  triageLevel,
    assessed_by:   assessedBy,
    timestamp:     serverTimestamp(),
  };

  // 1. Tulis ke triage_logs
  const docRef = await addDoc(collection(db, COLLECTIONS.TRIAGE_LOGS), payload);

  // 2. WAJIB: Tulis audit log bersamaan (JCI requirement)
  await createAuditLog({
    userEmail:    assessedBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: COLLECTIONS.TRIAGE_LOGS,
    resourceId:   docRef.id,
    delta: {
      patientId,
      news2_score:   news2Score,
      triage_level:  triageLevel,
    },
  });

  return docRef.id;
};

/**
 * Ambil riwayat triage untuk satu pasien.
 * @param {string} patientId
 * @param {number} [limitCount=10]
 * @returns {Promise<import('../../core/types').TriageLog[]>}
 */
export const getPatientTriageLogs = async (patientId, limitCount = 10) => {
  const q = query(
    collection(db, COLLECTIONS.TRIAGE_LOGS),
    where('patientId', '==', patientId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
