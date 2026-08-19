/**
 * NurseFlow Enterprise HIS 2026 — Clinical Decision Support System (CDSS) Engine
 * Sprint 4 & Sprint 4B.3: Drug-Allergy, Renal Dosing, Pediatric Weight Guard, LASA & DDI
 * Standar Kepatuhan: JCI 7th Edition (MMU Medication Safety), ISMP LASA, Permenkes 24/2022.
 */

import { allergyEngineService } from './allergyEngine.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const CDSS_ALERTS_KEY = 'nurseflow_cdss_alerts';

let inMemoryAlerts = [];

const getStoredAlerts = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CDSS_ALERTS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[CdssEngine] Failed to load CDSS alerts:', e);
  }
  return inMemoryAlerts;
};

const saveStoredAlerts = (alerts) => {
  inMemoryAlerts = alerts;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CDSS_ALERTS_KEY, JSON.stringify(alerts));
    }
  } catch (e) {
    console.warn('[CdssEngine] Failed to save CDSS alerts:', e);
  }
};

// ISMP Canonical LASA Pairs with Tall-Man Lettering
export const LASA_PAIRS = [
  { pair: ['DOPamine', 'DOBUTamine'], pattern: /dopamine|dobutamine/i },
  { pair: ['hydrALAZINE', 'hydrOXYzine'], pattern: /hydralazine|hydroxyzine/i },
  { pair: ['predniSONE', 'prednisoLONE'], pattern: /prednisone|prednisolone/i },
  { pair: ['EpiNEPHrine', 'NorEpiNEPHrine'], pattern: /epinephrine|norepinephrine/i },
  { pair: ['ceFAZolin', 'cefTRIAXone'], pattern: /cefazolin|ceftriaxone/i },
  { pair: ['chlorproMAZINE', 'cloMIPRAMINE'], pattern: /chlorpromazine|clomipramine/i }
];

export const cdssEngineService = {
  /**
   * Run Comprehensive CDSS Clinical Screening for a Prescription Order
   */
  evaluatePrescriptionSafeguards: async ({
    encounterId,
    patientId,
    prescribedDrugName,
    prescribedDrugCode,
    prescribedDoseMg = null,
    patientEgfr = 45, // ml/min/1.73m2
    patientAgeYears = 35,
    patientWeightKg = null,
    activeMedications = []
  }) => {
    const alerts = [];
    const drugLower = (prescribedDrugName || '').toLowerCase();

    // 1. Drug-Allergy Cross-Reactivity Check (JCI IPSG 3)
    const allergyCheck = allergyEngineService.checkDrugAllergyConflict(patientId, prescribedDrugName);
    if (allergyCheck.hasConflict) {
      alerts.push({
        id: `CDSS-ALG-${Date.now()}`,
        encounter_id: encounterId,
        patient_id: patientId,
        alert_type: 'DRUG_ALLERGY_CONFLICT',
        severity: allergyCheck.severity === 'SEVERE' || allergyCheck.severity === 'ANAPHYLAXIS_LIFE_THREATENING' ? 'CRITICAL_BLOCK' : 'WARNING_OVERRIDE_REQUIRED',
        title: '⚠️ PERINGATAN ALERGI OBAT (JCI IPSG 3)',
        message: allergyCheck.message,
        recommendation: `Pertimbangkan obat alternatif non-beta-laktam atau lakukan Skin Prick Test sebelum administrasi.`,
        is_acknowledged: false,
        created_at: new Date().toISOString()
      });
    }

    // 2. Renal Impairment Dosage Guard (eGFR Assessment)
    if (patientEgfr < 30) {
      if (drugLower.includes('metformin') || drugLower.includes('glibenclamide')) {
        alerts.push({
          id: `CDSS-RENAL-${Date.now()}`,
          encounter_id: encounterId,
          patient_id: patientId,
          alert_type: 'RENAL_DOSAGE_ADJUSTMENT',
          severity: 'CRITICAL_BLOCK',
          title: '⛔ KONTRAINDIKASI GINJAL BERAT (eGFR < 30 ml/menit)',
          message: `Pasien memiliki estimasi GFR ${patientEgfr} ml/menit. Pemberian ${prescribedDrugName} dikontraindikasikan karena risiko Asidosis Laktat Akut!`,
          recommendation: 'Ganti dengan Insulin reguler atau DPP-4 Inhibitor yang aman untuk gangguan ginjal.',
          is_acknowledged: false,
          created_at: new Date().toISOString()
        });
      } else if (drugLower.includes('ceftriaxone') || drugLower.includes('meropenem') || drugLower.includes('ciprofloxacin')) {
        alerts.push({
          id: `CDSS-RENAL-ADJ-${Date.now()}`,
          encounter_id: encounterId,
          patient_id: patientId,
          alert_type: 'RENAL_DOSAGE_ADJUSTMENT',
          severity: 'WARNING_OVERRIDE_REQUIRED',
          title: `⚠️ PENYESUAIAN DOSIS GINJAL DIPERLUKAN (eGFR: ${patientEgfr} ml/min)`,
          message: `Klirens ginjal menurun signifikan pada eGFR ${patientEgfr}. Dibutuhkan penyesuaian dosis atau pemanjangan interval dosis untuk ${prescribedDrugName}.`,
          recommendation: 'Turunkan dosis 50% atau perpanjang interval pemberian menjadi q12h/q24h.',
          is_acknowledged: false,
          created_at: new Date().toISOString()
        });
      }
    }

    // 3. Pediatric Weight-Based Dosing Guard (Anak < 12 Tahun / BB spesifik)
    if (patientAgeYears < 12 && patientWeightKg) {
      let maxMgPerKgSingle = 15; // default general guideline
      if (drugLower.includes('paracetamol') || drugLower.includes('acetaminophen')) maxMgPerKgSingle = 15;
      if (drugLower.includes('amoxicillin')) maxMgPerKgSingle = 30;
      if (drugLower.includes('ceftriaxone')) maxMgPerKgSingle = 75;

      const maxSafeDose = patientWeightKg * maxMgPerKgSingle;
      if (prescribedDoseMg && prescribedDoseMg > maxSafeDose) {
        alerts.push({
          id: `CDSS-PED-DOSE-${Date.now()}`,
          encounter_id: encounterId,
          patient_id: patientId,
          alert_type: 'PEDIATRIC_OVERDOSE_WARNING',
          severity: 'CRITICAL_BLOCK',
          title: `⛔ PERINGATAN OVERDOSIS PEDIATRIK (BB: ${patientWeightKg} kg)`,
          message: `Dosis ${prescribedDoseMg} mg melebihi batas aman maksimal untuk anak berat ${patientWeightKg} kg (Maksimal: ${maxSafeDose} mg / ${maxMgPerKgSingle} mg/kgBB)!`,
          recommendation: `Sesuaikan dosis ke rentang aman: ${(patientWeightKg * 10).toFixed(0)} - ${maxSafeDose.toFixed(0)} mg per kali pemberian.`,
          is_acknowledged: false,
          created_at: new Date().toISOString()
        });
      }
    }

    // 4. LASA (Look-Alike Sound-Alike) & Tall-Man Warning
    for (const item of LASA_PAIRS) {
      if (item.pattern.test(prescribedDrugName)) {
        alerts.push({
          id: `CDSS-LASA-${Date.now()}`,
          encounter_id: encounterId,
          patient_id: patientId,
          alert_type: 'LASA_PROTECTION',
          severity: 'WARNING_OVERRIDE_REQUIRED',
          title: `⚠️ PERINGATAN OBAT LASA / NORUM (${item.pair.join(' vs ')})`,
          message: `Obat ini termasuk dalam daftar Kewaspadaan Tinggi LASA. Pastikan tidak tertukar dengan pasangan mirip: ${item.pair.join(' ⟷ ')}.`,
          recommendation: 'Gunakan penulisan Tall-Man Lettering dan verifikasi ganda saat telaah resep & dispensing.',
          is_acknowledged: false,
          created_at: new Date().toISOString()
        });
        break;
      }
    }

    // 5. Drug-Drug Major Interactions
    if (drugLower.includes('simvastatin') && activeMedications.some(m => m.toLowerCase().includes('amlodipine'))) {
      alerts.push({
        id: `CDSS-DDI-${Date.now()}`,
        encounter_id: encounterId,
        patient_id: patientId,
        alert_type: 'DRUG_DRUG_INTERACTION',
        severity: 'WARNING_OVERRIDE_REQUIRED',
        title: '⚠️ INTERAKSI OBAT SIGNIFIKAN: Simvastatin + Amlodipine',
        message: 'Amlodipine menghambat metabolisme Simvastatin via CYP3A4, meningkatkan konsentrasi serum dan risiko Rhabdomyolysis.',
        recommendation: 'Batasi dosis Simvastatin maksimal 20 mg/hari atau ganti dengan Atorvastatin/Rosuvastatin.',
        is_acknowledged: false,
        created_at: new Date().toISOString()
      });
    }

    // 6. Duplicate Therapy Alert
    if (activeMedications.some(m => m.toLowerCase().includes(drugLower) || drugLower.includes(m.toLowerCase()))) {
      alerts.push({
        id: `CDSS-DUP-${Date.now()}`,
        encounter_id: encounterId,
        patient_id: patientId,
        alert_type: 'DUPLICATE_THERAPY',
        severity: 'WARNING_OVERRIDE_REQUIRED',
        title: '⚠️ DUPLIKASI TERAPI OBAT',
        message: `Obat ${prescribedDrugName} memiliki kelas farmakologis atau zat aktif yang sama dengan terapi berjalan.`,
        recommendation: 'Periksa kembali daftar terapi aktif pasien sebelum konfirmasi e-resep.',
        is_acknowledged: false,
        created_at: new Date().toISOString()
      });
    }

    // Persist & stage alert events if any
    if (alerts.length > 0) {
      const stored = getStoredAlerts();
      saveStoredAlerts([...alerts, ...stored]);

      for (const alt of alerts) {
        await outboxPublisherService.stageEvent({
          aggregateType: 'CDSS_ALERT',
          aggregateId: alt.id,
          eventName: 'CDSS_ALERT_GENERATED',
          payload: alt
        });
      }
    }

    return {
      hasAlerts: alerts.length > 0,
      hasCriticalBlock: alerts.some(a => a.severity === 'CRITICAL_BLOCK'),
      alerts
    };
  },

  /**
   * Get Alerts for an Encounter
   */
  getAlerts: (encounterId = null) => {
    let list = getStoredAlerts();
    if (encounterId) {
      list = list.filter(a => a.encounter_id === encounterId);
    }
    return list;
  }
};
