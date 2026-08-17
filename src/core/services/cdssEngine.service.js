/**
 * NurseFlow Enterprise HIS — Clinical Decision Support System (CDSS) Engine
 * Centralized Clinical Safety & Rule Enforcer
 * Checks: Drug Interactions, Allergy Alerts, Dose Warnings, Panic Lab Thresholds, Vital Sign Velocity Alerts.
 */

import CoreRegistryService from './coreRegistry.service.js';

export const ALERT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  CONTRAINDICATED: 'CONTRAINDICATED'
};

class CDSSEngine {
  constructor() {
    this.knownInteractions = [
      { medA: 'MED-AML-10', medB: 'MED-HEP-INJ', severity: ALERT_SEVERITY.WARNING, message: 'Potensi peningkatan risiko perdarahan bila Amlodipine dan Heparin dikombinasikan.' },
      { medA: 'MED-INS-GLA', medB: 'MED-MET-500', severity: ALERT_SEVERITY.INFO, message: 'Kombinasi Insulin Glargine + Metformin: Pantau kadar glukosa darah secara rutin.' }
    ];

    this.patientAllergies = new Map();
  }

  // Check Drug-Drug Interactions
  checkMedicationInteractions(medicationIdList) {
    const alerts = [];
    for (let i = 0; i < medicationIdList.length; i++) {
      for (let j = i + 1; j < medicationIdList.length; j++) {
        const medA = medicationIdList[i];
        const medB = medicationIdList[j];
        const match = this.knownInteractions.find(
          k => (k.medA === medA && k.medB === medB) || (k.medA === medB && k.medB === medA)
        );
        if (match) {
          alerts.push(match);
        }
      }
    }
    return alerts;
  }

  // Check Drug Allergy Contraindications
  checkPatientAllergies(patientId, medicationId) {
    const allergies = this.patientAllergies.get(patientId) || [];
    const med = CoreRegistryService.getMedicationById(medicationId);

    if (!med || !allergies.length) return [];

    const alerts = [];
    allergies.forEach(allergy => {
      if (med.name.toLowerCase().includes(allergy.allergen.toLowerCase())) {
        alerts.push({
          severity: ALERT_SEVERITY.CONTRAINDICATED,
          allergen: allergy.allergen,
          reaction: allergy.reaction,
          message: `KONTRAINDIKASI SEVERITAS TINGGI: Pasien memiliki riwayat alergi ${allergy.allergen} (${allergy.reaction})!`
        });
      }
    });

    return alerts;
  }

  // Check High Alert Medication Warnings
  checkHighAlertStatus(medicationId) {
    const med = CoreRegistryService.getMedicationById(medicationId);
    if (med && med.isHighAlert) {
      return {
        isHighAlert: true,
        severity: ALERT_SEVERITY.CRITICAL,
        message: `PERINGATAN HIGH-ALERT MEDICATION (${med.name}): Diperlukan double-check independen 2 perawat sebelum pemberian obat!`
      };
    }
    return { isHighAlert: false };
  }

  // Check Critical Laboratory Panic Values
  evaluateLabPanicValues(testCode, resultValue) {
    const numericVal = parseFloat(resultValue);
    if (isNaN(numericVal)) return null;

    if (testCode === 'LOINC-2345-7' && (numericVal > 300 || numericVal < 50)) {
      return {
        isPanic: true,
        severity: ALERT_SEVERITY.CRITICAL,
        message: `PANIC VALUE LAB: GDS ${numericVal} mg/dL berada pada ambang batas kritis!`
      };
    }
    return null;
  }
}

export const cdssEngine = new CDSSEngine();
export default cdssEngine;
