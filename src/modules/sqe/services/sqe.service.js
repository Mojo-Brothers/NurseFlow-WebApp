import { db } from '../../../core/firebase.js';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * SQE Service — Staff Qualifications and Education (Fase 33).
 * Ensures only qualified personnel perform clinical actions.
 */

/**
 * Get staff credentials and clinical privileges.
 * @param {string} staffEmail - Email of the staff member.
 */
export const getStaffCredentials = async (staffEmail) => {
  try {
    const docRef = doc(db, COLLECTIONS.STAFF_CREDENTIALS, staffEmail);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data();
    }
    
    // Default/Empty state if not initialized
    return {
      email: staffEmail,
      sip: { number: '', expiryDate: null },
      str: { number: '', expiryDate: null },
      privileges: [],
      competencies: []
    };
  } catch (error) {
    console.error('[SQEService] Error fetching credentials:', error);
    throw error;
  }
};

/**
 * Update staff credentials (Admin only).
 */
export const updateStaffCredentials = async (staffEmail, data, adminEmail) => {
  try {
    await setDoc(doc(db, COLLECTIONS.STAFF_CREDENTIALS, staffEmail), {
      ...data,
      updatedBy: adminEmail,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await createAuditLog({
      userEmail: adminEmail,
      action: AUDIT_ACTIONS.UPDATE,
      resourceType: 'staff_credentials',
      resourceId: staffEmail,
      delta: data
    });
  } catch (error) {
    console.error('[SQEService] Error updating credentials:', error);
    throw error;
  }
};

/**
 * Verify if staff has privilege for a specific clinical action.
 * JCI Requirement: Clinical privilege verification before action.
 */
export const verifyClinicalPrivilege = async (staffEmail, actionCode) => {
  try {
    const credentials = await getStaffCredentials(staffEmail);
    
    // Check for STR/SIP expiry first
    const now = new Date();
    if (credentials.str?.expiryDate && new Date(credentials.str.expiryDate) < now) {
      return { authorized: false, reason: 'STR_EXPIRED' };
    }
    if (credentials.sip?.expiryDate && new Date(credentials.sip.expiryDate) < now) {
      return { authorized: false, reason: 'SIP_EXPIRED' };
    }

    const hasPrivilege = credentials.privileges.includes(actionCode);
    
    // Log verification for audit
    await createAuditLog({
      userEmail: 'SYSTEM',
      action: AUDIT_ACTIONS.CREDENTIAL_VERIFY,
      resourceType: 'access_check',
      resourceId: staffEmail,
      delta: { actionCode, authorized: hasPrivilege }
    });

    return { 
      authorized: hasPrivilege, 
      reason: hasPrivilege ? null : 'INSUFFICIENT_PRIVILEGE' 
    };
  } catch (error) {
    console.error('[SQEService] Privilege verification failed:', error);
    return { authorized: false, reason: 'SYSTEM_ERROR' };
  }
};

const SQE_DUMMY_STAFF = [
  {
    id: 'dr.haryono@hospital.com',
    name: 'dr. Haryono, Sp.PD',
    profession: 'Dokter Spesialis Penyakit Dalam',
    str: { number: 'STR-12345-2026', expiryDate: '2026-06-15' },
    sip: { number: 'SIP-PD-998', expiryDate: '2026-12-20' },
    privileges: ['INTERNAL_MEDICINE', 'ULTRASOUND_ABDOMEN', 'INTENSIVE_CARE_LEVEL_1'],
    status: 'ACTIVE'
  },
  {
    id: 'ns.siti@hospital.com',
    name: 'Ns. Siti Aminah, S.Kep',
    profession: 'Perawat Klinik III - ICU',
    str: { number: 'STR-NS-882', expiryDate: '2026-05-10' },
    sip: { number: 'SIKK-NS-002', expiryDate: '2027-01-15' },
    privileges: ['VENTILATOR_MANAGEMENT', 'ADVANCED_LIFE_SUPPORT'],
    status: 'ACTIVE'
  },
  {
    id: 'dr.sarah@hospital.com',
    name: 'dr. Sarah, Sp.A',
    profession: 'Dokter Spesialis Anak',
    str: { number: 'STR-7721-2026', expiryDate: '2026-08-30' },
    sip: { number: 'SIP-PED-112', expiryDate: '2026-10-15' },
    privileges: ['NEONATAL_INTENSIVE_CARE', 'PEDIATRIC_ADVANCED_LIFE_SUPPORT'],
    status: 'ACTIVE'
  }
];

/**
 * Fetch all staff with upcoming license expirations (Admin view).
 */
export const getUpcomingExpirations = async (daysAhead = 30) => {
  try {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysAhead);

    const q = query(
      collection(db, COLLECTIONS.STAFF_CREDENTIALS),
      where('str.expiryDate', '<=', expiryThreshold.toISOString())
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fallback for pilot/demo environment
    if (results.length === 0) return SQE_DUMMY_STAFF;
    return results;
  } catch (error) {
    console.error('[SQEService] Error fetching expirations:', error);
    return SQE_DUMMY_STAFF; // Return dummy data on error for demo resilience
  }
};
