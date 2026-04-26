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
  bedId = null,
  vitals, 
  secondaryAssessment = {},
  screeningQuestions = {},
  esiLevel = null,
  chiefComplaint = '',
  fallRisk = false,
  nutritionalRisk = false,
  assessedBy,
  reason = 'ROUTINE_TRIAGE' 
}) => {
  // Enterprise Resilience: If offline, use Priority Sync Queue
  if (!navigator.onLine) {
    console.warn('[TriageService] Offline detected. Enqueueing to Priority Sync Queue (Spark Safe)...');
    return await enqueueAction({
      type: 'SUBMIT_TRIAGE',
      patientId, encounterId, bedId, vitals, esiLevel, fallRisk, nutritionalRisk, assessedBy, reason
    }, SYNC_PRIORITIES.HIGH); 
  }

  const logRef = doc(collection(db, COLLECTIONS.TRIAGE_LOGS));
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // 1. Pre-fetch historical data for Clinical Intelligence (OUTSIDE transaction)
    // Firestore transactions do not allow collection-level queries.
    const lastTriageQuery = query(
      collection(db, COLLECTIONS.TRIAGE_LOGS),
      where('patientId', '==', patientId),
      limit(1)
    );
    const prevSnap = await getDocs(lastTriageQuery);
    const lastEntry = prevSnap.empty ? null : prevSnap.docs[0].data();

    return await runTransaction(db, async (transaction) => {
      // 2. Fetch Patient snapshot (INSIDE transaction)
      const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
      const patientSnap = await transaction.get(patientRef);
      if (!patientSnap.exists()) throw new Error('Pasien tidak ditemukan.');
      const patient = patientSnap.data();

      // 3. Clinical Intelligence (Adaptive & Granular)
      const baseline = patient.baseline_profile;
      const currentNews2 = calculateNEWS2(vitals, baseline);
      const hrVelocity = lastEntry 
        ? calculateVelocity(vitals.heartRate, lastEntry.vitals.heartRate, lastEntry.timestamp?.toDate()?.toISOString()) 
        : 0;
      
      const escalation = determineEscalation(currentNews2, { hrVelocity });
      const timestamp = serverTimestamp();

      // 3. Atomically update Encounter
      transaction.update(encounterRef, {
        status:           ENCOUNTER_STATUSES.TRIAGE,
        last_news2:       currentNews2,
        escalation_level:  escalation.level,
        escalation_source: escalation.source,
        updated_at:       timestamp,
        bed_id:           bedId, // Link bed to encounter
        _v:               increment(1)
      });

      // 3.1 🛡️ ADT: Atomic Bed Assignment
      if (bedId) {
        const bedRef = doc(db, COLLECTIONS.BEDS, bedId);
        const bedSnap = await transaction.get(bedRef);
        if (!bedSnap.exists()) throw new Error('Bed tidak ditemukan.');
        if (bedSnap.data().is_occupied) throw new Error('Bed sudah terisi oleh pasien lain.');

        transaction.update(bedRef, {
          is_occupied:  true,
          encounter_id: encounterId,
          patient_id:   patientId,
          assigned_at:  timestamp,
          assigned_by:  assessedBy
        });
      }

      // 3.2 🔔 Clinical Alert Integration (NEWS2 Automation)
      if (currentNews2 >= 5) {
        const alertRef = doc(collection(db, COLLECTIONS.ALERTS));
        transaction.set(alertRef, {
          patient_id:   patientId,
          encounter_id: encounterId,
          type:         'NEWS2_ESCALATION',
          severity:     currentNews2 >= 7 ? 'CRITICAL' : 'HIGH',
          status:       'ACTIVE',
          message:      `🚨 NEWS2 Score: ${currentNews2}. Patient condition ${currentNews2 >= 7 ? 'Critical' : 'Urgent'}.`,
          timestamp,
          triggered_by: assessedBy,
          vitals_snapshot: {
            heartRate: Number(vitals.heartRate),
            respRate:  Number(vitals.respRate || 0),
            spo2:      Number(vitals.spo2),
            temp:      Number(vitals.temperature)
          }
        });
      }

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
          painScale:      Number(vitals.painScale || 0),
        },
        secondaryAssessment,
        screeningQuestions,
        chiefComplaint,
        esi_level:        esiLevel,
        fall_risk:        fallRisk,
        nutritional_risk: nutritionalRisk,
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
