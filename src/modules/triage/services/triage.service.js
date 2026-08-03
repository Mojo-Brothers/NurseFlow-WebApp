/**
 * Triage Domain — Service Layer (FHIR-Native EHIS 2026)
 * Server-driven calculation and immutable auditing.
 */
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { enqueueAction } from '../../../core/services/syncQueue.service.js';
import { SYNC_PRIORITIES, COLLECTIONS } from '../../../core/constants.js';

/**
 * Submit Triage as FHIR Observation & Update Encounter
 */
export const submitTriage = async ({ 
  patientId, 
  encounterId, 
  bedId = null,
  vitals, 
  secondaryAssessment,
  screeningQuestions,
  esiLevel,
  chiefComplaint,
  fallRisk,
  nutritionalRisk,
  assessedBy,
}) => {
  if (!navigator.onLine) {
    console.warn('[TriageService] Offline detected. Enqueueing...');
    return await enqueueAction({
      type: 'SUBMIT_TRIAGE',
      patientId, encounterId, bedId, vitals, secondaryAssessment, screeningQuestions, esiLevel, chiefComplaint, fallRisk, nutritionalRisk, assessedBy
    }, SYNC_PRIORITIES.HIGH); 
  }

  try {
    const batch = writeBatch(db);

    // 1. Create FHIR Observation for Vitals
    const obsRef = doc(collection(db, 'fhir_observations'));
    batch.set(obsRef, {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
        }
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: '85353-1', display: 'Vital signs, weight, height, head circumference, oxygen saturation and BMI panel' }]
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: new Date().toISOString(),
      // Custom payload for backend EWS trigger
      _ehis_vitals: {
        heartRate: Number(vitals.heartRate),
        respRate: Number(vitals.respRate || 0),
        systolicBP: Number(vitals.systolicBP),
        diastolicBP: Number(vitals.diastolicBP),
        spo2: Number(vitals.spo2),
        temperature: Number(vitals.temperature),
      },
      _ehis: {
        created_by: assessedBy,
        timestamp: serverTimestamp()
      }
    });

    // 2. Update Encounter with Triage Clinical Decision
    const encRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
    const encUpdate = {
      esi_level: esiLevel,
      chief_complaint: chiefComplaint,
      fall_risk: fallRisk,
      nutritional_risk: nutritionalRisk,
      triage_secondary_assessment: secondaryAssessment,
      triage_screening: screeningQuestions,
      triage_status: 'COMPLETED',
      triaged_at: serverTimestamp(),
      'status': 'in-progress',
      '_ehis.triage_priority': esiLevel // FHIR extension for easy querying
    };

    if (bedId) {
      encUpdate['location'] = [{
        location: { reference: `Location/${bedId}` },
        status: 'active'
      }];
    }
    batch.update(encRef, encUpdate);

    // 3. Create Audit Log (JCI Compliance)
    const auditRef = doc(collection(db, 'audit_logs'));
    batch.set(auditRef, {
      severity: esiLevel <= 2 ? 'CRITICAL' : 'URGENT',
      timestamp: serverTimestamp(),
      user: assessedBy,
      action: `Completed Triage for Patient (Enc: ${encounterId}). ESI Level assigned: ${esiLevel}. Chief Complaint: ${chiefComplaint}.`,
      resource: `Encounter/${encounterId}`
    });

    await batch.commit();

    return obsRef.id;

  } catch (err) {
    console.error('[TriageService] FHIR Submission failed:', err);
    throw err;
  }
};
