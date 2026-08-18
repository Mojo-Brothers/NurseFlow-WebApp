/**
 * NurseFlow Enterprise HIS 2026 — Patient Allergy Service (SCD Type-2)
 * Standards: JCI IPSG 3 (Patient Safety & High-Risk Medication Verification)
 */

import { patientAllergyRepository } from '../repositories/allergy.repository.js';

export const patientAllergyService = {
  getPatientAllergies: async (patientId, status = 'ACTIVE') => {
    return patientAllergyRepository.findByPatientId(patientId, status);
  },

  recordAllergy: async (allergyData) => {
    if (!allergyData.patientId || !allergyData.allergenName || !allergyData.severity) {
      throw new Error('patientId, allergenName, dan severity wajib diisi.');
    }
    return patientAllergyRepository.create(allergyData);
  },

  amendAllergy: async (allergyId, mutationData, actorId, reason) => {
    if (!reason) {
      throw new Error('Alasan amendemen wajib disertakan untuk audit klinis (JCI MCI).');
    }
    return patientAllergyRepository.amend(allergyId, mutationData, actorId, reason);
  },

  voidAllergy: async (allergyId, actorId, reason) => {
    if (!reason) {
      throw new Error('Alasan pembatalan (void) alergi wajib disertakan.');
    }
    return patientAllergyRepository.void(allergyId, actorId, reason);
  }
};
