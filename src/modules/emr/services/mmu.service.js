import { getMedicationSafety } from '../../admin/services/masterData.service.js';

let SAFETY_CACHE = null;

const loadSafetyData = async () => {
  if (!SAFETY_CACHE) {
    SAFETY_CACHE = await getMedicationSafety();
  }
  return SAFETY_CACHE;
};

/**
 * Check if a medication is High-Alert
 */
export const isHighAlert = async (medName) => {
  const data = await loadSafetyData();
  const list = data?.high_alert?.list || [];
  return list.includes(medName.toUpperCase());
};

/**
 * Detect LASA (Look-Alike Sound-Alike) Risk
 * Returns the similar drug name if a risk is detected.
 */
export const checkLasaRisk = async (medName) => {
  const data = await loadSafetyData();
  const pairs = data?.lasa?.pairs || [];
  const upperName = medName.toUpperCase();
  for (const pair of pairs) {
    if (pair.includes(upperName)) {
      return pair.find(name => name !== upperName);
    }
  }
  return null;
};

/**
 * Policy: Require Double-Sign for High-Alert meds
 */
export const requireDoubleSign = async (medName) => {
  return await isHighAlert(medName);
};

/**
 * Validate Prescription Payload for MMU Compliance
 */
export const validateMmuCompliance = async (medications) => {
  return await Promise.all(medications.map(async med => ({
    ...med,
    isHighAlert: await isHighAlert(med.medication_name),
    lasaWarning: await checkLasaRisk(med.medication_name)
  })));
};
