/**
 * NurseFlow Enterprise HIS 2026 — Medication Terminology Service
 * Standards: SNOMED CT, RxNorm, ATC, UNII, NDC, GTIN, KFA Kemenkes
 */

import { terminologyRepository } from '../repositories/terminology.repository.js';
import { medicationRepository } from '../repositories/medication.repository.js';

export const terminologyService = {
  searchTerminology: async ({ query = '', system = '' } = {}) => {
    return terminologyRepository.search({ query, system });
  },

  getTerminologiesForMedication: async (medicationId) => {
    return terminologyRepository.findByMedicationId(medicationId);
  },

  linkTerminologyToMedication: async (data) => {
    const med = await medicationRepository.findById(data.medicationId);
    if (!med) throw new Error(`Medication ${data.medicationId} tidak ditemukan.`);

    return terminologyRepository.addTerminology(data);
  }
};
