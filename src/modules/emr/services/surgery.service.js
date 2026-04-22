import { db } from '../../../core/firebase.js';
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';

/**
 * 🏥 SURGERY & ANESTHESIA SERVICE (ASC - Phase 28)
 * Adheres to JCI Standards for Surgical Safety and Perioperative Care.
 */

/**
 * Calculate Aldrete Score (Post-Anesthesia Recovery)
 * Score >= 8 is typically required for discharge from PACU.
 */
export const calculateAldreteScore = (metrics) => {
  const { activity, respiration, circulation, consciousness, oxygenation } = metrics;
  return activity + respiration + circulation + consciousness + oxygenation;
};

/**
 * Save Surgical Safety Checklist (WHO/JCI Standard)
 * Implements "Sign-In", "Time-Out", and "Sign-Out" protocols.
 */
export const saveSurgicalChecklist = async ({ 
  encounterId, 
  patientId, 
  userEmail, 
  phase, // 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'
  checklistData 
}) => {
  if (!encounterId) throw new Error('Encounter ID is mandatory.');

  const logRef = doc(collection(db, COLLECTIONS.SURGERY_LOGS));
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);

  try {
    return await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();

      // 1. Log the checklist entry
      const payload = {
        patientId,
        encounterId,
        phase,
        completed_by: userEmail,
        completed_at: timestamp,
        data: checklistData,
        v: 1
      };
      transaction.set(logRef, payload);

      // 2. Update Encounter state if needed
      if (phase === 'SIGN_IN') {
        transaction.update(encounterRef, { 
          surgery_status: 'IN_PREP',
          updated_at: timestamp 
        });
      } else if (phase === 'TIME_OUT') {
        transaction.update(encounterRef, { 
          surgery_status: 'PROCEDURE_ACTIVE',
          updated_at: timestamp 
        });
      } else if (phase === 'SIGN_OUT') {
        transaction.update(encounterRef, { 
          surgery_status: 'POST_OP',
          updated_at: timestamp 
        });
      }

      // 3. JCI Audit Trail
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user: userEmail,
        action: AUDIT_ACTIONS.MEDICAL_ACTION,
        resource_type: COLLECTIONS.SURGERY_LOGS,
        resource_id: logRef.id,
        reason: `JCI_SURGICAL_CHECKLIST_${phase}`,
        delta: { phase, encounterId }
      });

      return { ok: true, id: logRef.id };
    });
  } catch (err) {
    console.error('[SurgeryService] Failed to save checklist:', err);
    throw err;
  }
};

/**
 * Get Surgery Logs for Encounter
 */
export const getSurgeryLogs = async (encounterId) => {
  const q = query(
    collection(db, COLLECTIONS.SURGERY_LOGS),
    where('encounterId', '==', encounterId),
    orderBy('completed_at', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get Active Surgery Schedule
 */
export const getActiveSchedule = async () => {
  const q = query(
    collection(db, COLLECTIONS.SURGERY_SCHEDULE),
    where('status', 'in', ['SCHEDULED', 'IN_PROGRESS']),
    orderBy('scheduled_start', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
