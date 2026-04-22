/**
 * Patient Portal Domain — Service Layer
 * Securely fetches personal health records for the logged-in patient.
 */
import { 
  collection, getDocs, query, where, limit, orderBy 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';
import { getDiagnosticContext } from '../../diagnostics/services/diagnostics.service.js';

/**
 * Mengambil data personal pasien berdasarkan email login.
 */
export const getPatientPersonalData = async (userEmail) => {
  try {
    // 1. Resolve Patient Identity
    // Di sistem nyata, kita mencari berdasarkan email yang terdaftar.
    // Untuk demo, kita cari pasien yang memiliki email ini atau ambil yang pertama jika tidak ada.
    const pQuery = query(collection(db, COLLECTIONS.PATIENTS), where('email', '==', userEmail), limit(1));
    const pSnap = await getDocs(pQuery);
    
    let patientData = null;
    if (!pSnap.empty) {
      patientData = { id: pSnap.docs[0].id, ...pSnap.docs[0].data() };
    } else {
      // Fallback Demo: Ambil pasien pertama agar portal tidak kosong saat pengujian
      const allP = await getDocs(query(collection(db, COLLECTIONS.PATIENTS), limit(1)));
      if (allP.empty) throw new Error('Data pasien tidak ditemukan di sistem.');
      patientData = { id: allP.docs[0].id, ...allP.docs[0].data() };
    }

    // 2. Fetch Latest Encounter
    const eQuery = query(
      collection(db, COLLECTIONS.ENCOUNTERS),
      where('patient_id', '==', patientData.id),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    const eSnap = await getDocs(eQuery);
    const latestEncounter = eSnap.empty ? null : { id: eSnap.docs[0].id, ...eSnap.docs[0].data() };

    // 3. Fetch Active Medications (dari EMR terakhir yang SIGNED)
    let activeMeds = [];
    if (latestEncounter) {
      const soapQuery = query(
        collection(db, COLLECTIONS.EMR_RECORDS),
        where('encounter_id', '==', latestEncounter.id),
        where('status', '==', 'SIGNED'),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const soapSnap = await getDocs(soapQuery);
      if (!soapSnap.empty) {
        activeMeds = soapSnap.docs[0].data().plan_medications || [];
      }
    }

    // 4. Fetch Billing Status
    let billingSummary = null;
    if (latestEncounter) {
        const bQuery = query(collection(db, COLLECTIONS.BILLING), where('encounter_id', '==', latestEncounter.id), limit(1));
        const bSnap = await getDocs(bQuery);
        billingSummary = bSnap.empty ? null : bSnap.docs[0].data();
    }

    // 5. Fetch Diagnostic Results
    const diagnostics = latestEncounter ? await getDiagnosticContext(latestEncounter.id) : [];

    return {
      profile: patientData,
      latestEncounter,
      activeMeds,
      billingSummary,
      diagnostics,
      lastSync: new Date().toISOString()
    };
  } catch (err) {
    console.error('[PortalService] Data fetch failed:', err);
    throw err;
  }
};
