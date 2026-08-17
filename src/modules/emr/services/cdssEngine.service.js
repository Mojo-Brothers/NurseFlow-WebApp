/**
 * NurseFlow Enterprise HIS 2026 — Clinical Decision Support System (CDSS) Engine
 * Sprint 4: Drug-Allergy Cross Sensitivity, Renal Dosing, DDI & Duplicate Therapy Guard
 * Standar Kepatuhan: JCI 7th Edition (MMU Medication Safety) & KARS 2024.
 */

import { allergyEngineService } from './allergyEngine.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const CDSS_ALERTS_KEY = 'nurseflow_cdss_alerts';

const getStoredAlerts = () => {
  try {
    const raw = localStorage.getItem(CDSS_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[CdssEngine] Failed to load CDSS alerts:', e);
  }
  return [];
};

const saveStoredAlerts = (alerts) => {
  try {
    localStorage.setItem(CDSS_ALERTS_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.warn('[CdssEngine] Failed to save CDSS alerts:', e);
  }
};

export const cdssEngineService = {
  /**
   * Run Comprehensive CDSS Clinical Screening for a Prescription Order
   */
  evaluatePrescriptionSafeguards: async ({
    encounterId,
    patientId,
    prescribedDrugName,
    prescribedDrugCode,
    patientEgfr = 45, // ml/min/1.73m2
    activeMedications = []
  }) => {
    const alerts = [];

    // 1. Drug-Allergy Cross-Reactivity Check
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
    const drugLower = (prescribedDrugName || '').toLowerCase();
    if (patientEgfr < 30 && (drugLower.includes('metformin') || drugLower.includes('glibenclamide'))) {
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
    }

    // 3. Drug-Drug Major Interactions
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

    // 4. Duplicate Therapy Alert
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
