/**
 * NurseFlow Enterprise HIS 2026 — Allergy & Adverse Reaction Engine
 * Sprint 4: JCI IPSG 3 & HL7 FHIR R4 AllergyIntolerance
 * Standar Kepatuhan: JCI 7th Edition (Patient Allergy Safeguards), SNOMED CT.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const ALLERGY_STORAGE_KEY = 'nurseflow_patient_allergies';

const getStoredAllergies = () => {
  try {
    const raw = localStorage.getItem(ALLERGY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[AllergyEngine] Failed to load allergies:', e);
  }
  return [
    {
      id: 'ALG-1001',
      patient_id: 'P-1001',
      allergy_type: 'DRUG',
      allergen: 'Amoxicillin / Penicillin Group',
      reaction: 'Urtikaria menyeluruh, Angioedema, Bronkospasme',
      severity: 'SEVERE',
      verification_status: 'CONFIRMED',
      recorded_by: 'dr. Siti Wijaya, Sp.PD-KGEH',
      created_at: '2026-08-15T08:00:00Z'
    },
    {
      id: 'ALG-1002',
      patient_id: 'P-1001',
      allergy_type: 'FOOD',
      allergen: 'Seafood (Udang & Kepiting)',
      reaction: 'Gatal-gatal pada kulit & kemerahan',
      severity: 'MODERATE',
      verification_status: 'CONFIRMED',
      recorded_by: 'Ns. Ratna Sari, S.Kep',
      created_at: '2026-08-15T08:00:00Z'
    }
  ];
};

const saveStoredAllergies = (list) => {
  try {
    localStorage.setItem(ALLERGY_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[AllergyEngine] Failed to save allergies:', e);
  }
};

export const allergyEngineService = {
  /**
   * Register New Allergy with JCI Severity Classification
   */
  recordAllergy: async ({
    patientId,
    allergyType = 'DRUG', // 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'LATEX' | 'OTHER'
    allergen,
    reaction,
    severity = 'MODERATE', // 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS_LIFE_THREATENING'
    verificationStatus = 'CONFIRMED',
    recordedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    if (!patientId || !allergen) {
      throw new Error('Validasi gagal: patientId dan allergen wajib disertakan.');
    }

    const now = new Date().toISOString();
    const newAllergy = {
      id: `ALG-${Date.now()}`,
      patient_id: patientId,
      allergy_type: allergyType,
      allergen,
      reaction,
      severity,
      verification_status: verificationStatus,
      recorded_by: recordedBy,
      created_at: now
    };

    const currentList = getStoredAllergies();
    saveStoredAllergies([newAllergy, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'ALLERGY',
      aggregateId: newAllergy.id,
      eventName: 'ALLERGY_REGISTERED',
      payload: newAllergy,
      actor: actorEmail
    });

    return newAllergy;
  },

  /**
   * Check Cross-Sensitivity against Prescribed Drugs
   */
  checkDrugAllergyConflict: (patientId, drugGenericName) => {
    const list = getStoredAllergies().filter(a => a.patient_id === patientId && a.allergy_type === 'DRUG');
    const q = (drugGenericName || '').toLowerCase();

    for (const alg of list) {
      const allergenLower = alg.allergen.toLowerCase();

      // Penicillin vs Cephalosporin Cross-Reactivity
      if (
        (allergenLower.includes('penicillin') || allergenLower.includes('amoxicillin') || allergenLower.includes('ampicillin')) &&
        (q.includes('cef') || q.includes('ceph') || q.includes('penicillin') || q.includes('amoxicillin'))
      ) {
        return {
          hasConflict: true,
          allergen: alg.allergen,
          severity: alg.severity,
          reaction: alg.reaction,
          message: `PERINGATAN ALERGI SILANG JCI: Pasien memiliki riwayat alergi ${alg.allergen} (${alg.severity}). Pemberian ${drugGenericName} berisiko memicu reaksi anafilaksis silang!`
        };
      }

      // NSAID vs Aspirin
      if (
        (allergenLower.includes('aspirin') || allergenLower.includes('nsaid') || allergenLower.includes('ibuprofen')) &&
        (q.includes('aspirin') || q.includes('ibuprofen') || q.includes('ketorolac') || q.includes('mefenamat') || q.includes('diclofenac'))
      ) {
        return {
          hasConflict: true,
          allergen: alg.allergen,
          severity: alg.severity,
          reaction: alg.reaction,
          message: `PERINGATAN ALERGI NSAID: Pasien alergi terhadap ${alg.allergen}. Obat ${drugGenericName} berisiko memicu bronkospasme / reaksi hipersensitivitas!`
        };
      }

      // Exact match
      if (q.includes(allergenLower) || allergenLower.includes(q)) {
        return {
          hasConflict: true,
          allergen: alg.allergen,
          severity: alg.severity,
          reaction: alg.reaction,
          message: `PERINGATAN ALERGI LANGSUNG: Pasien tercatat alergi terhadap ${alg.allergen} (${alg.reaction})!`
        };
      }
    }

    return { hasConflict: false };
  },

  /**
   * Get Patient Allergies
   */
  getPatientAllergies: (patientId) => {
    const list = getStoredAllergies();
    return list.filter(a => a.patient_id === patientId);
  }
};
