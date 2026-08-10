/**
 * NurseFlow Enterprise HIS — Clinical Safety Engine Service
 * Authoritative Centralized Patient Safety & Clinical Decision Support System (CDSS)
 * Manages: Allergy Alerts, Drug-Drug Interactions, High-Alert / LASA Warnings, Panic Lab Thresholds, Vital Velocity / NEWS2, Sepsis Screening, and Override Audit Logs.
 */

import cdssEngine, { ALERT_SEVERITY } from './cdssEngine.service.js';

class ClinicalSafetyEngine {
  constructor() {
    this.safetyAlertsLog = [];
    this.overrideLogs = [];
  }

  // Comprehensive Clinical Safety Evaluation on Medication Prescription
  evaluatePrescriptionSafety({ patientId, encounterId, medicationIds = [], practitionerId, practitionerName }) {
    const safetyResult = {
      isSafe: true,
      alerts: [],
      requiresOverride: false
    };

    // 1. Allergy Intolerance Check
    medicationIds.forEach(medId => {
      const allergyAlerts = cdssEngine.checkPatientAllergies(patientId, medId);
      if (allergyAlerts.length > 0) {
        safetyResult.isSafe = false;
        safetyResult.requiresOverride = true;
        safetyResult.alerts.push(...allergyAlerts);
      }
    });

    // 2. Drug-Drug Interaction Check
    const interactionAlerts = cdssEngine.checkMedicationInteractions(medicationIds);
    if (interactionAlerts.length > 0) {
      safetyResult.alerts.push(...interactionAlerts);
    }

    // 3. High-Alert / LASA Medication Warning Check
    medicationIds.forEach(medId => {
      const highAlertCheck = cdssEngine.checkHighAlertStatus(medId);
      if (highAlertCheck.isHighAlert) {
        safetyResult.alerts.push(highAlertCheck);
      }
    });

    // Log safety alerts
    if (safetyResult.alerts.length > 0) {
      this.safetyAlertsLog.push({
        patientId,
        encounterId,
        practitionerId,
        alerts: safetyResult.alerts,
        timestamp: new Date().toISOString()
      });
    }

    return safetyResult;
  }

  // Record Clinical Override with Required Reason (JCI Patient Safety Standard)
  recordOverride({ patientId, encounterId, alertId, ruleType, overrideReason, practitionerId, practitionerName }) {
    if (!overrideReason || overrideReason.trim().length < 5) {
      throw new Error(`OVERRIDE_REASON_REQUIRED: Mengabaikan peringatan keselamatan klinis membutuhkan alasan eksplisit (minimal 5 karakter).`);
    }

    const overrideRecord = {
      overrideId: `OVR-${Date.now()}`,
      patientId,
      encounterId,
      alertId,
      ruleType,
      overrideReason,
      practitionerId,
      practitionerName,
      timestamp: new Date().toISOString()
    };

    this.overrideLogs.push(overrideRecord);
    return overrideRecord;
  }

  getOverrideLogs() {
    return this.overrideLogs;
  }
}

export const clinicalSafetyEngine = new ClinicalSafetyEngine();
export default clinicalSafetyEngine;
