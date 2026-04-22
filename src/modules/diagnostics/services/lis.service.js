import { db } from '../../../core/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * LIS Service — Simulated Laboratory Information System interface.
 * Handles machine data ingestion and critical value detection.
 */

// Critical Ranges for Alerting
const CRITICAL_RANGES = {
  HEMOGLOBIN: { min: 7.0, max: 20.0, unit: 'g/dL' },
  POTASSIUM: { min: 2.5, max: 6.5, unit: 'mmol/L' },
  GLUCOSE: { min: 50, max: 400, unit: 'mg/dL' }
};

export const evaluateLabResult = (testName, value) => {
  const range = CRITICAL_RANGES[testName.toUpperCase()];
  if (!range) return 'NORMAL';

  if (value < range.min || value > range.max) return 'CRITICAL';
  return 'NORMAL';
};

/**
 * Simulates a lab result being pushed from a blood analyzer machine.
 */
export const simulateMachineResult = async (encounterId, patientId, testName, value) => {
  const status = evaluateLabResult(testName, value);
  
  const labResult = {
    encounter_id: encounterId,
    patient_id: patientId,
    test_name: testName,
    result_value: value,
    unit: CRITICAL_RANGES[testName.toUpperCase()]?.unit || '',
    type: 'LAB',
    status: status, // NORMAL | CRITICAL
    performed_at: serverTimestamp(),
    validated_by: 'AUTO_LIS_ANALYZER',
    acknowledged: false
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.DIAGNOSTICS), labResult);
  
  // In production, this would trigger a push notification to clinicians
  if (status === 'CRITICAL') {
     console.warn(`[CRITICAL ALERT] Patient ${patientId} has life-threatening ${testName}: ${value}`);
  }

  return { id: docRef.id, ...labResult };
};

export const updateLabOrderStatus = async (orderId, newStatus) => {
  // ORDERED | COLLECTED | IN_PROGRESS | VALIDATED
  // Implementation for tracking sample journey
};
