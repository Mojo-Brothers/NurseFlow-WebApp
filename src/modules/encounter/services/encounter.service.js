/**
 * Encounter Domain — Service Layer (Step 5c)
 * Encounter = satu episode kunjungan pasien (IGD / Rawat Jalan / Rawat Inap)
 * Setiap Triage & EMR HARUS terkait ke Encounter.
 */
import {
  collection, addDoc, getDocs, query,
  where, orderBy, limit, updateDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * @typedef {'EMERGENCY' | 'OUTPATIENT' | 'INPATIENT' | 'PLANNED'} EncounterType
 * @typedef {'ACTIVE' | 'COMPLETED' | 'TRANSFERRED' | 'DISCHARGED'} EncounterStatus
 */

/**
 * Membuka encounter baru (episode kunjungan).
 * @param {Object} params
 * @param {string} params.patientId
 * @param {EncounterType} params.encounterType
 * @param {string} params.chiefComplaint
 * @param {string} params.admittingDoctor   - email dokter
 * @param {string} params.nurseInCharge     - email perawat
 * @param {string} params.ward
 * @param {string} params.createdBy         - email staff yang membuka
 * @returns {Promise<string>} - encounter ID
 */
export const createEncounter = async ({
  patientId,
  encounterType,
  chiefComplaint,
  admittingDoctor,
  nurseInCharge,
  ward,
  createdBy,
}) => {
  const payload = {
    patient_id:         patientId,
    encounter_type:     encounterType,
    chief_complaint:    chiefComplaint,
    admitting_doctor:   admittingDoctor,
    nurse_in_charge:    nurseInCharge,
    ward,
    bed_number:         null,
    status:             'ACTIVE',
    admitted_at:        serverTimestamp(),
    discharged_at:      null,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.ENCOUNTERS), payload);

  await createAuditLog({
    userEmail:    createdBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: COLLECTIONS.ENCOUNTERS,
    resourceId:   docRef.id,
    delta:        { patientId, encounterType, chiefComplaint },
  });

  return docRef.id;
};

/**
 * Discharge (tutup) encounter pasien.
 * @param {string} encounterId
 * @param {string} closedBy - email staff
 */
export const dischargeEncounter = async (encounterId, closedBy) => {
  const ref = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
  await updateDoc(ref, {
    status:        'DISCHARGED',
    discharged_at: serverTimestamp(),
  });

  await createAuditLog({
    userEmail:    closedBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: COLLECTIONS.ENCOUNTERS,
    resourceId:   encounterId,
    delta:        { status: { before: 'ACTIVE', after: 'DISCHARGED' } },
  });
};

/**
 * Ambil semua encounter aktif (untuk monitoring dashboard).
 * @param {number} [maxResults=20]
 * @returns {Promise<Object[]>}
 */
export const getActiveEncounters = async (maxResults = 20) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS),
    where('status', '==', 'ACTIVE'),
    orderBy('admitted_at', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Ambil semua encounter milik satu pasien.
 * @param {string} patientId
 */
export const getPatientEncounters = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS),
    where('patient_id', '==', patientId),
    orderBy('admitted_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
