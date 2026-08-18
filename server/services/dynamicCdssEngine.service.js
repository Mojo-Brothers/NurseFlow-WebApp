/**
 * NurseFlow Enterprise HIS 2026 — Dynamic CDSS Rules Engine (Gate 3 Core)
 * Standards: JCI IPSG 3, KDIGO, WHO Pediatric Dosing, Symmetrical DDI Matcher
 */

import { medicationRepository } from '../repositories/medication.repository.js';
import { patientAllergyRepository } from '../repositories/allergy.repository.js';
import { interactionRepository } from '../repositories/interaction.repository.js';
import { hospitalFormularyRepository, formularyRepository } from '../repositories/formulary.repository.js';
import { clinicalRuleRepository } from '../repositories/clinicalRule.repository.js';
import { cdssExecutionRepository } from '../repositories/cdssExecution.repository.js';

export const dynamicCdssEngineService = {
  /**
   * Evaluate a proposed prescription against all dynamic clinical rules & database truth.
   */
  evaluatePrescription: async ({
    organizationId = 'ORG-01',
    encounterId,
    patientId,
    proposedDrugId,
    doseAmount,
    doseUnit,
    route,
    patientContext = {},
    actorId = 'PRAC-DOC-01'
  }) => {
    const alerts = [];

    // 1. Fetch Proposed Drug Master Data
    const proposedDrug = await medicationRepository.findById(proposedDrugId);
    if (!proposedDrug) {
      throw new Error(`Obat ${proposedDrugId} tidak ditemukan di master farmasi.`);
    }

    // 2. Fetch Live Active Patient Allergies from Repository
    const activeAllergies = await patientAllergyRepository.findByPatientId(patientId, 'ACTIVE');
    for (const allergy of activeAllergies) {
      const isClassMatch = allergy.allergenCode === proposedDrug.drugClassCode;
      const isNameMatch = allergy.allergenName.toLowerCase().includes(proposedDrug.genericName.toLowerCase()) ||
                          proposedDrug.genericName.toLowerCase().includes(allergy.allergenName.toLowerCase());

      if (isClassMatch || isNameMatch) {
        const isFatal = allergy.severity === 'SEVERE_ANAPHYLAXIS';
        alerts.push({
          type: 'DRUG_ALLERGY',
          severity: isFatal ? 'FATAL_HARD_STOP' : 'CRITICAL_WARNING',
          title: `ALERT ALERGI: ${allergy.allergenName}`,
          message: `Pasien memiliki riwayat alergi terverifikasi: ${allergy.reactionDescription} (Keparahan: ${allergy.severity}).`,
          clinicalRecommendation: 'Hentikan peresepan obat ini dan pilih alternatif dari kelas terapi berbeda.',
          isHardStop: isFatal
        });
      }
    }

    // 3. Symmetrical Drug-Drug Interaction (DDI) Evaluation against Active Medications
    const currentActiveMedIds = patientContext.activeMedicationIds || [];
    for (const activeDrugId of currentActiveMedIds) {
      // Check symmetrical interaction pair
      const ddi = await interactionRepository.findInteractionPair(proposedDrugId, activeDrugId);
      if (ddi && ddi.isActive) {
        const otherDrug = await medicationRepository.findById(activeDrugId);
        alerts.push({
          type: 'DRUG_DRUG_INTERACTION',
          severity: ddi.severity,
          title: `INTERAKSI OBAT: ${proposedDrug.genericName} + ${otherDrug?.genericName || activeDrugId}`,
          message: ddi.clinicalEffect,
          clinicalMechanism: ddi.clinicalMechanism,
          clinicalRecommendation: ddi.managementRecommendation,
          isHardStop: ddi.severity === 'FATAL_HARD_STOP'
        });
      }

      // 4. Duplicate Therapy Check (Same ATC or Active Generic in simultaneous therapy)
      const activeDrug = await medicationRepository.findById(activeDrugId);
      if (activeDrug && activeDrug.atcCode === proposedDrug.atcCode && activeDrug.id !== proposedDrug.id) {
        alerts.push({
          type: 'DUPLICATE_THERAPY',
          severity: 'FATAL_HARD_STOP',
          title: `DUPLIKASI TERAPI: ${proposedDrug.genericName}`,
          message: `Pasien sedang menerima ${activeDrug.brandName} (${activeDrug.dosageForm}) dengan zat aktif identik. Risiko overdosis ganda.`,
          clinicalRecommendation: 'Batalkan peresepan kedua atau hentikan sediaan sebelumnya.',
          isHardStop: true
        });
      }
    }

    // 5. Pediatric Dose Validation (mg/kg)
    const patientAge = patientContext.ageYears !== undefined ? patientContext.ageYears : 30;
    const patientWeight = patientContext.weightKg !== undefined ? patientContext.weightKg : 60;

    if (patientAge < 12 && patientWeight > 0) {
      if (proposedDrug.pediatricMaxMgPerKg) {
        const maxSingleDose = proposedDrug.pediatricMaxMgPerKg * patientWeight;
        if (doseAmount > maxSingleDose) {
          alerts.push({
            type: 'PEDIATRIC_DOSE',
            severity: 'FATAL_HARD_STOP',
            title: 'OVERDOSIS PEDIATRIK DITOLAK',
            message: `Dosis ${doseAmount} ${doseUnit} melebihi batas aman maksimal anak (${maxSingleDose} ${doseUnit} untuk BB ${patientWeight} kg).`,
            clinicalRecommendation: `Dosis maksimal yang diperbolehkan adalah ${maxSingleDose} ${doseUnit}.`,
            isHardStop: true
          });
        }
      }
    }

    // 6. Renal eGFR Adjustment Engine
    const latestEgfr = patientContext.latestEgfr !== undefined ? patientContext.latestEgfr : null;
    if (latestEgfr !== null && proposedDrug.renalAdjustmentThresholdEgfr) {
      if (latestEgfr < proposedDrug.renalAdjustmentThresholdEgfr) {
        alerts.push({
          type: 'RENAL_ADJUSTMENT',
          severity: 'CRITICAL_WARNING',
          title: `PENYESUAIAN DOSIS GINJAL DIPERLUKAN (eGFR: ${latestEgfr} ml/min)`,
          message: `Fungsi ginjal pasien (eGFR: ${latestEgfr} ml/min) di bawah batas ambang (${proposedDrug.renalAdjustmentThresholdEgfr} ml/min). Risiko akumulasi obat dan toksisitas.`,
          clinicalRecommendation: 'Lakukan penyesuaian dosis atau perpanjang interval pemberian obat sesuai panduan ginjal.',
          isHardStop: false
        });
      }
    }

    // 7. Hospital Formulary & Stewardship Check
    const formularyEntry = await formularyRepository.findByDrugId(proposedDrugId, organizationId);
    if (!formularyEntry) {
      alerts.push({
        type: 'FORMULARY_RESTRICTION',
        severity: 'CRITICAL_WARNING',
        title: 'OBAT NON-FORMULARIUM RS',
        message: 'Obat ini tidak terdaftar dalam Formularium Rumah Sakit.',
        clinicalRecommendation: 'Memerlukan persetujuan khusus Komite Farmasi & Terapi (KFT).',
        isHardStop: false
      });
    } else if (formularyEntry.approvalLevelRequired === 'KFT_APPROVAL_REQUIRED') {
      alerts.push({
        type: 'FORMULARY_RESTRICTION',
        severity: 'CRITICAL_WARNING',
        title: 'ANTIBIOTIK CADANGAN (RESERVE) DIBATASI',
        message: 'Penggunaan antibiotik ini wajib verifikasi Komite Farmasi & Terapi / Konsultan Penyakit Tropis.',
        clinicalRecommendation: formularyEntry.clinicalStewardshipGuideline || 'Lampirkan hasil kultur resistensi kuman.',
        isHardStop: false
      });
    }

    // Determine Final Decision
    const hasHardStop = alerts.some(a => a.isHardStop);
    const hasCriticalWarning = alerts.some(a => a.severity === 'CRITICAL_WARNING');

    let evaluationResult = 'PASSED';
    if (hasHardStop) {
      evaluationResult = 'HARD_STOPPED';
    } else if (hasCriticalWarning) {
      evaluationResult = 'WARNING_TRIGGERED';
    }

    return {
      isSafeToExecute: !hasHardStop,
      evaluationResult,
      requiresClinicalJustification: hasCriticalWarning,
      proposedDrug,
      alerts,
      evaluatedAt: Date.now()
    };
  },

  /**
   * Commit the CDSS evaluation snapshot to the medicolegal execution ledger
   */
  commitExecutionSnapshot: async ({
    organizationId = 'ORG-01',
    encounterId,
    patientId,
    medicationId,
    ruleId = 'RULE-CDSS-AUTO',
    ruleVersion = 1,
    evaluationResult,
    overrideJustification = null,
    inputSnapshot,
    outputSnapshot,
    actorId
  }) => {
    return cdssExecutionRepository.recordExecution({
      organizationId,
      encounterId,
      patientId,
      medicationId,
      executedRuleId: ruleId,
      executedRuleVersion: ruleVersion,
      evaluationResult,
      overrideJustification,
      inputSnapshot: JSON.stringify(inputSnapshot),
      outputSnapshot: JSON.stringify(outputSnapshot),
      executedByPractitionerId: actorId,
      executedAt: Date.now()
    });
  }
};
