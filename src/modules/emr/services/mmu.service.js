/**
 * 💊 MEDICATION MANAGEMENT & USE SERVICE (MMU - Phase 29)
 * Adheres to JCI Standards for Medication Safety (MMU.1 to MMU.7).
 */

const HIGH_ALERT_DRUGS = [
  'INSULIN', 'HEPARIN', 'MORPHINE', 'POTASSIUM CHLORIDE', 
  'WARFARIN', 'EPINEPHRINE', 'DIGOXIN', 'CEFTRIAXONE'
];

const LASA_PAIRS = [
  ['AMITRIPTYLINE', 'AMLODIPINE'],
  ['CEFOTAXIME', 'CEFTRIAXONE'],
  ['DOPAMINE', 'DOBUTAMINE'],
  ['GLIPIZIDE', 'GLYBURIDE'],
  ['HYDRALAZINE', 'HYDROXYZINE']
];

/**
 * Check if a medication is High-Alert
 */
export const isHighAlert = (medName) => {
  return HIGH_ALERT_DRUGS.includes(medName.toUpperCase());
};

/**
 * Detect LASA (Look-Alike Sound-Alike) Risk
 * Returns the similar drug name if a risk is detected.
 */
export const checkLasaRisk = (medName) => {
  const upperName = medName.toUpperCase();
  for (const pair of LASA_PAIRS) {
    if (pair.includes(upperName)) {
      return pair.find(name => name !== upperName);
    }
  }
  return null;
};

/**
 * Policy: Require Double-Sign for High-Alert meds
 */
export const requireDoubleSign = (medName) => {
  return isHighAlert(medName);
};

/**
 * Validate Prescription Payload for MMU Compliance
 */
export const validateMmuCompliance = (medications) => {
  return medications.map(med => ({
    ...med,
    isHighAlert: isHighAlert(med.medication_name),
    lasaWarning: checkLasaRisk(med.medication_name)
  }));
};
