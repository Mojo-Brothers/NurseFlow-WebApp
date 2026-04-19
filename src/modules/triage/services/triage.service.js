/**
 * Triage Domain — Service Layer V5 (Enterprise Masterpiece)
 * ✅ Clinical Velocity Integration
 * ✅ Automatic State Transitions
 * ✅ Anomaly Detection & Override Support
 */
import { 
  collection, query, where, orderBy, limit, getDocs, 
  serverTimestamp, runTransaction, doc, increment
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, SYNC_PRIORITIES, ENCOUNTER_STATUSES } from '../../../core/constants.js';
import { calculateNEWS2, calculateVelocity, determineEscalation } from '../../../core/domain/clinicalEngine.js';

import { enqueueAction } from '../../../core/services/syncQueue.service.js';

/**
 * Submit data triage + Velocity Calculation + State Transition.
 */
export const submitTriage = async ({ 
  patientId, 
  encounterId, 
  vitals, 
  assessedBy,
  reason = 'ROUTINE_TRIAGE' 
}) => {
  // Enterprise Resilience: If offline, use Priority Sync Queue
  if (!navigator.onLine) {
    console.warn('[TriageService] Offline detected. Enqueueing to Priority Sync Queue (Spark Safe)...');
    return await enqueueAction({
      type: 'SUBMIT_TRIAGE',
      patientId, encounterId, vitals, assessedBy, reason
    }, SYNC_PRIORITIES.HIGH); 
  }

  const logRef = doc(collection(db, COLLECTIONS.TRIAGE_LOGS));
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Fetch Patient and historical data for Clinical Intelligence
      const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
      const patientSnap = await transaction.get(patientRef);
      if (!patientSnap.exists()) throw new Error('Pasien tidak ditemukan.');
      const patient = patientSnap.data();

      // Get last triage for velocity calculation
      const lastTriageQuery = query(
        collection(db, COLLECTIONS.TRIAGE_LOGS),
        where('patientId', '==', patientId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const prevSnap = await getDocs(lastTriageQuery);
      const lastEntry = prevSnap.empty ? null : prevSnap.docs[0].data();

      // 2. Clinical Intelligence (Adaptive & Granular)
      const baseline = patient.baseline_profile;
      const currentNews2 = calculateNEWS2(vitals, baseline);
      const hrVelocity = lastEntry 
        ? calculateVelocity(vitals.heartRate, lastEntry.vitals.heartRate, lastEntry.timestamp?.toDate()?.toISOString()) 
        : 0;
      
      const escalation = determineEscalation(currentNews2, { hrVelocity });
      const timestamp = serverTimestamp();

      // 3. Atomically update Encounter
      transaction.update(encounterRef, {
        status:           ENCOUNTER_STATUSES.IN_TREATMENT,
        last_news2:       currentNews2,
        escalation_level:  escalation.level,
        escalation_source: escalation.source,
        updated_at:       timestamp,
        _v:               increment(1)
      });

      // 4. Save Triage Log (Spark-Safe V5)
      transaction.set(logRef, {
        patientId,
        encounterId,
        vitals: {
          heartRate:      Number(vitals.heartRate),
          respRate:       Number(vitals.respRate || 0),
          systolicBP:     Number(vitals.systolicBP),
          diastolicBP:    Number(vitals.diastolicBP),
          spo2:           Number(vitals.spo2),
          temperature:    Number(vitals.temperature),
        },
        news2_score:      currentNews2,
        hr_velocity:      hrVelocity, 
        escalation_level:  escalation.level,
        escalation_source: escalation.source,
        assessed_by:      assessedBy,
        timestamp,
        request_id:       requestId,
        _v:               1
      });

      // 5. Atomic Audit V5
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          assessedBy,
        action:        AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.TRIAGE_LOGS,
        resource_id:   logRef.id,
        reason:        reason,
        source:        'WEB_APP_SPARK',
        delta: { news2: currentNews2, escalation: escalation.level, request_id: requestId }
      });

      return logRef.id;
    });
  } catch (err) {
    console.error('[TriageService] Spark-Safe V5 Submission failed:', err);
    throw err;
  }
};

/**
 * Fetch logs with Trend Data support.
 */
export const getPatientTriageLogs = async (patientId, limitCount = 10) => {
  const q = query(
    collection(db, COLLECTIONS.TRIAGE_LOGS),
    where('patientId', '==', patientId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
