import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const PATIENTS_COLLECTION = 'patients';

export const registerPatient = async (patientData) => {
  try {
    // Simulasi Generate MRN (Medical Record Number)
    const randomMRN = Math.floor(100000 + Math.random() * 900000);
    const formattedMRN = `00-${String(randomMRN).substring(0, 2)}-${String(randomMRN).substring(2, 4)}`;

    const newPatient = {
      ...patientData,
      mrn: formattedMRN,
      is_active: true,
      registered_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), newPatient);
    return { id: docRef.id, ...newPatient };
  } catch (error) {
    console.error("Error registering patient: ", error);
    throw error;
  }
};

export const getPatients = async () => {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION), orderBy('registered_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const patientsList = [];
    querySnapshot.forEach((doc) => {
      patientsList.push({ id: doc.id, ...doc.data() });
    });
    return patientsList;
  } catch (error) {
    console.error("Error getting patients: ", error);
    throw error;
  }
};
