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
import { COLLECTIONS, AUDIT_ACTIONS, ENCOUNTER_STATUSES, ESCALATION_LEVELS, SYNC_PRIORITIES, ESCALATION_SOURCES } from '../../../core/constants.js';
import { DEMO_ENCOUNTERS } from '../../../core/demoData.js';

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
        admitting_doctor:   admittingDoctor || null,
        nurse_in_charge:    nurseInCharge || null,
        ward:               ward || 'IGD',
        status:             ENCOUNTER_STATUSES.WAITING, 
        escalation_level:   ESCALATION_LEVELS.NONE,
        escalation_source:  ESCALATION_SOURCES.SYSTEM,
        admitted_at:        timestamp,
        updated_at:         timestamp,
        updated_by:         createdBy || 'system',
      };

      transaction.set(encounterRef, payload);

      // 2. Automated Financial Account (The Highway)
      // JCI Requirement: Every encounter must have a matching billing account
      const billRef = doc(collection(db, COLLECTIONS.BILLING));
      transaction.set(billRef, {
        encounter_id:  encounterRef.id,
        patient_id:    patientId,
        line_items:    [
          {
            description: 'Emergency Admission Fee',
            qty: 1,
            unit_price: 50000,
            total: 50000
          }
        ],
        subtotal:      50000,
        discount:      0,
        total:         50000,
        status:        'DRAFT',
        created_at:    timestamp,
        created_by:    createdBy,
      });

      // 3. Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          createdBy,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id:   encounterRef.id,
        reason:        'INITIAL_ADMISSION_WITH_BILLING',
        source:        'WEB_APP',
        sync_priority: SYNC_PRIORITIES.HIGH,
        delta: { status: ENCOUNTER_STATUSES.WAITING, bill_id: billRef.id }
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

export const getActiveEncounters = async (maxResults = 100) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ENCOUNTERS),
        where('status', 'in', [
          ENCOUNTER_STATUSES.WAITING, 
          ENCOUNTER_STATUSES.TRIAGE, 
          ENCOUNTER_STATUSES.IN_TREATMENT,
          ENCOUNTER_STATUSES.TRANSFER_INTERNAL
        ]),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[EncounterService] Failed to fetch encounters:', error);
    return [];
  }
};

/**
 * Get all encounters for a specific patient.
 */
export const getPatientEncounters = async (patientId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ENCOUNTERS),
      where('patient_id', '==', patientId),
      orderBy('admitted_at', 'desc')
    );
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[EncounterService] Failed to fetch patient encounters:', error);
    return [];
  }
};

/**
 * Get the current active encounter for a patient (if any).
 */
export const getPatientActiveEncounter = async (patientId) => {
  try {
    const demoEnc = DEMO_ENCOUNTERS.find(e => e.patient_id === patientId);
    if (demoEnc) {
      return demoEnc;
    }

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
    
    if (snap.empty) {
      return null;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (error) {
    console.error('[EncounterService] Failed to fetch patient active encounter:', error);
    return DEMO_ENCOUNTERS.find(e => e.patient_id === patientId) || null;
  }
};

/**
 * Discharge Encounter — Enhanced V6 (Clinical & Logistical Sync)
 */
export const dischargeEncounter = async (encounterId, userEmail) => {
  const ref = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('Encounter tidak ditemukan.');
      const current = snap.data();

      // 1. Guard: Check status
      if (current.status === ENCOUNTER_STATUSES.DISCHARGED) {
        throw new Error('Pasien sudah di-discharge sebelumnya.');
      }

      const timestamp = serverTimestamp();

      // 2. Update Encounter Status
      transaction.update(ref, {
        status:     ENCOUNTER_STATUSES.DISCHARGED,
        updated_at: timestamp,
        updated_by: userEmail,
      });

      // 3. 🛡️ ADT: Auto-Release Bed
      if (current.bed_id) {
        const bedRef = doc(db, COLLECTIONS.BEDS, current.bed_id);
        transaction.update(bedRef, {
          is_occupied:  false,
          encounter_id: null,
          patient_id:   null,
          released_at:  timestamp
        });
      }

      // 4. 🛡️ FINANCIAL: Finalize Billing
      const billingQuery = query(
        collection(db, COLLECTIONS.BILLING),
        where('encounter_id', '==', encounterId),
        limit(1)
      );
      const billingSnap = await getDocs(billingQuery);
      if (!billingSnap.empty) {
        const billRef = doc(db, COLLECTIONS.BILLING, billingSnap.docs[0].id);
        transaction.update(billRef, {
          status: 'WAITING_PAYMENT',
          finalized_at: timestamp
        });
      }

      // 5. Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          userEmail,
        action:        AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id:   encounterId,
        reason:        'FINAL_CLINICAL_DISCHARGE',
        source:        'WEB_APP',
        delta: { status: ENCOUNTER_STATUSES.DISCHARGED, bed_released: !!current.bed_id }
      });
    });
  } catch (err) {
    console.error('[EncounterService] Discharge failed:', err);
    throw err;
  }
};

// Alias for V5 consistency
export const getActiveQueue = getActiveEncounters;
