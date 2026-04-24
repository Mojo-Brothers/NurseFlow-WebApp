import { db } from '../../../core/firebase.js';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * PFR Service — Patient and Family Rights (Fase 35).
 * Ensures privacy, dignity, and informed medical consent.
 */

/**
 * Submit a Digital Informed Consent.
 */
export const submitInformedConsent = async (consentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.INFORMED_CONSENTS), {
      ...consentData,
      timestamp: serverTimestamp(),
      status: 'ACTIVE'
    });

    await createAuditLog({
      userEmail: consentData.doctorEmail,
      action: AUDIT_ACTIONS.CONSENT_SIGNED,
      resourceType: 'informed_consent',
      resourceId: docRef.id,
      delta: { procedure: consentData.procedure }
    });

    return docRef.id;
  } catch (error) {
    console.error('[PFRService] Error submitting consent:', error);
    throw error;
  }
};

/**
 * Update Patient Privacy Preferences (e.g. DNR, Confidentiality).
 */
export const updatePrivacyPreference = async (patientId, preferences, userEmail) => {
  try {
    const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
    await updateDoc(patientRef, {
      privacyPreferences: preferences,
      updatedAt: serverTimestamp()
    });

    await createAuditLog({
      userEmail,
      action: AUDIT_ACTIONS.PRIVACY_UPDATE,
      resourceType: 'patient_privacy',
      resourceId: patientId,
      delta: preferences
    });
  } catch (error) {
    console.error('[PFRService] Error updating privacy:', error);
    throw error;
  }
};

/**
 * Submit a Patient Complaint (JCI PFR.4).
 */
export const submitComplaint = async (complaintData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.COMPLAINTS), {
      ...complaintData,
      status: 'OPEN',
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('[PFRService] Error submitting complaint:', error);
    throw error;
  }
};

/**
 * Get all active complaints (Admin/Supervisor view).
 */
export const getActiveComplaints = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.COMPLAINTS),
      where('status', '==', 'OPEN')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[PFRService] Error fetching complaints:', error);
    return [];
  }
};

/**
 * Get all consents for a specific patient.
 */
export const getPatientConsents = async (patientId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INFORMED_CONSENTS),
      where('patientId', '==', patientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[PFRService] Error fetching consents:', error);
    return [];
  }
};
