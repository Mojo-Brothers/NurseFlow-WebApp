/**
 * NurseFlow Enterprise HIS 2026 — Clinical Risk Stratification Engine
 * 
 * Core Philosophy:
 * "Trajectory Engine observes. Risk Stratifier structures. Safety Governance enforces. Clinician decides."
 * 
 * Standards & Clinical References:
 * 1. Royal College of Physicians (RCP) NEWS2 Risk Bands & Clinical Response Thresholds
 * 2. Surviving Sepsis Campaign (SSC) 2021 Multi-Organ Hypoperfusion Criteria
 * 3. KDIGO AKI Staging & Dynamic Urine Output Rate Standards
 * 4. Institute for Healthcare Improvement (IHI) Rapid Response Systems & Trigger Matrices
 * 5. ISO 27799 / WORM Audit Trail Cryptographic Lineage (SHA-256)
 * 
 * Architectural Invariants:
 * - Triad Separation: Severity (Snapshot) != Trajectory (Velocity) != Risk (Action Urgency)
 * - Open Decomposable Synthesis: Zero Black-Box Weights / Zero Unvalidated Neural Probabilities
 * - Absolute Clinician In The Loop: Full override authority with immutable WORM audit trails
 */

import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { clinicalTrajectoryEngine } from './clinicalTrajectoryEngine.service.js';
import { clinicalSafetyGovernanceEngine } from './clinicalSafetyGovernanceEngine.service.js';
import crypto from 'crypto';

const RISK_STRATIFICATION_EVENTS_COLLECTION = 'clinical_risk_stratification_events';
const RISK_OVERRIDE_AUDIT_COLLECTION = 'clinical_risk_override_audits';

export const SEVERITY_STATES = {
  NORMAL: 'NORMAL',
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  CRITICAL: 'CRITICAL'
};

export const TRAJECTORY_STATES = {
  IMPROVING: 'IMPROVING',
  STABLE: 'STABLE',
  SLOW_DRIFT: 'SLOW_DRIFT',
  MODERATE_WORSENING: 'MODERATE_WORSENING',
  RAPID_WORSENING: 'RAPID_WORSENING',
  FULMINANT_CRISIS: 'FULMINANT_CRISIS'
};

export const OVERALL_RISK_STATES = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const ESCALATION_PRIORITIES = {
  ROUTINE_MONITORING: 'ROUTINE_MONITORING',
  SCHEDULED_ROUND: 'SCHEDULED_ROUND',
  PROMPT_REVIEW: 'PROMPT_REVIEW',
  URGENT_REVIEW: 'URGENT_REVIEW',
  IMMEDIATE_EMERGENCY_RESPONSE: 'IMMEDIATE_EMERGENCY_RESPONSE'
};

export const EVIDENCE_QUALITIES = {
  HIGH: 'HIGH',
  MODERATE: 'MODERATE',
  LOW: 'LOW',
  INSUFFICIENT: 'INSUFFICIENT'
};

export const CLINICAL_ROLES = {
  WARD_NURSE: 'WARD_NURSE',
  CHARGE_NURSE: 'CHARGE_NURSE',
  RESIDENT_DOCTOR: 'RESIDENT_DOCTOR',
  DPJP_SPECIALIST: 'DPJP_SPECIALIST',
  MET_ICU_TEAM: 'MET_ICU_TEAM'
};

export const DOMAIN_NAMES = {
  HEMODYNAMIC: 'HEMODYNAMIC',
  RESPIRATORY: 'RESPIRATORY',
  NEUROLOGIC: 'NEUROLOGIC',
  RENAL_METABOLIC: 'RENAL_METABOLIC',
  INFECTION_SEPSIS: 'INFECTION_SEPSIS',
  MEDICATION_EXPOSURE: 'MEDICATION_EXPOSURE'
};

export const RISK_STRATIFIER_RULES = {
  TRIAD_PRE_CRISIS_TRIGGER: {
    ruleId: 'RULE-RISK-PRECRISIS-V1',
    ruleName: 'Pre-Crisis Rapid Deterioration Trigger',
    ruleVersion: '1.0.0',
    description: 'Elevates Mild/Moderate severity to HIGH risk when velocity >= +1.5/h'
  },
  MULTIDOMAIN_MODS_SYNERGY: {
    ruleId: 'RULE-RISK-MODS-V1',
    ruleName: 'Multi-Organ Incipient Dysfunction Synergy',
    ruleVersion: '1.0.0',
    description: 'Elevates composite risk to CRITICAL when >= 3 domains demonstrate active dysfunction'
  },
  COPD_SCALE2_ADAPTIVE: {
    ruleId: 'RULE-RISK-COPD-SCALE2-V1',
    ruleName: 'Chronic Hypercapnia Scale 2 Adaptive Gate',
    ruleVersion: '1.0.0',
    description: 'Prevents false-alarm escalation for COPD patients with target SpO2 88-92%'
  },
  PALLIATIVE_COMFORT_GATE: {
    ruleId: 'RULE-RISK-PALLIATIVE-V1',
    ruleName: 'Palliative Care / DNR Boundary Gate',
    ruleVersion: '1.0.0',
    description: 'Channels DNR patients to comfort-directed monitoring avoiding inappropriate MET activation'
  },
  DIALYSIS_UREMIA_BASELINE: {
    ruleId: 'RULE-RISK-CKD-BASELINE-V1',
    ruleName: 'Chronic Dialysis Baseline Adaptation',
    ruleVersion: '1.0.0',
    description: 'Prevents false AKI escalation in anuric/hemodialysis patients with stable high baseline creatinine'
  }
};

export class ClinicalRiskStratifier {
  constructor() {
    this.auditLedger = [];
  }

  /**
   * 1. Evaluasi Keparahan Snapshot (Severity State Evaluation)
   */
  evaluateSeverity(latestObservation = {}, patientProfile = {}) {
    if (!latestObservation || Object.keys(latestObservation).length === 0) {
      return {
        severityState: SEVERITY_STATES.NORMAL,
        news2Score: 0,
        panicTriggers: [],
        primaryDerangement: 'NO_ACTIVE_OBSERVATIONS'
      };
    }

    const {
      hr, sbp, dbp, map, rr, spo2, o2, temp, consciousness, gcs,
      lactate, ph, potassium, bloodGlucose, creatinine, bilirubin,
      activeAdverseEvent, postArrest
    } = latestObservation;

    const isCopdScale2 = Boolean(patientProfile.isCopd || latestObservation.isCopd || patientProfile.spo2Scale === 2);
    const isPediatric = Boolean(patientProfile.isPediatric || (patientProfile.ageYears !== undefined && patientProfile.ageYears < 18));

    const panicTriggers = [];

    // --- A. Pediatric Specific Checks ---
    if (isPediatric) {
      const pAge = patientProfile.ageYears || 3;
      if (pAge <= 5 && hr > 160 && rr > 40) {
        panicTriggers.push(`Pediatric Decompensation (HR ${hr}, RR ${rr})`);
        return {
          severityState: SEVERITY_STATES.CRITICAL,
          news2Score: 8,
          panicTriggers,
          primaryDerangement: 'PEDIATRIC_CARDIORESPIRATORY_DECOMPENSATION'
        };
      }
    }

    // --- B. Extreme Single Parameters & Panic Labs ---
    if (postArrest) {
      panicTriggers.push('Post-Resuscitation / Post-Cardiac Arrest State');
    }
    if (ph !== undefined && ph < 7.20) {
      panicTriggers.push(`Extreme Acidemia (pH ${ph} < 7.20)`);
    }
    if (potassium !== undefined && potassium >= 6.5) {
      panicTriggers.push(`Severe Hyperkalemia (K+ ${potassium} mEq/L >= 6.5)`);
    }
    if (lactate !== undefined && lactate >= 4.0) {
      panicTriggers.push(`Severe Tissue Hypoperfusion (Lactate ${lactate} mmol/L >= 4.0)`);
    }
    if (bloodGlucose !== undefined && bloodGlucose <= 54) {
      panicTriggers.push(`Severe Hypoglycemia (Blood Glucose ${bloodGlucose} mg/dL <= 54)`);
    }
    if (bloodGlucose !== undefined && bloodGlucose >= 500) {
      panicTriggers.push(`Hyperglycemic Crisis / DKA-HHS Alert (Blood Glucose ${bloodGlucose} mg/dL)`);
    }
    if (gcs !== undefined && gcs <= 8) {
      panicTriggers.push(`Severe Coma / Airway Compromise (GCS ${gcs} <= 8)`);
    }
    if (activeAdverseEvent === 'ANAPHYLAXIS' || latestObservation.isAnaphylaxis) {
      panicTriggers.push('Acute Anaphylaxis / Upper Airway Stridor Collapse');
    }
    if (activeAdverseEvent === 'OPIOID_OVERSEDATION' || (latestObservation.opioidGiven && rr <= 9)) {
      panicTriggers.push(`Opioid-Induced Respiratory Depression (RR ${rr} <= 9)`);
    }

    // --- C. Standard NEWS2 Scoring ---
    let news2 = 0;
    let hasSingleExtreme3 = false;

    // Respiration Rate
    if (rr !== undefined) {
      if (rr <= 8) { news2 += 3; hasSingleExtreme3 = true; }
      else if (rr >= 9 && rr <= 11) { news2 += 1; }
      else if (rr >= 12 && rr <= 20) { news2 += 0; }
      else if (rr >= 21 && rr <= 24) { news2 += 2; }
      else if (rr >= 25) { news2 += 3; hasSingleExtreme3 = true; }
    }

    // SpO2
    if (spo2 !== undefined) {
      if (!isCopdScale2) {
        // Scale 1
        if (spo2 <= 91) { news2 += 3; hasSingleExtreme3 = true; }
        else if (spo2 === 92 || spo2 === 93) { news2 += 2; }
        else if (spo2 === 94 || spo2 === 95) { news2 += 1; }
        else if (spo2 >= 96) { news2 += 0; }
      } else {
        // Scale 2 (Target 88-92%)
        if (spo2 < 84) { news2 += 3; hasSingleExtreme3 = true; }
        else if (spo2 === 84 || spo2 === 85) { news2 += 2; }
        else if (spo2 === 86 || spo2 === 87) { news2 += 1; }
        else if (spo2 >= 88 && spo2 <= 92) { news2 += 0; }
        else if (spo2 === 93 || spo2 === 94) { news2 += 1; }
        else if (spo2 === 95 || spo2 === 96) { news2 += 2; }
        else if (spo2 >= 97) { news2 += 3; hasSingleExtreme3 = true; }
      }
    }

    // Supplemental Oxygen
    if (o2 && o2 !== 'ROOM_AIR' && o2 !== 'NONE') {
      news2 += 2;
    }

    // Systolic BP
    if (sbp !== undefined) {
      if (sbp <= 90) { news2 += 3; hasSingleExtreme3 = true; }
      else if (sbp >= 91 && sbp <= 100) { news2 += 2; }
      else if (sbp >= 101 && sbp <= 110) { news2 += 1; }
      else if (sbp >= 111 && sbp <= 219) { news2 += 0; }
      else if (sbp >= 220) { news2 += 3; hasSingleExtreme3 = true; }
    }

    // Heart Rate
    if (hr !== undefined) {
      if (hr <= 40) { news2 += 3; hasSingleExtreme3 = true; }
      else if (hr >= 41 && hr <= 50) { news2 += 1; }
      else if (hr >= 51 && hr <= 90) { news2 += 0; }
      else if (hr >= 91 && hr <= 110) { news2 += 1; }
      else if (hr >= 111 && hr <= 130) { news2 += 2; }
      else if (hr >= 131) { news2 += 3; hasSingleExtreme3 = true; }
    }

    // Consciousness
    const cStr = String(consciousness || 'ALERT').toUpperCase();
    if (cStr !== 'ALERT' && cStr !== 'A') {
      news2 += 3;
      hasSingleExtreme3 = true;
    }

    // Temperature
    if (temp !== undefined) {
      if (temp <= 35.0) { news2 += 3; hasSingleExtreme3 = true; }
      else if (temp >= 35.1 && temp <= 36.0) { news2 += 1; }
      else if (temp >= 36.1 && temp <= 38.0) { news2 += 0; }
      else if (temp >= 38.1 && temp <= 39.0) { news2 += 1; }
      else if (temp >= 39.1) { news2 += 2; }
    }

    // Override score if explicitly provided
    if (latestObservation.news2 !== undefined) {
      news2 = latestObservation.news2;
    }

    // --- D. Severity Mapping ---
    let severityState = SEVERITY_STATES.NORMAL;
    if (panicTriggers.length > 0 || news2 >= 9) {
      severityState = SEVERITY_STATES.CRITICAL;
    } else if (news2 >= 7 && news2 <= 8) {
      severityState = SEVERITY_STATES.SEVERE;
    } else if (news2 >= 5 && news2 <= 6) {
      severityState = SEVERITY_STATES.MODERATE;
    } else if (hasSingleExtreme3) {
      // Single parameter extreme 3
      severityState = (gcs !== undefined && gcs <= 8) ? SEVERITY_STATES.CRITICAL : SEVERITY_STATES.MODERATE;
    } else if (news2 >= 2 && news2 <= 4) {
      severityState = SEVERITY_STATES.MILD;
    } else {
      severityState = SEVERITY_STATES.NORMAL;
    }

    return {
      severityState,
      news2Score: news2,
      hasSingleExtreme3,
      panicTriggers,
      primaryDerangement: panicTriggers[0] || `NEWS2_${news2}_STATE`
    };
  }

  /**
   * 2. Evaluasi Vektor Trajektori & Dampak Kecepatan (Trajectory Impact Evaluation)
   */
  evaluateTrajectoryImpact(trajectoryVector = {}, observations = []) {
    let velocityScorePerHour = 0;
    let mapVelocityPerHour = 0;
    let rrVelocityPerHour = 0;
    let lactateVelocityPerHour = 0;
    let persistenceActive = false;
    let trajectoryState = TRAJECTORY_STATES.STABLE;

    // A. Consume from trajectory vector if present
    if (trajectoryVector && Object.keys(trajectoryVector).length > 0) {
      velocityScorePerHour = trajectoryVector.news2VelocityPerHour || 0;
      if (trajectoryVector.systems?.hemodynamic?.mapVelocityMmHgPerHour !== undefined) {
        mapVelocityPerHour = trajectoryVector.systems.hemodynamic.mapVelocityMmHgPerHour;
      }
      if (trajectoryVector.systems?.respiratory?.rrVelocityBreathsPerHour !== undefined) {
        rrVelocityPerHour = trajectoryVector.systems.respiratory.rrVelocityBreathsPerHour;
      }
      if (trajectoryVector.systems?.metabolicRenal?.lactateVelocityMmolPerHour !== undefined) {
        lactateVelocityPerHour = trajectoryVector.systems.metabolicRenal.lactateVelocityMmolPerHour;
      }
      persistenceActive = Boolean(trajectoryVector.persistenceActive);
    } 
    // B. Otherwise derive from raw observations stream
    else if (Array.isArray(observations) && observations.length >= 2) {
      const validObs = observations.filter(o => o.timestamp && !o.isArtefact);
      if (validObs.length >= 2) {
        const sorted = [...validObs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const dtHours = Math.max(0.25, (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / (1000 * 3600));

        const nStart = first.news2 !== undefined ? first.news2 : 0;
        const nEnd = last.news2 !== undefined ? last.news2 : 0;
        velocityScorePerHour = Number(((nEnd - nStart) / dtHours).toFixed(2));

        if (first.map !== undefined && last.map !== undefined) {
          mapVelocityPerHour = Number(((last.map - first.map) / dtHours).toFixed(2));
        }
        if (first.rr !== undefined && last.rr !== undefined) {
          rrVelocityPerHour = Number(((last.rr - first.rr) / dtHours).toFixed(2));
        }
        if (first.lactate !== undefined && last.lactate !== undefined) {
          lactateVelocityPerHour = Number(((last.lactate - first.lactate) / dtHours).toFixed(2));
        }
        persistenceActive = sorted.length >= 3 && velocityScorePerHour > 0;
      }
    }

    // C. Map to Trajectory State
    if (velocityScorePerHour > 2.0 || rrVelocityPerHour >= 6.0 || mapVelocityPerHour <= -10.0) {
      trajectoryState = TRAJECTORY_STATES.FULMINANT_CRISIS;
    } else if (velocityScorePerHour >= 1.0 || rrVelocityPerHour >= 3.0 || mapVelocityPerHour <= -5.0 || lactateVelocityPerHour >= 0.5) {
      trajectoryState = TRAJECTORY_STATES.RAPID_WORSENING;
    } else if (velocityScorePerHour >= 0.5 || rrVelocityPerHour >= 1.5 || mapVelocityPerHour <= -3.0) {
      trajectoryState = TRAJECTORY_STATES.MODERATE_WORSENING;
    } else if (velocityScorePerHour > 0.0) {
      trajectoryState = TRAJECTORY_STATES.SLOW_DRIFT;
    } else if (velocityScorePerHour <= -1.0) {
      trajectoryState = TRAJECTORY_STATES.IMPROVING;
    } else {
      trajectoryState = TRAJECTORY_STATES.STABLE;
    }

    return {
      trajectoryState,
      velocityScorePerHour,
      mapVelocityPerHour,
      rrVelocityPerHour,
      lactateVelocityPerHour,
      persistenceActive
    };
  }

  /**
   * 3. Evaluasi Kualitas Bukti & Filter Integritas Sinyal (Evidence Quality Gate)
   */
  evaluateEvidenceQuality(latestObservation = {}, observations = []) {
    if (!latestObservation || Object.keys(latestObservation).length === 0) {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.INSUFFICIENT,
        dataDeficitWarning: 'Tidak ada data observasi pasien yang dapat dievaluasi.',
        missingParameters: ['ALL']
      };
    }

    const missingParameters = [];
    if (latestObservation.hr === undefined) missingParameters.push('HR');
    if (latestObservation.sbp === undefined && latestObservation.map === undefined) missingParameters.push('BP/MAP');
    if (latestObservation.rr === undefined) missingParameters.push('RR');
    if (latestObservation.spo2 === undefined) missingParameters.push('SpO2');
    if (latestObservation.consciousness === undefined && latestObservation.gcs === undefined) missingParameters.push('CONSCIOUSNESS');

    // Filter Artefak Sinyal (e.g. Probe Disconnected or < 30s transient drop)
    if (latestObservation.isArtefact || latestObservation.isPoorSignal) {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.LOW,
        dataDeficitWarning: 'Data observasi mengandung artefak pergerakan atau sensor terlepas (Probe OFF).',
        missingParameters
      };
    }

    if (missingParameters.length >= 2) {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.INSUFFICIENT,
        dataDeficitWarning: `Parameter TTV penting tidak lengkap: ${missingParameters.join(', ')}. Diperlukan pengukuran ulang segera.`,
        missingParameters
      };
    }

    const obsCount = Array.isArray(observations) ? observations.length : 1;
    if (obsCount >= 3 && missingParameters.length === 0) {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.HIGH,
        dataDeficitWarning: null,
        missingParameters: []
      };
    } else if (obsCount >= 2 || missingParameters.length === 1) {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.MODERATE,
        dataDeficitWarning: missingParameters.length > 0 ? `Parameter ${missingParameters.join(', ')} belum tercatat.` : null,
        missingParameters
      };
    } else {
      return {
        evidenceQuality: EVIDENCE_QUALITIES.LOW,
        dataDeficitWarning: 'Hanya tersedia snapshot tunggal; tren trajektori temporal belum memiliki titik verifikasi berseri.',
        missingParameters
      };
    }
  }

  /**
   * 4. Dekomposisi Risiko 6 Domain Fisiologis (Multi-Domain Risk Decomposition)
   */
  decomposeDomainRisks(patientProfile = {}, latestObservation = {}, trajectoryImpact = {}, observations = []) {
    const domainRisks = {};

    // ─── A. Hemodynamic Domain ───
    {
      const hr = latestObservation.hr;
      const map = latestObservation.map || (latestObservation.sbp && latestObservation.dbp ? (latestObservation.sbp + 2 * latestObservation.dbp) / 3 : undefined);
      const sbp = latestObservation.sbp;
      const mapVel = trajectoryImpact.mapVelocityPerHour || 0;
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;

      if (sbp !== undefined && sbp <= 90) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Hipotensi berat (SBP ${sbp} mmHg <= 90)`);
      } else if (map !== undefined && map < 65) {
        severity = SEVERITY_STATES.SEVERE;
        findings.push(`MAP kritis < 65 mmHg (${Math.round(map)} mmHg)`);
      } else if (map !== undefined && map <= 75) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`MAP batas bawah (${Math.round(map)} mmHg)`);
      } else if (hr !== undefined && hr >= 110) {
        severity = SEVERITY_STATES.MILD;
        findings.push(`Takikardia (${hr} bpm)`);
      }

      if (mapVel <= -6.0) {
        trajectory = TRAJECTORY_STATES.RAPID_WORSENING;
        findings.push(`Penurunan tekanan darah cepat (${mapVel} mmHg/jam)`);
      } else if (mapVel <= -3.0) {
        trajectory = TRAJECTORY_STATES.MODERATE_WORSENING;
        findings.push(`Tren penurunan MAP (${mapVel} mmHg/jam)`);
      }

      if (latestObservation.vasopressorActive || latestObservation.inotropesActive) {
        findings.push('Penggunaan obat vasoaktif/inotropik aktif');
        if (severity === SEVERITY_STATES.NORMAL) severity = SEVERITY_STATES.MODERATE;
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL || (severity === SEVERITY_STATES.SEVERE && trajectory !== TRAJECTORY_STATES.IMPROVING)) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.SEVERE || 
                (severity === SEVERITY_STATES.MODERATE && (trajectory === TRAJECTORY_STATES.RAPID_WORSENING || trajectory === TRAJECTORY_STATES.FULMINANT_CRISIS || trajectory === TRAJECTORY_STATES.MODERATE_WORSENING)) || 
                (severity === SEVERITY_STATES.MILD && trajectory === TRAJECTORY_STATES.RAPID_WORSENING) ||
                (trajectory === TRAJECTORY_STATES.RAPID_WORSENING || trajectory === TRAJECTORY_STATES.FULMINANT_CRISIS || mapVel <= -5.0)) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MODERATE || severity === SEVERITY_STATES.MILD) {
        compositeRisk = OVERALL_RISK_STATES.MODERATE;
      }

      domainRisks.hemodynamic = {
        domainName: DOMAIN_NAMES.HEMODYNAMIC,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { hr, sbp, map, mapVelocityPerHour: mapVel }
      };
    }

    // ─── B. Respiratory Domain ───
    {
      const rr = latestObservation.rr;
      const spo2 = latestObservation.spo2;
      const rrVel = trajectoryImpact.rrVelocityPerHour || 0;
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;
      const isCopd = Boolean(patientProfile.isCopd || latestObservation.isCopd || patientProfile.spo2Scale === 2);

      if (rr !== undefined && (rr <= 8 || rr >= 35)) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Laju napas ekstrem (${rr} x/menit)`);
      } else if (!isCopd && spo2 !== undefined && spo2 <= 90) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Hipoksemia berat (SpO2 ${spo2}% pada udara bebas/nasal)`);
      } else if (isCopd && spo2 !== undefined && spo2 < 84) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Hipoksemia kritis PPOK (SpO2 ${spo2}% < 84%)`);
      } else if (rr !== undefined && rr >= 25) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Takipnea (${rr} x/menit)`);
      } else if (spo2 !== undefined && spo2 <= 93 && !isCopd) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Desaturasi ringan/sedang (SpO2 ${spo2}%)`);
      }

      if (rrVel >= 4.0) {
        trajectory = TRAJECTORY_STATES.RAPID_WORSENING;
        findings.push(`Akselerasi frekuensi napas (+${rrVel} napas/jam)`);
      } else if (rrVel >= 2.0) {
        trajectory = TRAJECTORY_STATES.MODERATE_WORSENING;
        findings.push(`Peningkatan usaha napas (+${rrVel} napas/jam)`);
      } else if (rrVel <= -2.0) {
        trajectory = TRAJECTORY_STATES.IMPROVING;
      }

      if (latestObservation.stridor || latestObservation.postExtubationStridor) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push('Stridor laring / ancaman sumbatan jalan napas');
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL || (severity === SEVERITY_STATES.SEVERE && trajectory !== TRAJECTORY_STATES.IMPROVING)) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.SEVERE || 
                (severity === SEVERITY_STATES.MODERATE && (trajectory === TRAJECTORY_STATES.RAPID_WORSENING || trajectory === TRAJECTORY_STATES.FULMINANT_CRISIS || trajectory === TRAJECTORY_STATES.MODERATE_WORSENING)) || 
                (severity === SEVERITY_STATES.MILD && trajectory === TRAJECTORY_STATES.RAPID_WORSENING) ||
                (trajectory === TRAJECTORY_STATES.RAPID_WORSENING || trajectory === TRAJECTORY_STATES.FULMINANT_CRISIS)) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MODERATE || severity === SEVERITY_STATES.MILD) {
        compositeRisk = OVERALL_RISK_STATES.MODERATE;
      }

      domainRisks.respiratory = {
        domainName: DOMAIN_NAMES.RESPIRATORY,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { rr, spo2, isCopd, rrVelocityPerHour: rrVel }
      };
    }

    // ─── C. Neurologic Domain ───
    {
      const gcs = latestObservation.gcs;
      const consciousness = latestObservation.consciousness;
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;

      if (gcs !== undefined && gcs <= 8) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Koma / GCS rendah (${gcs})`);
      } else if (gcs !== undefined && gcs <= 12) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Somnolen / GCS menurun (${gcs})`);
      } else if (consciousness && String(consciousness).toUpperCase() !== 'ALERT' && String(consciousness).toUpperCase() !== 'A') {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Penurunan respon kesadaran (${consciousness})`);
      }

      // Check Slow Drift in GCS
      if (Array.isArray(observations) && observations.length >= 2) {
        const withGcs = observations.filter(o => o.gcs !== undefined);
        if (withGcs.length >= 2) {
          const deltaGcs = withGcs[withGcs.length - 1].gcs - withGcs[0].gcs;
          if (deltaGcs <= -3) {
            trajectory = TRAJECTORY_STATES.RAPID_WORSENING;
            findings.push(`Penurunan GCS bermakna (${deltaGcs} poin dalam serial waktu)`);
          } else if (deltaGcs <= -2) {
            trajectory = TRAJECTORY_STATES.SLOW_DRIFT;
            findings.push(`Slow drift penurunan kesadaran (${deltaGcs} poin)`);
          }
        }
      }

      if (latestObservation.encephalopathy) {
        findings.push('Tanda ensefalopati / asteriksis positif');
        if (severity === SEVERITY_STATES.NORMAL) severity = SEVERITY_STATES.MODERATE;
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.MODERATE && trajectory !== TRAJECTORY_STATES.STABLE) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (trajectory === TRAJECTORY_STATES.SLOW_DRIFT || trajectory === TRAJECTORY_STATES.RAPID_WORSENING) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MODERATE) {
        compositeRisk = OVERALL_RISK_STATES.MODERATE;
      }

      domainRisks.neurologic = {
        domainName: DOMAIN_NAMES.NEUROLOGIC,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { gcs, consciousness }
      };
    }

    // ─── D. Renal & Metabolic Domain ───
    {
      const urineRate = latestObservation.urineRate !== undefined ? latestObservation.urineRate : (latestObservation.urineOutputMl !== undefined && latestObservation.patientWeightKg ? (latestObservation.urineOutputMl / (latestObservation.patientWeightKg * Math.max(1, latestObservation.urineDurationHours || 1))) : undefined);
      const creatinine = latestObservation.creatinine;
      const ph = latestObservation.ph;
      const glucose = latestObservation.bloodGlucose;
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;

      const isDialysisChronic = Boolean(patientProfile.isDialysis || latestObservation.isDialysis);

      if (ph !== undefined && ph < 7.20) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Asidosis metabolik berat (pH ${ph})`);
      } else if (glucose !== undefined && (glucose <= 54 || glucose >= 500)) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Krisis metabolik glukosa (${glucose} mg/dL)`);
      } else if (!isDialysisChronic && urineRate !== undefined && urineRate < 0.3) {
        severity = SEVERITY_STATES.SEVERE;
        findings.push(`Oliguria berat (< 0.3 ml/kg/jam, nilai: ${Number(urineRate).toFixed(2)})`);
      } else if (!isDialysisChronic && urineRate !== undefined && urineRate < 0.5) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Kriteria KDIGO AKI Urine Output (< 0.5 ml/kg/jam, nilai: ${Number(urineRate).toFixed(2)})`);
      } else if (!isDialysisChronic && creatinine !== undefined && creatinine >= 2.0) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Kreatinin serum meningkat (${creatinine} mg/dL)`);
      }

      if (isDialysisChronic && creatinine !== undefined && creatinine >= 5.0) {
        findings.push(`Kreatinin baseline dialisis kronis (${creatinine} mg/dL - Disesuaikan)`);
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.SEVERE || (severity === SEVERITY_STATES.MODERATE && !isDialysisChronic)) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MILD) {
        compositeRisk = OVERALL_RISK_STATES.MODERATE;
      }

      domainRisks.renalMetabolic = {
        domainName: DOMAIN_NAMES.RENAL_METABOLIC,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { urineRate, creatinine, ph, glucose, isDialysisChronic }
      };
    }

    // ─── E. Infection & Sepsis Domain ───
    {
      const temp = latestObservation.temp;
      const lactate = latestObservation.lactate;
      const lacVel = trajectoryImpact.lactateVelocityPerHour || 0;
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;

      if (lactate !== undefined && lactate >= 4.0) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push(`Asam laktat tinggi / Syok Septik (${lactate} mmol/L >= 4.0)`);
      } else if (lactate !== undefined && lactate >= 2.0) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Hiperlaktatemia (${lactate} mmol/L >= 2.0)`);
      } else if (temp !== undefined && (temp >= 38.5 || temp <= 35.5)) {
        severity = SEVERITY_STATES.MILD;
        findings.push(`Disregulasi termal (${temp}°C)`);
      }

      if (lacVel >= 0.5) {
        trajectory = TRAJECTORY_STATES.RAPID_WORSENING;
        findings.push(`Akselerasi penumpukan laktat (+${lacVel} mmol/L/jam)`);
      } else if (lacVel <= -0.5) {
        trajectory = TRAJECTORY_STATES.IMPROVING;
        findings.push(`Klirens laktat adekuat (${lacVel} mmol/L/jam)`);
      }

      // Check isolated fever without tachycardia or tachypnea
      const hr = latestObservation.hr || 80;
      const rr = latestObservation.rr || 16;
      if (temp !== undefined && temp >= 38.5 && hr < 90 && rr <= 20 && (lactate === undefined || lactate < 2.0)) {
        findings.push('Demam terisolasi tanpa tanda respons inflamasi sistemik (SIRS)');
        severity = SEVERITY_STATES.MILD;
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL || (severity === SEVERITY_STATES.SEVERE && trajectory !== TRAJECTORY_STATES.IMPROVING)) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.MODERATE || (severity === SEVERITY_STATES.MILD && trajectory === TRAJECTORY_STATES.RAPID_WORSENING)) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MILD) {
        compositeRisk = OVERALL_RISK_STATES.LOW;
      }

      domainRisks.infectionSepsis = {
        domainName: DOMAIN_NAMES.INFECTION_SEPSIS,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { temp, lactate, lactateVelocityPerHour: lacVel }
      };
    }

    // ─── F. Medication Exposure Domain ───
    {
      const findings = [];
      let severity = SEVERITY_STATES.NORMAL;
      let trajectory = TRAJECTORY_STATES.STABLE;

      if (latestObservation.activeAdverseEvent === 'ANAPHYLAXIS' || latestObservation.isAnaphylaxis) {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push('Syok anafilaksis pasca pemberian medikasi');
      } else if (latestObservation.activeAdverseEvent === 'OPIOID_OVERSEDATION') {
        severity = SEVERITY_STATES.CRITICAL;
        findings.push('Depresi napas terinduksi opioid (ADE OIRD)');
      } else if (latestObservation.multiInotropesActive || (latestObservation.norepinephrineActive && latestObservation.dobutamineActive)) {
        severity = SEVERITY_STATES.SEVERE;
        findings.push('Paparan multipel infus inotropik/vasopresor dosis tinggi');
      } else if (latestObservation.highAlertMedicationActive) {
        severity = SEVERITY_STATES.MODERATE;
        findings.push(`Paparan medikasi kewaspadaan tinggi (High-Alert): ${latestObservation.highAlertCategory || 'Active'}`);
      }

      let compositeRisk = OVERALL_RISK_STATES.LOW;
      if (severity === SEVERITY_STATES.CRITICAL) {
        compositeRisk = OVERALL_RISK_STATES.CRITICAL;
      } else if (severity === SEVERITY_STATES.SEVERE) {
        compositeRisk = OVERALL_RISK_STATES.HIGH;
      } else if (severity === SEVERITY_STATES.MODERATE) {
        compositeRisk = OVERALL_RISK_STATES.MODERATE;
      }

      domainRisks.medicationExposure = {
        domainName: DOMAIN_NAMES.MEDICATION_EXPOSURE,
        severity,
        trajectory,
        compositeDomainRisk: compositeRisk,
        primaryFindings: findings,
        contributingParameters: { activeAdverseEvent: latestObservation.activeAdverseEvent }
      };
    }

    return domainRisks;
  }

  /**
   * 5. Sintesis Risiko Menyeluruh (Master Deterministic Synthesis)
   */
  synthesizeOverallRisk(severityResult = {}, trajectoryImpact = {}, domainRisks = {}, evidenceQualityResult = {}, patientProfile = {}) {
    const { severityState, panicTriggers = [] } = severityResult;
    const { trajectoryState, velocityScorePerHour = 0 } = trajectoryImpact;

    // Hitung jumlah domain yang terlibat
    const domains = Object.values(domainRisks);
    const modOrAboveCount = domains.filter(d => d.compositeDomainRisk === OVERALL_RISK_STATES.MODERATE || d.compositeDomainRisk === OVERALL_RISK_STATES.HIGH || d.compositeDomainRisk === OVERALL_RISK_STATES.CRITICAL).length;
    const highOrCritCount = domains.filter(d => d.compositeDomainRisk === OVERALL_RISK_STATES.HIGH || d.compositeDomainRisk === OVERALL_RISK_STATES.CRITICAL).length;
    const hasCritDomain = domains.some(d => d.compositeDomainRisk === OVERALL_RISK_STATES.CRITICAL);

    let overallRiskState = OVERALL_RISK_STATES.LOW;
    let crossDomainSynergyAlert = false;

    // ─── A. Master Deterministic Matrix ───
    if (severityState === SEVERITY_STATES.CRITICAL || hasCritDomain || panicTriggers.length > 0) {
      overallRiskState = OVERALL_RISK_STATES.CRITICAL;
    } else if (severityState === SEVERITY_STATES.SEVERE) {
      overallRiskState = (trajectoryState === TRAJECTORY_STATES.IMPROVING) ? OVERALL_RISK_STATES.MODERATE : OVERALL_RISK_STATES.HIGH;
    } else if (severityState === SEVERITY_STATES.MODERATE) {
      if (trajectoryState === TRAJECTORY_STATES.RAPID_WORSENING || trajectoryState === TRAJECTORY_STATES.FULMINANT_CRISIS || (highOrCritCount >= 1 && trajectoryState !== TRAJECTORY_STATES.STABLE)) {
        overallRiskState = OVERALL_RISK_STATES.HIGH;
      } else {
        overallRiskState = OVERALL_RISK_STATES.MODERATE;
      }
    } else if (severityState === SEVERITY_STATES.MILD || severityState === SEVERITY_STATES.NORMAL) {
      if (highOrCritCount >= 1) {
        overallRiskState = OVERALL_RISK_STATES.HIGH;
      } else if (trajectoryState === TRAJECTORY_STATES.RAPID_WORSENING || trajectoryState === TRAJECTORY_STATES.FULMINANT_CRISIS || velocityScorePerHour >= 1.5) {
        overallRiskState = OVERALL_RISK_STATES.HIGH;
      } else if (trajectoryState === TRAJECTORY_STATES.MODERATE_WORSENING || modOrAboveCount >= 2) {
        overallRiskState = OVERALL_RISK_STATES.MODERATE;
      } else {
        overallRiskState = OVERALL_RISK_STATES.LOW;
      }
    }

    // ─── B. Multi-Domain Synergy (Compounding & MODS) ───
    if (modOrAboveCount >= 3) {
      // Incipient MODS
      overallRiskState = OVERALL_RISK_STATES.CRITICAL;
      crossDomainSynergyAlert = true;
    } else if (modOrAboveCount >= 2 && (trajectoryState === TRAJECTORY_STATES.WORSENING || trajectoryState === TRAJECTORY_STATES.MODERATE_WORSENING || trajectoryState === TRAJECTORY_STATES.RAPID_WORSENING)) {
      if (overallRiskState === OVERALL_RISK_STATES.LOW || overallRiskState === OVERALL_RISK_STATES.MODERATE) {
        overallRiskState = OVERALL_RISK_STATES.HIGH;
      }
      crossDomainSynergyAlert = true;
    }

    // ─── C. Palliative / DNR Boundary Override ───
    const isPalliativeOrDnr = Boolean(patientProfile.isPalliative || patientProfile.isDnr || patientProfile.isDni);
    if (isPalliativeOrDnr && (overallRiskState === OVERALL_RISK_STATES.CRITICAL || overallRiskState === OVERALL_RISK_STATES.HIGH)) {
      overallRiskState = OVERALL_RISK_STATES.MODERATE;
    }

    // ─── D. Escalation Priority, SLA & Reviewer Role Mapping ───
    let escalationPriority = ESCALATION_PRIORITIES.ROUTINE_MONITORING;
    let maxResponseTimeMinutes = 240;
    let recommendedReviewerRole = CLINICAL_ROLES.WARD_NURSE;
    const suggestedActionProtocols = [];

    if (isPalliativeOrDnr) {
      escalationPriority = ESCALATION_PRIORITIES.SCHEDULED_ROUND;
      maxResponseTimeMinutes = 60;
      recommendedReviewerRole = CLINICAL_ROLES.DPJP_SPECIALIST;
      suggestedActionProtocols.push('PALLIATIVE_COMFORT_PATHWAY', 'SYMPTOM_MANAGEMENT_REVIEW');
    } else if (overallRiskState === OVERALL_RISK_STATES.CRITICAL) {
      escalationPriority = ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE;
      maxResponseTimeMinutes = 5;
      recommendedReviewerRole = CLINICAL_ROLES.MET_ICU_TEAM;
      suggestedActionProtocols.push('ACTIVATE_MET_TEAM', 'PREPARE_CRASH_CART_AIRWAY', 'NOTIFY_ICU_BED_COORDINATOR');
    } else if (overallRiskState === OVERALL_RISK_STATES.HIGH) {
      escalationPriority = ESCALATION_PRIORITIES.URGENT_REVIEW;
      maxResponseTimeMinutes = 15;
      recommendedReviewerRole = CLINICAL_ROLES.DPJP_SPECIALIST;
      suggestedActionProtocols.push('BEDSIDE_DPJP_ASSESSMENT_15M', 'RECHECK_VITALS_30M', 'EVALUATE_ABG_AND_FLUIDS');
    } else if (overallRiskState === OVERALL_RISK_STATES.MODERATE) {
      escalationPriority = ESCALATION_PRIORITIES.PROMPT_REVIEW;
      maxResponseTimeMinutes = 60;
      recommendedReviewerRole = CLINICAL_ROLES.RESIDENT_DOCTOR;
      suggestedActionProtocols.push('DOCTOR_EVALUATION_60M', 'TITRATE_THERAPY_AS_INDICATED');
    } else {
      if (trajectoryState === TRAJECTORY_STATES.SLOW_DRIFT) {
        escalationPriority = ESCALATION_PRIORITIES.SCHEDULED_ROUND;
        maxResponseTimeMinutes = 120;
        recommendedReviewerRole = CLINICAL_ROLES.CHARGE_NURSE;
        suggestedActionProtocols.push('HOURLY_ROUNDS_MONITORING');
      } else {
        escalationPriority = ESCALATION_PRIORITIES.ROUTINE_MONITORING;
        maxResponseTimeMinutes = 240;
        recommendedReviewerRole = CLINICAL_ROLES.WARD_NURSE;
        suggestedActionProtocols.push('ROUTINE_WARD_OBSERVATION_4H');
      }
    }

    return {
      overallRiskState,
      domainsInvolvedCount: modOrAboveCount,
      highRiskDomainsCount: highOrCritCount,
      crossDomainSynergyAlert,
      escalationPriority,
      maxResponseTimeMinutes,
      recommendedReviewerRole,
      suggestedActionProtocols,
      isPalliativeOrDnr
    };
  }

  /**
   * 6. Pembuat Penjelasan Terurai (Explainability Builder)
   */
  generateExplainability(synthesis = {}, domainRisks = {}, severityResult = {}, trajectoryImpact = {}) {
    const { overallRiskState, escalationPriority, crossDomainSynergyAlert } = synthesis;
    const { panicTriggers = [], news2Score = 0 } = severityResult;
    const { trajectoryState, velocityScorePerHour = 0 } = trajectoryImpact;

    const contributingDomains = Object.values(domainRisks).filter(d => d.compositeDomainRisk !== OVERALL_RISK_STATES.LOW);
    const sortedDomains = [...contributingDomains].sort((a, b) => {
      const scoreMap = { [OVERALL_RISK_STATES.CRITICAL]: 4, [OVERALL_RISK_STATES.HIGH]: 3, [OVERALL_RISK_STATES.MODERATE]: 2, [OVERALL_RISK_STATES.LOW]: 1 };
      return scoreMap[b.compositeDomainRisk] - scoreMap[a.compositeDomainRisk];
    });

    const primaryDriver = sortedDomains[0] 
      ? `Domain ${sortedDomains[0].domainName}: ${sortedDomains[0].primaryFindings.join('; ') || 'Parameter abnormal'}`
      : (panicTriggers[0] || `NEWS2 ${news2Score} State`);

    const secondaryDriver = sortedDomains[1]
      ? `Domain ${sortedDomains[1].domainName}: ${sortedDomains[1].primaryFindings.join('; ')}`
      : undefined;

    const compoundingFactors = [];
    if (crossDomainSynergyAlert) {
      compoundingFactors.push(`Sinergi ${sortedDomains.length} domain organ mengindikasikan risiko disfungsi multiorgan progresif (Incipient MODS).`);
    }
    if (trajectoryState === TRAJECTORY_STATES.RAPID_WORSENING || trajectoryState === TRAJECTORY_STATES.FULMINANT_CRISIS) {
      compoundingFactors.push(`Laju perubahan dinamis sangat cepat (+${velocityScorePerHour} skor/jam) membutuhkan intervensi mendahului krisis absolut.`);
    }

    const clinicalNarrative = `Tingkat risiko klinis ditetapkan sebagai ${overallRiskState} (${escalationPriority}) berdasarkan evaluasi snapshot keparahan (NEWS2 = ${news2Score}) dan trajektori fisiologis (${trajectoryState}).`;

    return {
      primaryDriver,
      secondaryDriver,
      compoundingFactors,
      trajectoryInfluence: `Vektor Trajektori: ${trajectoryState} (Velocity: ${velocityScorePerHour}/jam)`,
      clinicalNarrative,
      actionableRecommendations: synthesis.suggestedActionProtocols || []
    };
  }

  /**
   * 7. Full Orchestration Method: Stratifikasi Risiko Pasien
   */
  stratifyPatientRisk(patientContext = {}, trajectoryVector = null, observations = [], options = {}) {
    const latestObservation = (Array.isArray(observations) && observations.length > 0)
      ? observations[observations.length - 1]
      : (patientContext.latestObservation || {});

    // Step 1: Evaluate Severity
    const severityResult = this.evaluateSeverity(latestObservation, patientContext);

    // Step 2: Evaluate Trajectory
    const trajectoryImpact = this.evaluateTrajectoryImpact(trajectoryVector, observations);

    // Step 3: Evidence Quality Gate
    const evidenceQualityResult = this.evaluateEvidenceQuality(latestObservation, observations);

    // Step 4: Decompose 6 Domains
    const domainRisks = this.decomposeDomainRisks(patientContext, latestObservation, trajectoryImpact, observations);

    // Step 5: Master Synthesis
    const synthesis = this.synthesizeOverallRisk(severityResult, trajectoryImpact, domainRisks, evidenceQualityResult, patientContext);

    // Step 6: Explainability
    const explainability = this.generateExplainability(synthesis, domainRisks, severityResult, trajectoryImpact);

    // Step 7: Cryptographic WORM Hash Signature
    const evaluatedAt = new Date().toISOString();
    const hashPayload = JSON.stringify({
      patientId: patientContext.patientId || 'UNKNOWN_PATIENT',
      encounterId: patientContext.encounterId || 'UNKNOWN_ENCOUNTER',
      evaluatedAt,
      severityState: severityResult.severityState,
      trajectoryState: trajectoryImpact.trajectoryState,
      overallRiskState: synthesis.overallRiskState,
      domainKeys: Object.keys(domainRisks)
    });
    const tamperProofHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const riskState = {
      patientId: patientContext.patientId || 'UNKNOWN_PATIENT',
      encounterId: patientContext.encounterId || 'UNKNOWN_ENCOUNTER',
      evaluatedAt,
      engineVersion: '4B.7-RISK-STRATIFIER-v1.0',
      ruleRevisionHash: '4B7-SPEC-SHA256-BASELINE',

      // Core Triad
      severityState: severityResult.severityState,
      trajectoryState: trajectoryImpact.trajectoryState,
      overallRiskState: synthesis.overallRiskState,

      // Multi-Domain Risk Decomposition
      domainRisks,
      domainsInvolvedCount: synthesis.domainsInvolvedCount,
      highRiskDomainsCount: synthesis.highRiskDomainsCount,
      crossDomainSynergyAlert: synthesis.crossDomainSynergyAlert,

      // Escalation Priority & Response Guidelines
      escalationPriority: synthesis.escalationPriority,
      maxResponseTimeMinutes: synthesis.maxResponseTimeMinutes,
      recommendedReviewerRole: synthesis.recommendedReviewerRole,
      suggestedActionProtocols: synthesis.suggestedActionProtocols,

      // Evidence Quality & Explainability
      evidenceQuality: evidenceQualityResult.evidenceQuality,
      evidenceDeficitReason: evidenceQualityResult.dataDeficitWarning,
      isExplainable: true,
      explainability,

      // Governance State
      governanceStatus: 'SYSTEM_EVALUATED',
      tamperProofHash
    };

    // Record Event Sourcing in Persistence Adapter
    try {
      persistenceAdapter.recordEvent(RISK_STRATIFICATION_EVENTS_COLLECTION, {
        patientId: riskState.patientId,
        encounterId: riskState.encounterId,
        riskState,
        timestamp: evaluatedAt,
        tamperProofHash
      });
    } catch (e) {
      // Memory fallback in unit test environments
      this.auditLedger.push({ ...riskState, savedAt: evaluatedAt });
    }

    return riskState;
  }

  /**
   * 8. Human-in-the-Loop Override Evaluator
   */
  evaluateClinicianOverride(currentRiskState = {}, overridePayload = {}, clinicianIdentity = {}) {
    if (!currentRiskState || !overridePayload) {
      throw new Error('Current risk state and override payload are required for clinical override.');
    }

    const { overrideDirection, targetRiskState, justificationCategory, justificationNotes } = overridePayload;
    const { clinicianId, clinicianName, clinicianRole, credentials } = clinicianIdentity;

    if (!overrideDirection || !['UPGRADE', 'DOWNGRADE'].includes(overrideDirection)) {
      throw new Error('Override direction must be UPGRADE or DOWNGRADE.');
    }

    if (!justificationNotes || justificationNotes.trim().length < 10) {
      throw new Error('Detailed clinical justification (minimum 10 characters) is required for audit trail.');
    }

    if (!justificationCategory) {
      throw new Error('Justification category must be specified (e.g. CHRONIC_BASELINE, PALLIATIVE_GOALS, CLINICAL_CONCERN).');
    }

    const targetRisk = targetRiskState || (overrideDirection === 'UPGRADE' ? OVERALL_RISK_STATES.HIGH : OVERALL_RISK_STATES.LOW);
    let targetEscalation = ESCALATION_PRIORITIES.ROUTINE_MONITORING;
    let targetSla = 240;
    let targetRole = CLINICAL_ROLES.WARD_NURSE;

    if (targetRisk === OVERALL_RISK_STATES.CRITICAL) {
      targetEscalation = ESCALATION_PRIORITIES.IMMEDIATE_EMERGENCY_RESPONSE;
      targetSla = 5;
      targetRole = CLINICAL_ROLES.MET_ICU_TEAM;
    } else if (targetRisk === OVERALL_RISK_STATES.HIGH) {
      targetEscalation = ESCALATION_PRIORITIES.URGENT_REVIEW;
      targetSla = 15;
      targetRole = CLINICAL_ROLES.DPJP_SPECIALIST;
    } else if (targetRisk === OVERALL_RISK_STATES.MODERATE) {
      targetEscalation = ESCALATION_PRIORITIES.PROMPT_REVIEW;
      targetSla = 60;
      targetRole = CLINICAL_ROLES.RESIDENT_DOCTOR;
    }

    const overrideTimestamp = new Date().toISOString();
    const overrideHashPayload = JSON.stringify({
      originalHash: currentRiskState.tamperProofHash,
      clinicianId: clinicianId || 'ANON_CLINICIAN',
      overrideDirection,
      targetRisk,
      justificationCategory,
      overrideTimestamp
    });
    const overrideHash = crypto.createHash('sha256').update(overrideHashPayload).digest('hex');

    const updatedState = {
      ...currentRiskState,
      overallRiskState: targetRisk,
      escalationPriority: targetEscalation,
      maxResponseTimeMinutes: targetSla,
      recommendedReviewerRole: targetRole,
      governanceStatus: 'CLINICIAN_OVERRIDDEN',
      overrideDetails: {
        overriddenBy: clinicianName || clinicianId || 'Clinician',
        clinicianRole: clinicianRole || 'DPJP',
        overrideTimestamp,
        overrideDirection,
        justificationCategory,
        justificationNotes: justificationNotes.trim(),
        overrideHash
      },
      tamperProofHash: overrideHash
    };

    try {
      persistenceAdapter.recordEvent(RISK_OVERRIDE_AUDIT_COLLECTION, {
        patientId: updatedState.patientId,
        encounterId: updatedState.encounterId,
        overrideDetails: updatedState.overrideDetails,
        originalRiskState: currentRiskState.overallRiskState,
        overriddenRiskState: targetRisk,
        timestamp: overrideTimestamp,
        overrideHash
      });
    } catch (e) {
      this.auditLedger.push(updatedState);
    }

    return updatedState;
  }

  /**
   * 9. Deterministic Batch Stratification (High-Performance Zero Context Leakage)
   */
  batchStratify(patientsData = []) {
    if (!Array.isArray(patientsData)) return [];
    return patientsData.map(p => this.stratifyPatientRisk(p.context, p.trajectory, p.observations, p.options));
  }
}

export const clinicalRiskStratifier = new ClinicalRiskStratifier();
