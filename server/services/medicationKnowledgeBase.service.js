/**
 * NurseFlow Enterprise HIS 2026 — Master Medication Knowledge Base Service
 * Coordinates Master Drugs, Ingredients, DDI Interaction Graph & Alternatives
 */

import { medicationRepository } from '../repositories/medication.repository.js';
import { terminologyRepository } from '../repositories/terminology.repository.js';
import { interactionRepository } from '../repositories/interaction.repository.js';
import { formularyRepository } from '../repositories/formulary.repository.js';

export const medicationKnowledgeBaseService = {
  /**
   * Search and filter medications with full relational enrichment (Terminology, DDI count, Formulary status)
   */
  getMedications: async (filterParams = {}) => {
    const res = await medicationRepository.findAll(filterParams);

    const enriched = await Promise.all(res.data.map(async (med) => {
      const terminologies = await terminologyRepository.findByMedicationId(med.id);
      const interactions = await interactionRepository.findInteractionsForDrug(med.id);
      const formulary = await formularyRepository.findByDrugId(med.id);

      return {
        ...med,
        terminologies,
        interactionCount: interactions.length,
        formularyTier: formulary?.formularyTier || 'NON_FORMULARIUM',
        requiresKftApproval: formulary?.approvalLevelRequired === 'KFT_APPROVAL_REQUIRED'
      };
    }));

    return {
      total: res.total,
      limit: res.limit,
      offset: res.offset,
      data: enriched
    };
  },

  getMedicationById: async (id) => {
    const med = await medicationRepository.findById(id);
    if (!med) return null;

    const terminologies = await terminologyRepository.findByMedicationId(med.id);
    const interactions = await interactionRepository.findInteractionsForDrug(med.id);
    const formulary = await formularyRepository.findByDrugId(med.id);

    return {
      ...med,
      terminologies,
      interactions,
      formulary
    };
  },

  createMedication: async (data) => {
    if (!data.genericName || !data.atcCode || !data.drugClassCode) {
      throw new Error('genericName, atcCode, dan drugClassCode wajib diisi.');
    }
    return medicationRepository.create(data);
  },

  updateMedication: async (id, data) => {
    return medicationRepository.update(id, data);
  },

  archiveMedication: async (id, reason) => {
    return medicationRepository.archive(id, reason);
  },

  checkDrugDrugInteraction: async (drugAId, drugBId) => {
    return interactionRepository.findInteractionPair(drugAId, drugBId);
  }
};
