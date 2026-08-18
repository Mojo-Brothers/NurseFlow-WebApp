/**
 * NurseFlow Enterprise HIS 2026 — Hospital Formulary & Antibiotic Stewardship Service
 * Standards: Permenkes 73/2016, JCI MMU.1
 */

import { formularyRepository } from '../repositories/formulary.repository.js';
import { medicationRepository } from '../repositories/medication.repository.js';

export const hospitalFormularyService = {
  getFormulary: async (params = {}) => {
    const list = await formularyRepository.findAll(params);

    const enriched = await Promise.all(list.map(async (entry) => {
      const drug = await medicationRepository.findById(entry.drugId);
      return {
        ...entry,
        drug
      };
    }));

    return enriched;
  },

  getFormularyByDrugId: async (drugId, organizationId = 'ORG-01') => {
    const entry = await formularyRepository.findByDrugId(drugId, organizationId);
    if (!entry) return null;
    const drug = await medicationRepository.findById(drugId);
    return { ...entry, drug };
  },

  addDrugToFormulary: async (data) => {
    if (!data.drugId || !data.formularyTier) {
      throw new Error('drugId dan formularyTier wajib diisi.');
    }
    const drug = await medicationRepository.findById(data.drugId);
    if (!drug) throw new Error(`Medication ${data.drugId} tidak terdaftar di master.`);

    return formularyRepository.create(data);
  },

  updateFormularyEntry: async (id, data) => {
    return formularyRepository.update(id, data);
  },

  checkPrescriptionStewardship: async (drugId, prescribingDoctorRole, targetDepartmentId) => {
    const entry = await formularyRepository.findByDrugId(drugId);
    if (!entry) {
      return {
        isAllowed: false,
        reason: 'NON_FORMULARIUM: Obat ini tidak terdaftar dalam Formularium Rumah Sakit. Memerlukan persetujuan Komite Farmasi & Terapi.'
      };
    }

    if (entry.approvalLevelRequired === 'KFT_APPROVAL_REQUIRED') {
      return {
        isAllowed: false,
        requiresSpecialApproval: true,
        approvalType: 'KFT_APPROVAL_REQUIRED',
        reason: 'RESTRICTED_ANTIBIOTIC: Obat ini termasuk antibiotik cadangan (Reserve). Wajib verifikasi KFT / Konsultan Penyakit Tropis.'
      };
    }

    if (entry.restrictedDepartmentId && entry.restrictedDepartmentId !== targetDepartmentId) {
      return {
        isAllowed: false,
        requiresSpecialApproval: true,
        approvalType: 'DEPARTMENT_RESTRICTED',
        reason: `Obat ini dibatasi hanya untuk penggunaan di departemen ${entry.restrictedDepartmentId}.`
      };
    }

    return {
      isAllowed: true,
      formularyTier: entry.formularyTier,
      maxPrescribingDays: entry.maxPrescribingDays
    };
  }
};
