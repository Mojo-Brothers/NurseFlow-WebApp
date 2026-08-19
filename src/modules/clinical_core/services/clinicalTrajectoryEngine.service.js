/**
 * NurseFlow Enterprise HIS 2026 — Longitudinal Patient Trajectory Engine
 * 
 * Core Philosophy:
 * "Trajectory Engine observes. Governance Engine governs. Clinician decides."
 * 
 * Standards & Guidelines:
 * 1. Royal College of Physicians (RCP) NEWS2 Temporal Trends
 * 2. KDIGO AKI Urine Output & Creatinine Velocity Dynamics
 * 3. Surviving Sepsis Campaign (SSC) 2021 Lactate & Hemodynamic Clearance
 * 4. ISO 27799 / WORM Audit Trail Event Sourcing
 * 
 * Architectural Invariants:
 * - Direction + Velocity + Persistence + Evidence Quality = Deterministic Trajectory Signal
 * - Observation ➔ Pattern ➔ Risk Signal ➔ Clinical Recommendation (NO autonomous diagnosis)
 * - Mathematical Extrapolation ONLY (NO unvalidated clinical mortality predictions)
 */

import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { clinicalSafetyGovernanceEngine } from './clinicalSafetyGovernanceEngine.service.js';
import { clinicalDeteriorationEngine } from './clinicalDeteriorationEngine.service.js';

const TRAJECTORY_EVENTS_COLLECTION = 'clinical_trajectory_events';
const TRAJECTORY_SNAPSHOTS_COLLECTION = 'clinical_trajectory_snapshots';

export const TRAJECTORY_DIRECTIONS = {
  IMPROVING: 'IMPROVING',
  STABLE: 'STABLE',
  WORSENING: 'WORSENING'
};

export const TRAJECTORY_MOMENTUM = {
  STABLE: 'STABLE',
  SLOW_DRIFT: 'SLOW_DRIFT',
  MODERATE: 'MODERATE',
  RAPID: 'RAPID',
  FULMINANT: 'FULMINANT'
};

export const ESCALATION_RISK_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  ELEVATED: 'ELEVATED',
  CRITICAL: 'CRITICAL'
};

export const DATA_QUALITY_FLAGS = {
  VALID: 'VALID',
  SUSPECT_ARTEFACT: 'SUSPECT_ARTEFACT',
  POOR_SIGNAL: 'POOR_SIGNAL',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  PROBE_DISCONNECTED: 'PROBE_DISCONNECTED'
};

export const TRAJECTORY_RULES = {
  TRAJECTORY_PERSISTENT_WORSENING: {
    ruleId: 'RULE-TRAJ-WORSEN-V1',
    ruleName: 'Persistent Multi-Observation Deterioration Trajectory',
    ruleVersion: '1.0.0',
    description: 'NEWS2 velocity >= +1.0/h across >= 3 consecutive valid observations'
  },
  TRAJECTORY_HEMODYNAMIC_DECOMPENSATION: {
    ruleId: 'RULE-TRAJ-HEMO-V1',
    ruleName: 'Hemodynamic Deterioration Pattern',
    ruleVersion: '1.0.0',
    description: 'MAP negative velocity <= -4.0 mmHg/h with compensatory tachycardia'
  },
  TRAJECTORY_RESPIRATORY_FAILURE: {
    ruleId: 'RULE-TRAJ-RESP-V1',
    ruleName: 'Respiratory Deterioration Pattern',
    ruleVersion: '1.0.0',
    description: 'RR positive velocity >= +2.5 breaths/h and SpO2 downward slope'
  },
  TRAJECTORY_OLIGURIA_AKI: {
    ruleId: 'RULE-TRAJ-RENAL-V1',
    ruleName: 'Oliguria / Renal Risk Pattern',
    ruleVersion: '1.0.0',
    description: 'Urine output rate < 0.5 ml/kg/h across >= 2 consecutive hours'
  },
  TRAJECTORY_RECOVERY_DEESCALATION: {
    ruleId: 'RULE-TRAJ-RECOVERY-V1',
    ruleName: 'Persistent Clinical Recovery Trajectory',
    ruleVersion: '1.0.0',
    description: 'NEWS2 velocity <= -1.0/h reaching score <= 4 across >= 2 observations'
  }
};

export class ClinicalTrajectoryEngine {
  constructor() {
    this.processedSnapshotIds = new Set();
  }

  /**
   * 1. Data Quality Gate & Temporal Normalization
   * Cleans, deduplicates, sorts, and filters spurious artefacts/poor signals
   */
  normalizeTemporalObservations(rawObservations = []) {
    if (!Array.isArray(rawObservations) || rawObservations.length === 0) {
      return [];
    }

    // A. Filter invalid/corrupted records & poor signal flags
    const validObs = rawObservations.filter(obs => {
      if (!obs || !obs.timestamp) return false;
      const t = new Date(obs.timestamp).getTime();
      if (isNaN(t)) return false;

      // Filter poor signal or probe disconnected artefacts
      if (obs.quality === DATA_QUALITY_FLAGS.POOR_SIGNAL || 
          obs.quality === DATA_QUALITY_FLAGS.PROBE_DISCONNECTED ||
          obs.quality === DATA_QUALITY_FLAGS.SUSPECT_ARTEFACT) {
        return false;
      }
      return true;
    });

    // B. Sort chronological (oldest to newest)
    validObs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // C. Deduplicate observations with identical or near-simultaneous timestamps (< 30 seconds)
    const normalized = [];
    for (let i = 0; i < validObs.length; i++) {
      const current = validObs[i];
      const prev = normalized[normalized.length - 1];

      if (!prev) {
        normalized.push(current);
      } else {
        const timeDiffSeconds = Math.abs(
          (new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000
        );

        if (timeDiffSeconds >= 30) {
          normalized.push(current);
        } else {
          // If duplicate within 30s, prefer the more complete / recent measurement
          normalized[normalized.length - 1] = { ...prev, ...current };
        }
      }
    }

    return normalized;
  }

  /**
   * 2. Compute Finite-Difference Slope / Velocity Between Points
   * ΔValue / ΔTime (in hours)
   */
  calculateSlope(y1, y2, t1Iso, t2Iso) {
    if (y1 === undefined || y1 === null || y2 === undefined || y2 === null) return 0;
    const t1 = new Date(t1Iso).getTime();
    const t2 = new Date(t2Iso).getTime();
    const deltaHours = (t2 - t1) / (1000 * 60 * 60);

    if (deltaHours <= 0.001) return 0; // Avoid division by zero
    const deltaY = Number(y2) - Number(y1);
    return Number((deltaY / deltaHours).toFixed(2));
  }

  /**
   * 3. Evaluate Multi-Domain Longitudinal Clinical State Vector
   */
  evaluatePatientTrajectory({
    patientId,
    encounterId,
    patientName,
    mrn,
    patientWeightKg = 70,
    observations = [],
    labObservations = [],
    medicationAdministrations = [],
    evaluationTimeIso = new Date().toISOString()
  }) {
    // Step 1: Normalize & Filter via Data Quality Gate
    const normVitals = this.normalizeTemporalObservations(observations);

    if (normVitals.length === 0) {
      return {
        patientId,
        encounterId,
        evaluatedAt: evaluationTimeIso,
        observationCount: 0,
        overallTrajectory: TRAJECTORY_DIRECTIONS.STABLE,
        trajectoryVelocity: TRAJECTORY_MOMENTUM.STABLE,
        persistenceCount: 0,
        evidenceQuality: 'NO_DATA',
        escalationRisk: ESCALATION_RISK_LEVELS.LOW,
        clinicalPatternSignal: 'INSUFFICIENT_DATA_FOR_TRAJECTORY',
        mathematicalExtrapolation: null,
        systems: {},
        isExplainable: true
      };
    }

    // Ensure NEWS2 is calculated for all valid points
    const enrichedVitals = normVitals.map(v => {
      const newsRes = clinicalDeteriorationEngine.calculateNEWS2(v);
      return {
        ...v,
        news2Score: newsRes.totalScore,
        map: newsRes.map,
        subScores: newsRes.subScores
      };
    });

    const latest = enrichedVitals[enrichedVitals.length - 1];
    const earliest = enrichedVitals[0];
    const count = enrichedVitals.length;

    // Step 2: Longitudinal Calculus across Baseline -> Current
    const news2Slope = this.calculateSlope(earliest.news2Score, latest.news2Score, earliest.timestamp, latest.timestamp);
    const mapSlope = this.calculateSlope(earliest.map, latest.map, earliest.timestamp, latest.timestamp);
    const hrSlope = this.calculateSlope(earliest.heartRate ?? earliest.hr, latest.heartRate ?? latest.hr, earliest.timestamp, latest.timestamp);
    const rrSlope = this.calculateSlope(earliest.respiratoryRate ?? earliest.rr, latest.respiratoryRate ?? latest.rr, earliest.timestamp, latest.timestamp);
    const spo2Slope = this.calculateSlope(earliest.spo2, latest.spo2, earliest.timestamp, latest.timestamp);

    // Step 3: Persistence Counter (Consecutive observations in same direction)
    let persistentWorseningCount = 0;
    let persistentImprovingCount = 0;

    for (let i = 1; i < enrichedVitals.length; i++) {
      const prev = enrichedVitals[i - 1];
      const curr = enrichedVitals[i];
      if (curr.news2Score > prev.news2Score) {
        persistentWorseningCount++;
        persistentImprovingCount = 0;
      } else if (curr.news2Score < prev.news2Score) {
        persistentImprovingCount++;
        persistentWorseningCount = 0;
      }
    }

    // Step 4: Multi-Domain Clinical State Vector Analysis
    // 4A. Hemodynamic System
    let hemoStatus = 'STABLE';
    let hemoEvidence = `MAP: ${latest.map} mmHg (Slope: ${mapSlope} mmHg/h), HR: ${latest.heartRate ?? latest.hr ?? 75} bpm (Slope: ${hrSlope} bpm/h)`;
    if (mapSlope <= -4.0 && hrSlope >= 5.0) {
      hemoStatus = 'DECOMPENSATING';
      hemoEvidence += ' | Hemodynamic deterioration pattern with compensatory tachycardia';
    } else if (latest.map < 65) {
      hemoStatus = 'UNSTABLE';
      hemoEvidence += ' | Hypotension threshold breached (MAP < 65)';
    } else if (mapSlope <= -2.5) {
      hemoStatus = 'COMPENSATING';
    }

    // 4B. Respiratory System
    let respStatus = 'STABLE';
    let respEvidence = `RR: ${latest.respiratoryRate ?? latest.rr ?? 16} x/m (Slope: ${rrSlope}/h), SpO2: ${latest.spo2 ?? 98}% (Slope: ${spo2Slope}%/h)`;
    if (rrSlope >= 2.5 && (spo2Slope <= -1.5 || latest.onOxygen)) {
      respStatus = 'DETERIORATING';
      respEvidence += ' | Respiratory compromise slope detected with increasing effort';
    } else if ((latest.spo2 && latest.spo2 <= 90) || (latest.respiratoryRate && latest.respiratoryRate >= 30)) {
      respStatus = 'FAILURE';
    } else if (rrSlope >= 1.5) {
      respStatus = 'INCREASING_EFFORT';
    }

    // 4C. Neurologic System
    let neuroStatus = 'STABLE';
    const gcsLatest = Number(latest.gcs ?? 15);
    const gcsEarliest = Number(earliest.gcs ?? 15);
    const gcsDelta = gcsLatest - gcsEarliest;
    let neuroEvidence = `GCS: ${gcsLatest} (Δ: ${gcsDelta}), ACVPU: ${latest.consciousness || 'ALERT'}`;
    if (gcsDelta <= -2 || (latest.consciousness && latest.consciousness !== 'ALERT' && earliest.consciousness === 'ALERT')) {
      neuroStatus = 'DETERIORATING';
      neuroEvidence += ' | Acute neurological status degradation';
    }

    // 4D. Metabolic / Renal System (KDIGO Urine Rate & Lactate Slope)
    let renalStatus = 'STABLE';
    let urineRateMlKgH = 1.0;
    let renalEvidence = 'Urine output and renal dynamics within expected ranges';

    // Ingest latest urine measurement if present
    const urineObs = normVitals.filter(v => v.urineOutputMl !== undefined || v.urineRate !== undefined);
    if (urineObs.length >= 2) {
      const lastUrine = urineObs[urineObs.length - 1];
      const prevUrine = urineObs[urineObs.length - 2];
      const deltaH = Math.max(0.5, (new Date(lastUrine.timestamp).getTime() - new Date(prevUrine.timestamp).getTime()) / 3600000);
      const totalMl = Number(lastUrine.urineOutputMl || 0);
      urineRateMlKgH = Number((totalMl / (patientWeightKg * deltaH)).toFixed(2));

      if (urineRateMlKgH < 0.5) {
        renalStatus = 'ACUTE_INJURY';
        renalEvidence = `KDIGO Oliguria Pattern: ${urineRateMlKgH} ml/kg/h (< 0.5 ml/kg/h) over ${deltaH.toFixed(1)}h`;
      } else if (urineRateMlKgH < 0.7) {
        renalStatus = 'AT_RISK';
        renalEvidence = `Borderline low urine output: ${urineRateMlKgH} ml/kg/h`;
      }
    }

    // 4E. Sepsis / Infection Trajectory
    let infectionStatus = 'LOW_RISK';
    let lactateSlope = 0;
    let infectionEvidence = 'No active septic trajectory detected';
    if (labObservations.length >= 2) {
      const sortedLabs = [...labObservations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const firstLab = sortedLabs[0];
      const lastLab = sortedLabs[sortedLabs.length - 1];
      if (firstLab.lactate !== undefined && lastLab.lactate !== undefined) {
        lactateSlope = this.calculateSlope(firstLab.lactate, lastLab.lactate, firstLab.timestamp, lastLab.timestamp);
        if (lactateSlope >= 0.4 && lastLab.lactate >= 2.0) {
          infectionStatus = 'HIGH_RISK_SEPTIC';
          infectionEvidence = `Lactate accelerating: ${lastLab.lactate} mmol/L (Slope: +${lactateSlope} mmol/L/h)`;
        }
      }
    }

    // Step 5: Trajectory Direction, Momentum, and Risk Determination
    let direction = TRAJECTORY_DIRECTIONS.STABLE;
    let momentum = TRAJECTORY_MOMENTUM.STABLE;
    let escalationRisk = ESCALATION_RISK_LEVELS.LOW;
    let patternSignal = 'STABLE_HOMEOSTASIS';

    if (news2Slope >= 1.5 || (news2Slope >= 1.0 && persistentWorseningCount >= 2)) {
      direction = TRAJECTORY_DIRECTIONS.WORSENING;
      momentum = news2Slope >= 2.5 ? TRAJECTORY_MOMENTUM.FULMINANT : TRAJECTORY_MOMENTUM.RAPID;
      escalationRisk = ESCALATION_RISK_LEVELS.ELEVATED;
      patternSignal = persistentWorseningCount >= 3 ? 'RAPID_PERSISTENT_DETERIORATION' : 'RAPID_DETERIORATION_PATTERN';
    } else if (news2Slope >= 0.5) {
      direction = TRAJECTORY_DIRECTIONS.WORSENING;
      momentum = TRAJECTORY_MOMENTUM.MODERATE;
      escalationRisk = ESCALATION_RISK_LEVELS.MODERATE;
      patternSignal = 'MODERATE_WORSENING_PATTERN';
    } else if (news2Slope <= -1.0) {
      direction = TRAJECTORY_DIRECTIONS.IMPROVING;
      momentum = TRAJECTORY_MOMENTUM.RAPID;
      escalationRisk = ESCALATION_RISK_LEVELS.LOW;
      patternSignal = 'PERSISTENT_IMPROVEMENT_TRAJECTORY';
    } else if (news2Slope < 0) {
      direction = TRAJECTORY_DIRECTIONS.IMPROVING;
      momentum = TRAJECTORY_MOMENTUM.SLOW_DRIFT;
      escalationRisk = ESCALATION_RISK_LEVELS.LOW;
      patternSignal = 'RECOVERY_TRAJECTORY';
    }

    // Step 6: Mathematical Extrapolation Guardrail (NOT Clinical Prediction)
    let mathematicalExtrapolation = null;
    if (direction === TRAJECTORY_DIRECTIONS.WORSENING && news2Slope > 0) {
      const currentScore = latest.news2Score;
      const gapToCritical7 = Math.max(0, 7 - currentScore);
      const hoursToCriticalCrossing = news2Slope > 0 ? Number((gapToCritical7 / news2Slope).toFixed(1)) : null;

      mathematicalExtrapolation = {
        observedVelocity: `+${news2Slope} NEWS2/hour`,
        currentEscalationRisk: escalationRisk,
        thresholdProximity: currentScore >= 7 ? 'CRITICAL_BREACHED' : 'APPROACHING_CRITICAL',
        projectedThresholdCrossing: hoursToCriticalCrossing !== null ? `${hoursToCriticalCrossing} hours` : 'N/A',
        projectionType: 'MATHEMATICAL_EXTRAPOLATION_ONLY',
        clinicalPrediction: 'NOT_ESTABLISHED (Physician Judgment Required)'
      };
    }

    const trajectorySnapshot = {
      id: `TRAJ-SNP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      encounterId,
      patientId,
      patientName,
      mrn,
      evaluatedAt: evaluationTimeIso,
      observationCount: count,
      overallTrajectory: direction,
      trajectoryVelocity: momentum,
      news2VelocityPerHour: news2Slope,
      persistenceCount: direction === TRAJECTORY_DIRECTIONS.WORSENING ? persistentWorseningCount : persistentImprovingCount,
      evidenceQuality: count >= 3 ? 'HIGH' : count === 2 ? 'MODERATE' : 'LOW',
      escalationRisk,
      clinicalPatternSignal: patternSignal,
      mathematicalExtrapolation,
      systems: {
        hemodynamic: { status: hemoStatus, mapSlope, hrSlope, evidence: hemoEvidence },
        respiratory: { status: respStatus, rrSlope, spo2Slope, evidence: respEvidence },
        neurologic: { status: neuroStatus, gcsDelta, evidence: neuroEvidence },
        metabolicRenal: { status: renalStatus, urineRateMlKgH, evidence: renalEvidence },
        infectionSepsis: { status: infectionStatus, lactateSlope, evidence: infectionEvidence }
      },
      latestVitalsSnapshot: latest,
      isExplainable: true
    };

    return trajectorySnapshot;
  }

  /**
   * 4. Record Trajectory Snapshot & Emit Immutable Trajectory Events
   */
  async recordTrajectoryEvaluation({
    encounterId,
    patientId,
    patientName,
    mrn,
    observations = [],
    labObservations = [],
    actor = { id: 'SYSTEM', name: 'Clinical Trajectory Engine', role: 'CDSS' }
  }) {
    const snapshot = this.evaluatePatientTrajectory({
      encounterId,
      patientId,
      patientName,
      mrn,
      observations,
      labObservations
    });

    await persistenceAdapter.save(TRAJECTORY_SNAPSHOTS_COLLECTION, snapshot.id, snapshot);

    let governanceAlert = null;

    // If rapid/persistent worsening trajectory is detected, create explainable governance alert
    if (snapshot.overallTrajectory === TRAJECTORY_DIRECTIONS.WORSENING && snapshot.escalationRisk === ESCALATION_RISK_LEVELS.ELEVATED) {
      const govRes = await clinicalSafetyGovernanceEngine.createExplainableAlert({
        encounterId,
        patientId,
        patientName,
        mrn,
        ruleKey: 'TRAJECTORY_PERSISTENT_WORSENING',
        contributingFactors: {
          news2VelocityPerHour: snapshot.news2VelocityPerHour,
          persistenceCount: snapshot.persistenceCount,
          mathematicalExtrapolation: snapshot.mathematicalExtrapolation,
          systemSlopes: {
            mapSlope: snapshot.systems.hemodynamic.mapSlope,
            rrSlope: snapshot.systems.respiratory.rrSlope,
            spo2Slope: snapshot.systems.respiratory.spo2Slope
          }
        },
        clinicalFindings: `Pola perburukan trajektori terdeteksi: Laju NEWS2 ${snapshot.mathematicalExtrapolation?.observedVelocity} across ${snapshot.persistenceCount} observasi berturut-turut. Risiko Eskalasi: ${snapshot.escalationRisk}.`,
        recommendedActions: [
          'Evaluasi klinis terfokus oleh DPJP sebelum terjadi dekompensasi organ',
          'Peninjauan ulang target hemodinamik, terapi cairan, dan suplementasi oksigen',
          'Tingkatkan frekuensi pemantauan tanda vital per jam'
        ],
        severity: 'WARNING',
        actor
      });
      governanceAlert = govRes.alert;
    }

    // Emit Immutable Event Sourcing Record
    const trajectoryEvent = {
      id: `EVT-TRAJ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      eventType: 'CLINICAL_TRAJECTORY_CHANGED',
      patientId,
      encounterId,
      timestamp: snapshot.evaluatedAt,
      previousState: 'OBSERVED',
      newState: snapshot.overallTrajectory,
      domain: 'MULTI_ORGAN_LONGITUDINAL',
      evidence: snapshot.systems,
      trajectoryVelocity: snapshot.trajectoryVelocity,
      confidence: 'DETERMINISTIC',
      ruleId: TRAJECTORY_RULES.TRAJECTORY_PERSISTENT_WORSENING.ruleId,
      ruleVersion: TRAJECTORY_RULES.TRAJECTORY_PERSISTENT_WORSENING.ruleVersion,
      actor
    };

    await persistenceAdapter.save(TRAJECTORY_EVENTS_COLLECTION, trajectoryEvent.id, trajectoryEvent);
    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_TRAJECTORY',
      aggregateId: snapshot.id,
      eventName: 'TRAJECTORY_EVALUATED',
      payload: snapshot
    });

    return {
      snapshot,
      event: trajectoryEvent,
      governanceAlert
    };
  }

  /**
   * 5. Generate Explainability Report for Longitudinal Trajectory
   */
  async getTrajectoryExplainabilityReport(snapshotId) {
    const snapshot = await persistenceAdapter.findById(TRAJECTORY_SNAPSHOTS_COLLECTION, snapshotId);
    if (!snapshot) throw new Error(`[ClinicalTrajectory] Snapshot "${snapshotId}" not found`);

    return {
      snapshot,
      reportText: `
================================================================================
NURSEFLOW LONGITUDINAL PATIENT TRAJECTORY EXPLAINABILITY REPORT
================================================================================
Patient ID:             ${snapshot.patientId} (MRN: ${snapshot.mrn})
Encounter ID:           ${snapshot.encounterId}
Evaluation Time:        ${snapshot.evaluatedAt}
Observation Series:     ${snapshot.observationCount} Normalized Points (Evidence Quality: ${snapshot.evidenceQuality})

TRAJECTORY DYNAMICS:
  • Direction:          ${snapshot.overallTrajectory}
  • Momentum / Velocity:${snapshot.trajectoryVelocity} (${snapshot.news2VelocityPerHour >= 0 ? '+' : ''}${snapshot.news2VelocityPerHour} NEWS2/hour)
  • Persistence:        ${snapshot.persistenceCount} consecutive trend points
  • Clinical Signal:    ${snapshot.clinicalPatternSignal}
  • Escalation Risk:    ${snapshot.escalationRisk}

MATHEMATICAL EXTRAPOLATION:
${snapshot.mathematicalExtrapolation ? `  • Observed Velocity:   ${snapshot.mathematicalExtrapolation.observedVelocity}
  • Threshold Proximity: ${snapshot.mathematicalExtrapolation.thresholdProximity}
  • Projected Crossing:  ${snapshot.mathematicalExtrapolation.projectedThresholdCrossing}
  • Projection Type:     ${snapshot.mathematicalExtrapolation.projectionType}
  • Clinical Warning:    ${snapshot.mathematicalExtrapolation.clinicalPrediction}` : '  • No deterioration slope active (Patient Stable / Improving)'}

MULTI-ORGAN SYSTEM SLOPES:
  1. Hemodynamic:       ${snapshot.systems?.hemodynamic?.status} [${snapshot.systems?.hemodynamic?.evidence}]
  2. Respiratory:       ${snapshot.systems?.respiratory?.status} [${snapshot.systems?.respiratory?.evidence}]
  3. Neurologic:        ${snapshot.systems?.neurologic?.status} [${snapshot.systems?.neurologic?.evidence}]
  4. Metabolic / AKI:   ${snapshot.systems?.metabolicRenal?.status} [${snapshot.systems?.metabolicRenal?.evidence}]
  5. Infection / Sepsis:${snapshot.systems?.infectionSepsis?.status} [${snapshot.systems?.infectionSepsis?.evidence}]
================================================================================
      `.trim()
    };
  }
}

export const clinicalTrajectoryEngine = new ClinicalTrajectoryEngine();
export default clinicalTrajectoryEngine;
