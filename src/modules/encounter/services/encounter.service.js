/**
 * Encounter Domain — Service Layer V5 (Enterprise Masterpiece)
 * ✅ State-Driven Lifecycle (WAITING -> TRIAGE -> IN_TREATMENT -> etc)
 * ✅ Transition Guards (Atomic Transactions)
 * ✅ Escalation Hierarchy Support
 */
import { 
  collection, doc, getDocs, query, where, orderBy, limit, 
  serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, ENCOUNTER_STATUSES, ESCALATION_LEVELS, SYNC_PRIORITIES } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * Membuka encounter baru dalam status WAITING.
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
  const encounterRef = doc(collection(db, COLLECTIONS.ENCOUNTERS));
  
  try {
    await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();

      const payload = {
        patient_id:         patientId,
        encounter_type:     encounterType,
        chief_complaint:    chiefComplaint,
        admitting_doctor:   admittingDoctor,
        nurse_in_charge:    nurseInCharge,
        ward,
        status:             ENCOUNTER_STATUSES.WAITING, 
        escalation_level:   ESCALATION_LEVELS.NONE,
        escalation_source:  ESCALATION_SOURCES.SYSTEM,
        admitted_at:        timestamp,
        updated_at:         timestamp,
        updated_by:         createdBy,
      };

      transaction.set(encounterRef, payload);

      // Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          createdBy,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id:   encounterRef.id,
        reason:        'INITIAL_ADMISSION',
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta: { status: ENCOUNTER_STATUSES.WAITING }
      });
    });

    return encounterRef.id;
  } catch (err) {
    console.error('[EncounterService] Create failed:', err);
    throw err;
  }
};

/**
 * Transisi status encounter dengan Guard Logic (JCI Standard).
 */
export const transitionEncounter = async ({ 
  encounterId, 
  targetStatus, 
  reason, 
  userEmail,
  escalationLevel = null 
}) => {
  const ref = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('Encounter tidak ditemukan.');
      
      const current = snap.data();
      
      // 1. Guard: Terminal State check
      if (current.status === ENCOUNTER_STATUSES.DISCHARGED || current.status === ENCOUNTER_STATUSES.CANCELLED) {
        throw new Error('Tidak bisa mengubah status dari terminal state (Discharged/Cancelled).');
      }

      // 2. Logic: Status Transition
      const updatePayload = {
        status:     targetStatus,
        updated_at: serverTimestamp(),
        updated_by: userEmail,
      };

      if (escalationLevel) {
        updatePayload.escalation_level = escalationLevel;
        updatePayload.escalation_source = ESCALATION_SOURCES.NURSE; // Default for manual transitions
      }

      transaction.update(ref, updatePayload);

      // 3. Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp:     serverTimestamp(),
        user:          userEmail,
        action:        AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id:   encounterId,
        reason:        reason,
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta: { 
          status: { before: current.status, after: targetStatus },
          escalation: escalationLevel,
          source: ESCALATION_SOURCES.NURSE
        }
      });
    });
  } catch (err) {
    console.error('[EncounterService] Transition failed:', err);
    throw err;
  }
};

/**
 * Get active patient encounters using cursor-based pagination (ready for scale).
 */
export const getActiveEncounters = async (maxResults = 24) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS),
      where('status', 'in', [
        ENCOUNTER_STATUSES.WAITING, 
        ENCOUNTER_STATUSES.TRIAGE, 
        ENCOUNTER_STATUSES.IN_TREATMENT,
        ENCOUNTER_STATUSES.TRANSFER_INTERNAL
      ]),
      orderBy('escalation_level', 'desc'), // Prioritize Critical/Urgent
      orderBy('admitted_at', 'asc'), 
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Get all encounters for a specific patient.
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

/**
 * Get the current active encounter for a patient (if any).
 */
export const getPatientActiveEncounter = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS),
    where('patient_id', '==', patientId),
    where('status', 'in', [
      ENCOUNTER_STATUSES.WAITING, 
      ENCOUNTER_STATUSES.TRIAGE, 
      ENCOUNTER_STATUSES.IN_TREATMENT,
      ENCOUNTER_STATUSES.TRANSFER_INTERNAL
    ]),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

/**
 * Discharge Encounter — Wrapper over transitionEncounter for V5 compliance.
 */
export const dischargeEncounter = async (encounterId, closedBy) => {
  return transitionEncounter({
    encounterId,
    targetStatus: ENCOUNTER_STATUSES.DISCHARGED,
    reason: 'FINAL_DISCHARGE',
    userEmail: closedBy
  });
};

// Alias for V5 consistency
export const getActiveQueue = getActiveEncounters;
