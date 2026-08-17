/**
 * NurseFlow Enterprise HIS 2026 — Triage Assessment Engine
 * Sprint 3: Australasian Triage Scale (ATS) & Emergency Severity Index (ESI v4)
 * Standar Kepatuhan: WHO Emergency Care, JCI 7th Edition, KARS 2024.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { encounterEngineService } from '../../clinical_core/services/encounterEngine.service.js';
import { triageSlaEngineService } from './triageSlaEngine.service.js';

export const TRIAGE_LEVEL_SPECS = {
  P1_RESUSCITATION: {
    level: 1,
    code: 'P1_RESUSCITATION',
    atsLabel: 'ATS 1 (Resusitasi Segera)',
    esiLabel: 'ESI 1 (Unstable / Immediate)',
    colorCode: 'RED',
    targetMinutes: 0,
    badgeClass: 'bg-rose-600 text-white',
    description: 'Ancaman henti jantung/nafas seketika. Respon 0 Menit.'
  },
  P2_EMERGENT: {
    level: 2,
    code: 'P2_EMERGENT',
    atsLabel: 'ATS 2 (Gawat Darurat Akut)',
    esiLabel: 'ESI 2 (High Risk / Confused / Severe Pain)',
    colorCode: 'ORANGE',
    targetMinutes: 10,
    badgeClass: 'bg-amber-600 text-white',
    description: 'Kondisi mengancam jiwa atau organ dalam waktu singkat. Respon ≤ 10 Menit.'
  },
  P3_URGENT: {
    level: 3,
    code: 'P3_URGENT',
    atsLabel: 'ATS 3 (Darurat Sedang)',
    esiLabel: 'ESI 3 (2+ Resources Needed, Vital Normal)',
    colorCode: 'YELLOW',
    targetMinutes: 30,
    badgeClass: 'bg-yellow-500 text-black',
    description: 'Kondisi darurat berpotensi perburukan. Respon ≤ 30 Menit.'
  },
  P4_SEMI_URGENT: {
    level: 4,
    code: 'P4_SEMI_URGENT',
    atsLabel: 'ATS 4 (Semi-Darurat)',
    esiLabel: 'ESI 4 (1 Resource Needed)',
    colorCode: 'GREEN',
    targetMinutes: 60,
    badgeClass: 'bg-emerald-600 text-white',
    description: 'Kondisi kompleksitas rendah. Respon ≤ 60 Menit.'
  },
  P5_NON_URGENT: {
    level: 5,
    code: 'P5_NON_URGENT',
    atsLabel: 'ATS 5 (Bukan Gawat Darurat)',
    esiLabel: 'ESI 5 (No Resources Needed)',
    colorCode: 'BLUE',
    targetMinutes: 120,
    badgeClass: 'bg-blue-600 text-white',
    description: 'Masalah klinis ringan / kronis stabil. Respon ≤ 120 Menit.'
  }
};

const TRIAGE_STORAGE_KEY = 'nurseflow_emergency_triage_assessments';

let inMemoryTriages = [
  {
    id: 'TRG-2026-001',
    episode_id: 'EOC-2026-001',
    encounter_id: 'ENC-2026-001',
    patient_id: 'P-1001',
    patient_name: 'Ny. Siti Nurhaliza, S.Pd',
    mrn: 'MRN-2026-001001',
    triage_method: 'ATS',
    triage_level: 'P2_EMERGENT',
    ats_level: 2,
    esi_level: 2,
    chief_complaint: 'Nyeri dada hebat menjalar ke lengan kiri, keringat dingin, sesak nafas akut',
    airway_status: 'PATENT',
    breathing_status: 'DYSPNEA',
    circulation_status: 'SHOCK',
    disability_status: 'ALERT',
    vitals: {
      bloodPressureSystolic: 90,
      bloodPressureDiastolic: 60,
      heartRate: 118,
      respiratoryRate: 28,
      temperature: 36.8,
      spo2: 93,
      gcsEye: 4,
      gcsVerbal: 5,
      gcsMotor: 6,
      gcsTotal: 15,
      painScale: 8
    },
    is_trauma: false,
    is_cito: true,
    target_response_minutes: 10,
    assessed_at: '2026-08-17T08:20:00Z',
    assessed_by: 'Ns. Ratna Sari, S.Kep (Perawat Triase)',
    branch_id: 'BRN-JKT-PST'
  }
];

const getStoredTriages = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TRIAGE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[TriageEngine] Failed to load triage records:', e);
  }
  return inMemoryTriages;
};

const saveStoredTriages = (list) => {
  inMemoryTriages = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('[TriageEngine] Failed to save triage records:', e);
  }
};

export const triageEngineService = {
  /**
   * Calculate Glasgow Coma Scale (GCS)
   */
  calculateGcs: (e, v, m) => {
    const eye = Math.min(4, Math.max(1, Number(e) || 4));
    const verbal = Math.min(5, Math.max(1, Number(v) || 5));
    const motor = Math.min(6, Math.max(1, Number(m) || 6));
    return {
      eye,
      verbal,
      motor,
      total: eye + verbal + motor
    };
  },

  /**
   * Automatically Classify Triage Severity based on ABCDE & Vitals
   */
  classifySeverity: ({
    airwayStatus,
    breathingStatus,
    circulationStatus,
    spo2,
    heartRate,
    gcsTotal,
    painScale,
    isTrauma = false
  }) => {
    // 1. Immediate P1 Criteria (Airway Obstructed, Apnea, Unresponsive GCS < 9, Severe Shock)
    if (
      airwayStatus === 'OBSTRUCTED' ||
      breathingStatus === 'APNEA' ||
      circulationStatus === 'SHOCK' ||
      gcsTotal <= 8 ||
      spo2 < 85
    ) {
      return TRIAGE_LEVEL_SPECS.P1_RESUSCITATION;
    }

    // 2. Emergent P2 Criteria (Threatened Airway, Severe Dyspnea, SpO2 < 92%, Severe Pain >= 7, GCS 9-12)
    if (
      airwayStatus === 'THREATENED' ||
      breathingStatus === 'DYSPNEA' ||
      circulationStatus === 'HEMORRHAGE' ||
      spo2 <= 92 ||
      heartRate > 130 ||
      heartRate < 45 ||
      gcsTotal <= 12 ||
      painScale >= 7
    ) {
      return TRIAGE_LEVEL_SPECS.P2_EMERGENT;
    }

    // 3. Urgent P3 Criteria (Moderate Dyspnea, Pain 4-6, Vitals Borderline)
    if (painScale >= 4 || spo2 <= 95 || heartRate > 105) {
      return TRIAGE_LEVEL_SPECS.P3_URGENT;
    }

    // 4. Semi-Urgent P4 vs Non-Urgent P5
    if (isTrauma || painScale > 0) {
      return TRIAGE_LEVEL_SPECS.P4_SEMI_URGENT;
    }

    return TRIAGE_LEVEL_SPECS.P5_NON_URGENT;
  },

  /**
   * Record Complete Triage Assessment & Trigger SLA Stopwatch
   */
  recordTriageAssessment: async ({
    episodeId,
    encounterId,
    patientId,
    patientName,
    mrn,
    triageMethod = 'ATS',
    chiefComplaint,
    airwayStatus = 'PATENT',
    breathingStatus = 'NORMAL',
    circulationStatus = 'NORMAL',
    disabilityStatus = 'ALERT',
    exposureNotes = '',
    bloodPressureSystolic = 120,
    bloodPressureDiastolic = 80,
    heartRate = 80,
    respiratoryRate = 18,
    temperature = 36.5,
    spo2 = 98,
    gcsEye = 4,
    gcsVerbal = 5,
    gcsMotor = 6,
    painScale = 0,
    isTrauma = false,
    assessorName = 'Ns. Ratna Sari, S.Kep',
    branchId = 'BRN-JKT-PST'
  }) => {
    const gcs = triageEngineService.calculateGcs(gcsEye, gcsVerbal, gcsMotor);
    const spec = triageEngineService.classifySeverity({
      airwayStatus,
      breathingStatus,
      circulationStatus,
      spo2,
      heartRate,
      gcsTotal: gcs.total,
      painScale,
      isTrauma
    });

    const now = new Date().toISOString();
    const assessment = {
      id: `TRG-${Date.now()}`,
      episode_id: episodeId,
      encounter_id: encounterId,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      triage_method: triageMethod,
      triage_level: spec.code,
      ats_level: spec.level,
      esi_level: spec.level,
      chief_complaint: chiefComplaint,
      airway_status: airwayStatus,
      breathing_status: breathingStatus,
      circulation_status: circulationStatus,
      disability_status: disabilityStatus,
      exposure_notes: exposureNotes,
      vitals: {
        bloodPressureSystolic: Number(bloodPressureSystolic),
        bloodPressureDiastolic: Number(bloodPressureDiastolic),
        heartRate: Number(heartRate),
        respiratoryRate: Number(respiratoryRate),
        temperature: Number(temperature),
        spo2: Number(spo2),
        gcsEye: gcs.eye,
        gcsVerbal: gcs.verbal,
        gcsMotor: gcs.motor,
        gcsTotal: gcs.total,
        painScale: Number(painScale)
      },
      is_trauma: Boolean(isTrauma),
      is_cito: spec.level <= 2,
      target_response_minutes: spec.targetMinutes,
      assessed_at: now,
      assessed_by: assessorName,
      branch_id: branchId
    };

    const currentList = getStoredTriages();
    saveStoredTriages([assessment, ...currentList]);

    // 1. Trigger Encounter State Machine: Transition to TRIAGED
    try {
      await encounterEngineService.transitionEncounterStatus({
        encounterId,
        nextStatus: 'TRIAGED',
        reason: `Triase selesai: ${spec.atsLabel}`,
        actorEmail: assessorName
      });
    } catch (e) {
      console.warn('[TriageEngine] Encounter state note:', e.message);
    }

    // 2. Start SLA Response Stopwatch Timer
    await triageSlaEngineService.startSlaTimer({
      encounterId,
      patientName,
      triageLevel: spec.code,
      targetResponseMinutes: spec.targetMinutes
    });

    // 3. Stage Domain Event
    await outboxPublisherService.stageEvent({
      aggregateType: 'TRIAGE',
      aggregateId: assessment.id,
      eventName: 'TRIAGE_COMPLETED',
      payload: assessment,
      actor: assessorName,
      branchId
    });

    return assessment;
  },

  /**
   * Query Triage Records
   */
  getTriageRecords: (filters = {}) => {
    let list = getStoredTriages();
    if (filters.encounterId) {
      list = list.filter(t => t.encounter_id === filters.encounterId);
    }
    if (filters.level && filters.level !== 'ALL') {
      list = list.filter(t => t.triage_level === filters.level);
    }
    return list;
  }
};
