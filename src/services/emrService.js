import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createAuditLog } from './auditService';

const EMR_COLLECTION = 'medical_records';

/**
 * Saves a SOAP note to the database and automatically triggers an Audit Log.
 */
export const saveSoapNote = async (patientId, doctorEmail, soapData) => {
  try {
    const recordPayload = {
      patientId,
      doctor: doctorEmail,
      type: 'SOAP_NOTE',
      subjective: soapData.subjective,
      objective: soapData.objective,
      assessment: soapData.assessment,
      plan_medications: soapData.plan_medications || [],
      plan_instructions: soapData.plan_instructions,
      created_at: serverTimestamp(),
      is_locked: false // Indicates if the record is still amendable
    };

    // 1. Write the EMR Document
    const docRef = await addDoc(collection(db, EMR_COLLECTION), recordPayload);
    
    // 2. Automatically dispatch the Audit Log
    await createAuditLog(doctorEmail, "CREATE", EMR_COLLECTION, docRef.id, recordPayload);

    return docRef.id;
  } catch (error) {
    console.error("Failed to save SOAP note:", error);
    throw error;
  }
};

/**
 * Fetches medical records for a specific patient.
 */
export const getPatientRecords = async (patientId) => {
  try {
    const q = query(
      collection(db, EMR_COLLECTION), 
      where("patientId", "==", patientId),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const records = [];
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });
    return records;
  } catch (error) {
    console.error("Failed to fetch EMR history:", error);
    throw error;
  }
};
