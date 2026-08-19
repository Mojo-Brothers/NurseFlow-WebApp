/**
 * NurseFlow Enterprise HIS 2026 — Clinical Deterioration & Post-Medication Surveillance Engine
 * Standards:
 * 1. Royal College of Physicians (RCP) NEWS2 (National Early Warning Score 2)
 * 2. WHO & ISMP Post-Medication Active Pharmacovigilance
 * 3. Rapid Response Team (RRT / Code Medical) Automated Escalation Protocol
 * 4. Adverse Drug Event (ADE) Auto-Detection (Anaphylaxis, OIRD, Hypoglycemia, Refractory Shock)
 */

import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { careStateEngine, CARE_STATES } from '../../../core/services/careStateEngine.service.js';
import { clinicalSafetyGovernanceEngine, RULE_REGISTRY } from './clinicalSafetyGovernanceEngine.service.js';

const SURVEILLANCE_COLLECTION = 'medication_surveillances';
const DETERIORATION_EVENTS_COLLECTION = 'clinical_deterioration_events';

export const DETERIORATION_LEVELS = {
  LOW: 'LOW',                         // NEWS2: 0 - 4 (Routine Ward Monitoring 4-12 hourly)
  LOW_MEDIUM: 'LOW_MEDIUM',           // Single parameter score = 3 (Increased nurse monitoring)
  MEDIUM: 'MEDIUM',                   // NEWS2: 5 - 6 (Urgent Rapid Response Team Review < 30 mins)
  HIGH: 'HIGH',                       // NEWS2 >= 7 (Emergency Critical Care / ICU Escalation < 10 mins)
  CODE_BLUE: 'CODE_BLUE'              // Cardiac/Respiratory Arrest / Immediate Resuscitation
};

export class ClinicalDeteriorationEngine {
  constructor() {
    this.memorySurveillances = new Map();
    this.memoryDeteriorations = new Map();
  }

  /**
   * 1. Calculate Standardized RCP NEWS2 Score
   */
  calculateNEWS2(vitals = {}) {
    let score = 0;
    const subScores = {};

    // 1. Respiration Rate (breaths/min)
    const rr = Number(vitals.respiratoryRate ?? vitals.rr ?? 16);
    if (rr <= 8) subScores.respiratoryRate = 3;
    else if (rr >= 9 && rr <= 11) subScores.respiratoryRate = 1;
    else if (rr >= 12 && rr <= 20) subScores.respiratoryRate = 0;
    else if (rr >= 21 && rr <= 24) subScores.respiratoryRate = 2;
    else if (rr >= 25) subScores.respiratoryRate = 3;
    score += subScores.respiratoryRate;

    // 2. Oxygen Saturation (SpO2 %)
    const spo2 = Number(vitals.spo2 ?? 98);
    const isHypercapnic = Boolean(vitals.isHypercapnicRespFailure); // e.g. COPD Scale 2
    if (!isHypercapnic) {
      if (spo2 <= 91) subScores.spo2 = 3;
      else if (spo2 >= 92 && spo2 <= 93) subScores.spo2 = 2;
      else if (spo2 >= 94 && spo2 <= 95) subScores.spo2 = 1;
      else subScores.spo2 = 0;
    } else {
      if (spo2 <= 83) subScores.spo2 = 3;
      else if (spo2 >= 84 && spo2 <= 85) subScores.spo2 = 2;
      else if (spo2 >= 86 && spo2 <= 87) subScores.spo2 = 1;
      else if (spo2 >= 88 && spo2 <= 92) subScores.spo2 = 0;
      else if (spo2 >= 93 && spo2 <= 94) subScores.spo2 = 1;
      else if (spo2 >= 95 && spo2 <= 96) subScores.spo2 = 2;
      else subScores.spo2 = 3;
    }
    score += subScores.spo2;

    // 3. Supplemental Oxygen
    const onOxygen = Boolean(vitals.onOxygen ?? vitals.supplementalO2);
    subScores.supplementalOxygen = onOxygen ? 2 : 0;
    score += subScores.supplementalOxygen;

    // 4. Systolic Blood Pressure (mmHg)
    const sbp = Number(vitals.systolicBP ?? vitals.sbp ?? 120);
    if (sbp <= 90) subScores.systolicBP = 3;
    else if (sbp >= 91 && sbp <= 100) subScores.systolicBP = 2;
    else if (sbp >= 101 && sbp <= 110) subScores.systolicBP = 1;
    else if (sbp >= 111 && sbp <= 219) subScores.systolicBP = 0;
    else if (sbp >= 220) subScores.systolicBP = 3;
    score += subScores.systolicBP;

    // 5. Pulse / Heart Rate (bpm)
    const hr = Number(vitals.heartRate ?? vitals.hr ?? 75);
    if (hr <= 40) subScores.heartRate = 3;
    else if (hr >= 41 && hr <= 50) subScores.heartRate = 1;
    else if (hr >= 51 && hr <= 90) subScores.heartRate = 0;
    else if (hr >= 91 && hr <= 110) subScores.heartRate = 1;
    else if (hr >= 111 && hr <= 130) subScores.heartRate = 2;
    else if (hr >= 131) subScores.heartRate = 3;
    score += subScores.heartRate;

    // 6. Consciousness (ACVPU: Alert = 0, Confusion, Voice, Pain, Unresponsive = 3)
    const consciousness = (vitals.consciousness || 'ALERT').toUpperCase();
    if (consciousness === 'ALERT' || consciousness === 'A') {
      subScores.consciousness = 0;
    } else {
      subScores.consciousness = 3;
    }
    score += subScores.consciousness;

    // 7. Temperature (°C)
    const temp = Number(vitals.temperature ?? vitals.temp ?? 36.8);
    if (temp <= 35.0) subScores.temperature = 3;
    else if (temp >= 35.1 && temp <= 36.0) subScores.temperature = 1;
    else if (temp >= 36.1 && temp <= 38.0) subScores.temperature = 0;
    else if (temp >= 38.1 && temp <= 39.0) subScores.temperature = 1;
    else if (temp >= 39.1) subScores.temperature = 2;
    score += subScores.temperature;

    // Calculate Mean Arterial Pressure (MAP) = (2*DBP + SBP) / 3
    const dbp = Number(vitals.diastolicBP ?? vitals.dbp ?? 80);
    const map = Math.round((2 * dbp + sbp) / 3);

    // Determine Risk Level & Clinical Response Trigger
    const hasSingleExtreme = Object.values(subScores).some(s => s === 3);
    let level = DETERIORATION_LEVELS.LOW;
    let monitoringFrequency = '12-hourly';
    let actionRecommendation = 'Lanjutkan pemantauan tanda vital rutin di bangsal rawat inap.';

    if (score >= 7) {
      level = DETERIORATION_LEVELS.HIGH;
      monitoringFrequency = 'Continuous / Setiap 15-30 Menit';
      actionRecommendation = '🚨 PERINGATAN KRITIS: Hubungi DPJP dan aktifkan Konsultasi Tim Rawat Intensif (ICU/HCU Escalation)!';
    } else if (score >= 5 || hasSingleExtreme) {
      level = DETERIORATION_LEVELS.MEDIUM;
      monitoringFrequency = 'Setiap 1 Jam';
      actionRecommendation = '⚠️ PERINGATAN PERBURUKAN: Panggil Tim Reaksi Cepat (Rapid Response Team / RRT) untuk asesmen segera!';
    } else if (score >= 1) {
      level = DETERIORATION_LEVELS.LOW_MEDIUM;
      monitoringFrequency = 'Setiap 4-6 Jam';
      actionRecommendation = 'Tingkatkan frekuensi pemantauan tanda vital minimal per 4 jam.';
    }

    return {
      totalScore: score,
      level,
      subScores,
      map,
      hasSingleExtreme,
      monitoringFrequency,
      actionRecommendation,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * 2. Schedule Active Post-Medication Surveillance Checkpoints
   */
  async schedulePostMedicationSurveillance({
    orderId,
    encounterId,
    patientId,
    patientName,
    mrn,
    medicationName,
    isHighAlert = false,
    administeredAt = new Date().toISOString()
  }) {
    const surveillanceId = `SURV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const baseTime = new Date(administeredAt).getTime();

    // Generate 4 standard surveillance checkpoints (+15m, +30m, +1h, +4h)
    const checkpoints = [
      { id: 'CHK-15M', label: '15 Menit Post-Injeksi', scheduledAt: new Date(baseTime + 15 * 60000).toISOString(), status: 'PENDING' },
      { id: 'CHK-30M', label: '30 Menit Post-Injeksi', scheduledAt: new Date(baseTime + 30 * 60000).toISOString(), status: 'PENDING' },
      { id: 'CHK-1H', label: '1 Jam Post-Injeksi', scheduledAt: new Date(baseTime + 60 * 60000).toISOString(), status: 'PENDING' },
      { id: 'CHK-4H', label: '4 Jam Post-Injeksi', scheduledAt: new Date(baseTime + 240 * 60000).toISOString(), status: 'PENDING' }
    ];

    const surveillance = {
      id: surveillanceId,
      orderId,
      encounterId,
      patientId,
      patientName,
      mrn,
      medicationName,
      isHighAlert,
      administeredAt,
      checkpoints,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    await persistenceAdapter.save(SURVEILLANCE_COLLECTION, surveillanceId, surveillance);
    return surveillance;
  }

  /**
   * 3. Adverse Drug Event (ADE) Auto-Detection & Clinical Intervention
   */
  async evaluateAdverseDrugEvent({
    encounterId,
    patientId,
    patientName,
    medicationName,
    administeredMinutesAgo = 20,
    vitals = {},
    symptoms = []
  }) {
    const medLower = (medicationName || '').toLowerCase();
    const sbp = Number(vitals.systolicBP ?? vitals.sbp ?? 120);
    const dbp = Number(vitals.diastolicBP ?? vitals.dbp ?? 80);
    const hr = Number(vitals.heartRate ?? vitals.hr ?? 75);
    const rr = Number(vitals.respiratoryRate ?? vitals.rr ?? 16);
    const spo2 = Number(vitals.spo2 ?? 98);
    const glucose = Number(vitals.bloodGlucose ?? 110);
    const map = Math.round((2 * dbp + sbp) / 3);

    const detectedEvents = [];

    // Case 1: Anaphylaxis Shock (Antibiotic/IV Med + Rash/Stridor + SpO2 drop or SBP drop)
    const hasAllergicSymptom = symptoms.some(s => /ruam|urticaria|gatal|wheezing|stridor|sesak|edema|swelling/i.test(s));
    if ((hasAllergicSymptom || rr >= 26 || spo2 < 92 || sbp < 90) && administeredMinutesAgo <= 60) {
      if (medLower.includes('ceftriaxone') || medLower.includes('amoxicillin') || medLower.includes('penicillin') || medLower.includes('antibiotik')) {
        detectedEvents.push({
          type: 'ANAPHYLAXIS_LIFE_THREATENING',
          severity: 'CRITICAL',
          title: '🚨 REAKSI ANAFILAKSIS AKUT PASCA-ANTIBIOTIK',
          triggerDrug: medicationName,
          clinicalFindings: `Onset ${administeredMinutesAgo} menit pasca-injeksi: ${symptoms.join(', ')} | SpO2: ${spo2}% | TD: ${sbp}/${dbp} mmHg | RR: ${rr} x/m`,
          immediateProtocol: [
            'Hentikan infus antibiotik segera!',
            'Injeksi Epinefrin 0.5 mg IM (1:1000) di paha anterolateral segera!',
            'Berikan O2 Masker NRM 10-12 Lpm',
            'Bolus Kristaloid Ringer Lactate 1000ml CITO',
            'Panggil Code Blue / Tim Resusitasi IGD'
          ]
        });
      }
    }

    // Case 2: Opioid-Induced Respiratory Depression (OIRD)
    if ((rr <= 9 || (vitals.consciousness && vitals.consciousness !== 'ALERT')) && administeredMinutesAgo <= 120) {
      if (medLower.includes('morphine') || medLower.includes('fentanyl') || medLower.includes('pethidine') || medLower.includes('tramadol')) {
        detectedEvents.push({
          type: 'OPIOID_RESPIRATORY_DEPRESSION',
          severity: 'CRITICAL',
          title: '🚨 DEPRESI PERNAPASAN INDUKSI OPIOID (OIRD)',
          triggerDrug: medicationName,
          clinicalFindings: `Laju napas kritis ${rr} x/m pasca pemberian opioid ${medicationName}.`,
          immediateProtocol: [
            'Stimulasi fisik dan berikan oksigenasi ventilasi bag-valve-mask',
            'Siapkan Naloxone 0.4 mg IV titrasi setiap 2-3 menit hingga RR > 12 x/m'
          ]
        });
      }
    }

    // Case 3: Hypoglycemia Emergency Post-Insulin
    if (glucose <= 70 && administeredMinutesAgo <= 240 && medLower.includes('insulin')) {
      detectedEvents.push({
        type: 'HYPOGLYCEMIA_EMERGENCY',
        severity: glucose <= 54 ? 'CRITICAL' : 'WARNING',
        title: `⚠️ HIPOGLIKEMIA PASCA-INSULIN (GDS: ${glucose} mg/dL)`,
        triggerDrug: medicationName,
        clinicalFindings: `Kadar gula darah ${glucose} mg/dL dalam rentang 4 jam pasca-insulin.`,
        immediateProtocol: [
          glucose <= 54 ? 'Injeksi Dextrose 40% 2 Flash (50 ml) IV Bolus CITO' : 'Berikan teh manis hangat / Dextrose 10% IV Drip',
          'Periksa ulang GDS 15 menit pasca-koreksi'
        ]
      });
    }

    // Case 4: Inadequate Vasopressor Response / Refractory Shock
    if (medLower.includes('norepinephrine') || medLower.includes('noradrenalin')) {
      if (map < 65 && administeredMinutesAgo >= 30) {
        detectedEvents.push({
          type: 'REFRACTORY_SEPTIC_SHOCK',
          severity: 'CRITICAL',
          title: `⚠️ SYOK REFRAKTER: TARGET MAP BELUM TERCAPAI (MAP: ${map} mmHg)`,
          triggerDrug: medicationName,
          clinicalFindings: `MAP ${map} mmHg (< 65 mmHg) setelah 30 menit titrasi Norepinefrin.`,
          immediateProtocol: [
            'Eskalasi vasopresor lini kedua: Tambahkan Vasopressin Drip 0.03 unit/menit',
            'Pertimbangkan Hidrokortison 200 mg/hari IV',
            'Konsultasi Sp.An-KIC untuk evaluasi arterial line & ICU transfer'
          ]
        });
      }
    }

    // Save event to persistence and stage outbox event if ADE detected
    if (detectedEvents.length > 0) {
      for (const ade of detectedEvents) {
        const evtRecord = {
          id: `ADE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          encounterId,
          patientId,
          patientName,
          ...ade,
          createdAt: new Date().toISOString()
        };
        await persistenceAdapter.save(DETERIORATION_EVENTS_COLLECTION, evtRecord.id, evtRecord);
        await outboxPublisherService.stageEvent({
          aggregateType: 'ADVERSE_DRUG_EVENT',
          aggregateId: evtRecord.id,
          eventName: 'ADE_DETECTED',
          payload: evtRecord
        });
      }
    }

    return {
      hasAdverseEvent: detectedEvents.length > 0,
      events: detectedEvents
    };
  }

  /**
   * 4. Ingest Vitals, Recalculate NEWS2 & Trigger Escalation If Necessary
   */
  async ingestVitalsAndAssessDeterioration({
    encounterId,
    patientId,
    patientName,
    mrn,
    vitals = {},
    actor = { id: 'NURSE-01', name: 'Ns. Sarah', role: 'NURSE' }
  }) {
    const news2 = this.calculateNEWS2(vitals);

    // Record Event
    const record = {
      id: `DET-NEWS2-${Date.now()}`,
      encounterId,
      patientId,
      patientName,
      mrn,
      vitals,
      news2,
      assessedBy: actor,
      recordedAt: new Date().toISOString()
    };

    await persistenceAdapter.save(DETERIORATION_EVENTS_COLLECTION, record.id, record);

    let governanceAlertResult = null;
    let downgradeResult = null;
    let careStateTransitionResult = null;

    // 1. Critical Escalation (NEWS2 >= 7)
    if (news2.totalScore >= 7) {
      governanceAlertResult = await clinicalSafetyGovernanceEngine.createExplainableAlert({
        encounterId,
        patientId,
        patientName,
        mrn,
        ruleKey: 'NEWS2_CRITICAL_ESCALATION',
        contributingFactors: {
          totalScore: news2.totalScore,
          subScores: news2.subScores,
          map: news2.map
        },
        clinicalFindings: `Pasien mengalami perburukan klinis kritis dengan total skor NEWS2: ${news2.totalScore} (Tingkat Kritis: TINGGI). MAP: ${news2.map} mmHg.`,
        recommendedActions: [
          'Evaluasi klinis segera oleh DPJP / Dokter Jaga Bangsal (< 10 Menit)',
          'Konsultasi CITO Dokter Spesialis Anestesi & Terapi Intensif (Sp.An-KIC)',
          'Aktivasi alur eskalasi bed Intensive Care Unit (ICU / HCU)',
          'Pemeriksaan Analisa Gas Darah (AGD) & Laktat serial'
        ],
        severity: 'CRITICAL',
        actor
      });

      try {
        const currentEnc = await persistenceAdapter.findById('encounters', encounterId);
        if (currentEnc && currentEnc.primaryState !== CARE_STATES.ICU_ACTIVE) {
          careStateTransitionResult = await careStateEngine.transition({
            encounterId,
            targetState: CARE_STATES.ICU_ACTIVE,
            actor: { id: actor.id, name: actor.name, role: actor.role },
            metadata: {
              reason: `Perburukan klinis terkonfirmasi: NEWS2 ${news2.totalScore} (${news2.level})`,
              expectedVersion: currentEnc.version || 1
            }
          });
        }
      } catch (err) {
        console.warn(`[ClinicalDeteriorationEngine] Escalation state note:`, err.message);
      }
    } 
    // 2. Medium Risk Escalation (NEWS2 5 - 6 or Single Parameter 3)
    else if (news2.totalScore >= 5 || news2.hasSingleExtreme) {
      governanceAlertResult = await clinicalSafetyGovernanceEngine.createExplainableAlert({
        encounterId,
        patientId,
        patientName,
        mrn,
        ruleKey: 'NEWS2_MEDIUM_RRT',
        contributingFactors: {
          totalScore: news2.totalScore,
          subScores: news2.subScores,
          hasSingleExtreme: news2.hasSingleExtreme
        },
        clinicalFindings: `Pasien memiliki skor NEWS2: ${news2.totalScore} (Tingkat: SEDANG). Peringatan Tim Reaksi Cepat (RRT).`,
        recommendedActions: [
          'Panggil Tim Reaksi Cepat (Rapid Response Team / RRT) untuk asesmen di bangsal (< 30 Menit)',
          'Tingkatkan pemantauan tanda vital menjadi setiap 1 jam',
          'Laporkan ke DPJP untuk penyesuaian terapi'
        ],
        severity: 'WARNING',
        actor
      });
    }
    // 3. Clinical Recovery / Downgrade Pathway Evaluation (NEWS2 <= 4)
    else {
      downgradeResult = await clinicalSafetyGovernanceEngine.evaluateDowngradePathway({
        encounterId,
        newNews2: news2,
        actor
      });
    }

    return {
      record,
      news2,
      governanceAlert: governanceAlertResult?.alert || null,
      isDeduplicated: governanceAlertResult?.isDeduplicated || false,
      downgradeResult,
      escalationTriggered: news2.totalScore >= 7,
      careStateTransitionResult
    };
  }
}

export const clinicalDeteriorationEngine = new ClinicalDeteriorationEngine();
export default clinicalDeteriorationEngine;
