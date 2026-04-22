/**
 * Diagnostic Domain — Service Layer
 * Manages Laboratory and Radiology results integration.
 */
import { 
  collection, getDocs, query, where, orderBy, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * Mengambil seluruh hasil penunjang untuk satu kunjungan (Encounter).
 */
export const getDiagnosticContext = async (encounterId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.DIAGNOSTIC_RESULTS),
      where('encounter_id', '==', encounterId),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[DiagnosticsService] Fetch failed:', err);
    throw err;
  }
};

/**
 * BOOTSTRAP DEMO DATA
 * Menghasilkan data hasil lab/rad palsu untuk pengujian.
 */
export const bootstrapDiagnostics = async (encounterId) => {
  const demoResults = [
    {
      type: 'LAB',
      test_name: 'Full Blood Count (Hemoglobin)',
      result_value: 10.2,
      unit: 'g/dL',
      normal_range: '13.5 - 17.5',
      status: 'FINAL',
      critical: true,
      technician: 'lab.tech@nurseflow.com'
    },
    {
      type: 'LAB',
      test_name: 'Blood Glucose (Random)',
      result_value: 145,
      unit: 'mg/dL',
      normal_range: '70 - 140',
      status: 'FINAL',
      critical: false,
      technician: 'lab.tech@nurseflow.com'
    },
    {
      type: 'RAD',
      test_name: 'Chest X-Ray (AP View)',
      result_value: 'Pneumonia suspected in right lower lobe.',
      image_url: 'https://images.lifespan.org/sites/default/files/styles/manual_crop_16_9/public/2021-08/x-ray-pneumonia-924.jpg',
      status: 'FINAL',
      critical: true,
      radiologist: 'rad.doc@nurseflow.com'
    }
  ];

  for (const res of demoResults) {
    await addDoc(collection(db, COLLECTIONS.DIAGNOSTIC_RESULTS), {
      ...res,
      encounter_id: encounterId,
      created_at: serverTimestamp()
    });
  }
};
