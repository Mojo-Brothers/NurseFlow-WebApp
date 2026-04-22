/**
 * Reporting Domain — Service Layer
 * Aggregates all clinical modules into a unified context for summary reports.
 */
import { 
  collection, getDocs, query, where, doc, getDoc, orderBy 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * Mengambil konteks lengkap satu Encounter (Identitas, Triage, EMR, Billing).
 */
export const getFullEncounterContext = async (encounterId) => {
  try {
    // 1. Get Core Encounter
    const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
    const encounterSnap = await getDoc(encounterRef);
    if (!encounterSnap.exists()) throw new Error('Encounter tidak ditemukan.');
    const encounter = { id: encounterSnap.id, ...encounterSnap.data() };

    // 2. Get Patient Data
    const patientRef = doc(db, COLLECTIONS.PATIENTS, encounter.patient_id);
    const patientSnap = await getDoc(patientRef);
    const patient = patientSnap.exists() ? { id: patientSnap.id, ...patientSnap.data() } : null;

    // 3. Get Triage Logs (Chronological)
    const triageQuery = query(
      collection(db, COLLECTIONS.TRIAGE_LOGS),
      where('encounterId', '==', encounterId),
      orderBy('timestamp', 'asc')
    );
    const triageSnap = await getDocs(triageQuery);
    const triageLogs = triageSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 4. Get EMR Records (SOAP Notes - Chronological)
    const soapQuery = query(
      collection(db, COLLECTIONS.EMR_RECORDS),
      where('encounter_id', '==', encounterId),
      orderBy('created_at', 'asc')
    );
    const soapSnap = await getDocs(soapQuery);
    const soapRecords = soapSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 5. Get Billing Summary
    const billingQuery = query(
      collection(db, COLLECTIONS.BILLING),
      where('encounter_id', '==', encounterId)
    );
    const billingSnap = await getDocs(billingQuery);
    const billing = billingSnap.empty ? null : { id: billingSnap.docs[0].id, ...billingSnap.docs[0].data() };

    return {
      encounter,
      patient,
      triageLogs,
      soapRecords,
      billing,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('[ReportingService] Context aggregation failed:', err);
    throw err;
  }
};
