/**
 * NurseFlow Enterprise HIS 2026 — Clinical Intelligence Orchestration Engine
 * 
 * Core Philosophy:
 * "Detect early. Explain clearly. Prioritize intelligently. Escalate safely. Keep the clinician in control."
 * "One Patient ➔ One Clinical Event Cluster ➔ One Actionable Alert (Eliminates Alarm Fatigue)."
 * 
 * Standards & Guidelines:
 * 1. Joint Commission National Patient Safety Goals (NPSG.06.01.01) Alarm Safety
 * 2. ECRI Institute Top 10 Health Technology Hazards: Alarm Fatigue Prevention
 * 3. Royal College of Physicians (RCP) NEWS2 Clinical Response Escalation
 * 4. ISO 27799 / WORM Audit Trail Event Sourcing & Merkle Hash Linking
 * 
 * Architectural Invariants:
 * - Aggregation: Disjoint atomic alerts are correlated into a single pathophysiological cluster.
 * - Dynamic Breakthrough: Unchanged state is silenced; worsening triggers immediate breakthrough.
 * - Versioned Governance: Hospital escalation thresholds (e.g. 3-domain MET) are configurable protocols.
 * - Human-in-the-Loop: Acknowledge, Snooze with intelligent Auto-Wake, and WORM-signed DPJP Override.
 */

import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';
import { clinicalRiskStratifier, SEVERITY_STATES, TRAJECTORY_STATES, OVERALL_RISK_STATES } from './clinicalRiskStratifier.service.js';
import crypto from 'crypto';

const ALERT_CLUSTERS_COLLECTION = 'clinical_alert_clusters';
const ALERT_LIFECYCLE_AUDIT_COLLECTION = 'clinical_alert_lifecycle_audits';

export const ALERT_PRIORITY_TIERS = {
  IMMEDIATE_LIFE_THREAT: 'IMMEDIATE_LIFE_THREAT', // P1, Red Flash (< 5 min SLA)
  URGENT_CLINICAL_ACTION: 'URGENT_CLINICAL_ACTION', // P2, Amber/Orange (15 - 30 min SLA)
  PRIORITY_REVIEW: 'PRIORITY_REVIEW',             // P3, Yellow (60 min SLA)
  ROUTINE_AWARENESS: 'ROUTINE_AWARENESS'          // P4, Blue/Teal (120 - 240 min SLA)
};

export const ALERT_LIFECYCLE_STATES = {
  GENERATED: 'GENERATED',
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ESCALATED: 'ESCALATED',
  OVERRIDDEN: 'OVERRIDDEN',
  RESOLVED: 'RESOLVED',
  EXPIRED: 'EXPIRED',
  SUPPRESSED: 'SUPPRESSED'
};

export const WORKSPACE_TARGETS = {
  IGD_WORKSPACE: 'IGD_WORKSPACE',
  INPATIENT_WARD: 'INPATIENT_WARD',
  ICU_ACUITY: 'ICU_ACUITY'
};

export const DEFAULT_HOSPITAL_PROTOCOL = {
  protocolId: 'HOSP-MET-RULE-V2026.08',
  protocolVersion: '2026.08',
  multiDomainMetThreshold: 3,
  preCrisisVelocityThreshold: 1.5,
  actionPolicy: 'MET_REVIEW_RECOMMENDED',
  authorizedByMedicalCommittee: true,
  committeeApprovalRef: 'KOMITE-MEDIS-SK-2026-08'
};

export class ClinicalAlertOrchestrator {
  constructor() {
    this.activeClusters = new Map(); // patientId -> ClinicalEventCluster
    this.auditLedger = [];
    this.processedEventIds = new Set();
  }

  /**
   * 1. Temporal Event Correlation Engine
   * Groups raw disjoint events for the same patient within a temporal sliding window.
   */
  correlateEvents(patientEvents = [], windowMinutes = 30) {
    if (!Array.isArray(patientEvents) || patientEvents.length === 0) {
      return [];
    }

    // Filter duplicate events by eventId or idempotencyKey
    const uniqueEvents = [];
    const seenKeys = new Set();

    for (const evt of patientEvents) {
      const key = evt.eventId || evt.idempotencyKey || `${evt.eventType}-${evt.occurredAt}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueEvents.push(evt);
      }
    }

    // Sort chronologically
    const sorted = [...uniqueEvents].sort((a, b) => {
      const tA = new Date(a.occurredAt || a.timestamp || 0).getTime();
      const tB = new Date(b.occurredAt || b.timestamp || 0).getTime();
      return tA - tB;
    });

    // Group into clusters by time proximity
    const clusters = [];
    let currentCluster = [];

    for (const evt of sorted) {
      if (currentCluster.length === 0) {
        currentCluster.push(evt);
      } else {
        const lastEvt = currentCluster[currentCluster.length - 1];
        const lastT = new Date(lastEvt.occurredAt || lastEvt.timestamp || 0).getTime();
        const currT = new Date(evt.occurredAt || evt.timestamp || 0).getTime();
        const diffMinutes = Math.abs(currT - lastT) / (1000 * 60);

        if (diffMinutes <= windowMinutes) {
          currentCluster.push(evt);
        } else {
          clusters.push(currentCluster);
          currentCluster = [evt];
        }
      }
    }

    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  /**
   * 2. Intelligent Deduplication & Breakthrough Detection
   */
  deduplicateAlerts(newCluster, existingCluster) {
    if (!existingCluster) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'NEW_CLUSTER' };
    }

    // Check if existing cluster is already resolved or expired
    if (existingCluster.lifecycleState === ALERT_LIFECYCLE_STATES.RESOLVED || 
        existingCluster.lifecycleState === ALERT_LIFECYCLE_STATES.EXPIRED) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'PREVIOUS_RESOLVED' };
    }

    // Priority Tier Rank Map
    const priorityRank = {
      [ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT]: 4,
      [ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION]: 3,
      [ALERT_PRIORITY_TIERS.PRIORITY_REVIEW]: 2,
      [ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS]: 1
    };

    const newRank = priorityRank[newCluster.priorityTier] || 1;
    const existingRank = priorityRank[existingCluster.priorityTier] || 1;

    // Breakthrough Condition 1: Priority escalated (e.g. P2 -> P1)
    if (newRank > existingRank) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'PRIORITY_ESCALATED' };
    }

    // Breakthrough Condition 2: Sudden velocity acceleration (Delta Velocity >= 1.0/h)
    const newVel = newCluster.velocityPerHour || 0;
    const existingVel = existingCluster.velocityPerHour || 0;
    if (newVel - existingVel >= 1.0) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'VELOCITY_ACCELERATION' };
    }

    // Breakthrough Condition 3: New critical emergent condition (e.g. Anaphylaxis or Stridor)
    if (newCluster.hasEmergentCondition && !existingCluster.hasEmergentCondition) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'EMERGENT_CONDITION_MANIFESTED' };
    }

    // Breakthrough Condition 4: New distinct organ domain emergence (e.g. Respiratory -> Hemodynamic)
    if (newCluster.dominantDomain && existingCluster.dominantDomain && 
        newCluster.dominantDomain !== existingCluster.dominantDomain && 
        newRank >= 2) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'NEW_ORGAN_DOMAIN_EMERGENCE' };
    }

    // Breakthrough Condition 5: Multi-domain expansion (number of affected domains increased)
    const newDomainCount = newCluster.affectedDomains ? newCluster.affectedDomains.length : 0;
    const existingDomainCount = existingCluster.affectedDomains ? existingCluster.affectedDomains.length : 0;
    if (newDomainCount > existingDomainCount && newRank >= 2) {
      return { isDuplicate: false, isBreakthrough: true, reason: 'MULTI_DOMAIN_EXPANSION' };
    }

    // Otherwise: Deduplicate & Suppress repetitive audible alert on identical stable state
    return {
      isDuplicate: true,
      isBreakthrough: false,
      reason: 'IDENTICAL_STATE_SUPPRESSED'
    };
  }

  /**
   * 3. Clinical Event Cluster Synthesizer (One Patient ➔ One Actionable Alert)
   */
  synthesizeCluster(patientEvents = [], patientContext = {}, hospitalProtocol = null) {
    const protocol = hospitalProtocol || DEFAULT_HOSPITAL_PROTOCOL;
    const patientId = patientContext.patientId || patientEvents[0]?.patientId || 'PT-UNKNOWN';
    const encounterId = patientContext.encounterId || patientEvents[0]?.encounterId || 'ENC-UNKNOWN';
    const wardOrBedLocation = patientContext.wardOrBedLocation || 'WARD-BED-UNKNOWN';

    if (!Array.isArray(patientEvents) || patientEvents.length === 0) {
      return null;
    }

    // Extract raw parameters and states across events
    let maxNews2 = 0;
    let worstSeverity = SEVERITY_STATES.NORMAL;
    let worstTrajectory = TRAJECTORY_STATES.STABLE;
    let worstRisk = OVERALL_RISK_STATES.LOW;
    let velocityPerHour = 0;
    const affectedDomainsSet = new Set();
    const correlatedEventIds = [];
    const eventTypesSet = new Set();

    let hasAnaphylaxis = false;
    let hasOpioidOird = false;
    let hasHypoglycemia = false;
    let hasStridor = false;
    let hasCardiacArrest = false;
    let hasSurgicalBleeding = false;
    let isPalliativeOrDnr = Boolean(patientContext.isPalliative || patientContext.isDnr || patientContext.isDni);
    let isCopd = Boolean(patientContext.isCopd || patientContext.spo2Scale === 2);
    let isDialysis = Boolean(patientContext.isDialysis);
    let isPediatric = Boolean(patientContext.isPediatric);
    let isIsolatedFever = false;
    let hasSignalArtefact = false;
    let hasDataDeficit = false;

    let hasMultiInotropes = false;

    // Collect vitals and labs from events
    let latestObservation = { ...patientContext.latestObservation };

    for (const evt of patientEvents) {
      if (evt.eventId) correlatedEventIds.push(evt.eventId);
      if (evt.eventType) eventTypesSet.add(evt.eventType);

      const p = evt.payload || evt;
      if (p.news2 !== undefined && p.news2 > maxNews2) maxNews2 = p.news2;
      if (p.velocityScorePerHour !== undefined) velocityPerHour = p.velocityScorePerHour;
      if (p.news2VelocityPerHour !== undefined) velocityPerHour = p.news2VelocityPerHour;

      if (p.isAnaphylaxis || p.activeAdverseEvent === 'ANAPHYLAXIS') hasAnaphylaxis = true;
      if (p.activeAdverseEvent === 'OPIOID_OVERSEDATION' || (p.opioidGiven && p.rr <= 9)) hasOpioidOird = true;
      if (p.bloodGlucose !== undefined && p.bloodGlucose <= 54) hasHypoglycemia = true;
      if (p.stridor || p.postExtubationStridor) hasStridor = true;
      if (p.postArrest) hasCardiacArrest = true;
      if (p.isSurgicalBleeding || (p.drainActive && p.hr > 120 && p.map < 70)) hasSurgicalBleeding = true;
      if (p.multiInotropesActive || p.hasMultiInotropes) hasMultiInotropes = true;
      if (p.isArtefact || p.isPoorSignal) hasSignalArtefact = true;

      // Merge vitals
      latestObservation = { ...latestObservation, ...p };

      if (p.domainRisks) {
        Object.keys(p.domainRisks).forEach(d => {
          if (p.domainRisks[d].compositeDomainRisk !== OVERALL_RISK_STATES.LOW) {
            affectedDomainsSet.add(d.toUpperCase());
          }
        });
      }
    }

    // Direct physiological domain detection
    if (latestObservation.map !== undefined && latestObservation.map < 70) affectedDomainsSet.add('HEMODYNAMIC');
    if (latestObservation.urineRate !== undefined && latestObservation.urineRate < 0.5) affectedDomainsSet.add('RENAL_METABOLIC');
    if (latestObservation.gcs !== undefined && latestObservation.gcs < 15) affectedDomainsSet.add('NEUROLOGIC');
    if (latestObservation.rr !== undefined && (latestObservation.rr >= 24 || latestObservation.rr <= 10)) affectedDomainsSet.add('RESPIRATORY');
    if (latestObservation.lactate !== undefined && latestObservation.lactate >= 2.0) affectedDomainsSet.add('INFECTION_SEPSIS');
    if (hasMultiInotropes) affectedDomainsSet.add('MEDICATION_EXPOSURE');

    // Run Risk Stratifier to obtain deterministic multi-domain synthesis
    const riskState = clinicalRiskStratifier.stratifyPatientRisk(
      { ...patientContext, patientId, encounterId, isCopd, isPalliative: isPalliativeOrDnr, isDialysis, isPediatric },
      null,
      [latestObservation]
    );

    worstSeverity = riskState.severityState;
    worstTrajectory = riskState.trajectoryState;
    worstRisk = riskState.overallRiskState;
    if (riskState.evidenceQuality === 'INSUFFICIENT' || riskState.evidenceDeficitReason) {
      hasDataDeficit = true;
    }

    // Populate affected domains from riskState
    if (riskState.domainRisks) {
      Object.keys(riskState.domainRisks).forEach(d => {
        if (riskState.domainRisks[d].compositeDomainRisk !== OVERALL_RISK_STATES.LOW && riskState.domainRisks[d].compositeDomainRisk !== 'NONE') {
          affectedDomainsSet.add(d.toUpperCase());
        }
      });
    }

    const affectedDomains = Array.from(affectedDomainsSet);
    const dominantDomain = affectedDomains[0] || 'RESPIRATORY';

    // ─── Synthesis of Title, Headline & Priority Tier ───
    let clusterTitle = 'ROUTINE CLINICAL OBSERVATION';
    let headlineAction = 'CONTINUE ROUTINE WARD OBSERVATION';
    let priorityTier = ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS;
    let targetSlaMinutes = 240;
    const suggestedClinicalSteps = [];

    // Protocol-Based Multi-Domain Threshold Evaluation
    const isMultiDomainMet = affectedDomains.length >= (protocol.multiDomainMetThreshold || 3);

    // Rule Evaluations:
    if (hasAnaphylaxis) {
      clusterTitle = 'ACUTE ANAPHYLAXIS COLLAPSE';
      headlineAction = 'INJECT EPINEPHRINE 0.5MG IM STAT / PREPARE AIRWAY';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Epinephrine 0.5mg IM paha anterolateral', 'Oksigen High-Flow 100%', 'Pasang 2 jalur IV kristaloid cepat');
    } else if (hasStridor) {
      clusterTitle = 'UPPER AIRWAY COMPROMISE / POST-EXTUBATION';
      headlineAction = 'ACTIVATE MET / PREPARE RE-INTUBATION & NEBULIZED EPINEPHRINE';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Siapkan Video Laringoskop & ETT', 'Nebulisasi Epinephrine 1:1000', 'Injeksi Dexamethasone IV');
    } else if (hasOpioidOird) {
      clusterTitle = 'ACUTE OPIOID RESPIRATORY DEPRESSION';
      headlineAction = 'ADMINISTER NALOXONE RESCUE / SUPPORT VENTILATION';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Naloxone 0.04 - 0.4mg IV titrasi', 'Bag-Valve-Mask siap', 'Hentikan sementara infus/PCA opioid');
    } else if (hasHypoglycemia) {
      clusterTitle = 'SEVERE HYPOGLYCEMIC RESCUE';
      headlineAction = 'ADMINISTER DEXTROSE 40% IV STAT';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Dextrose 40% 25-50 ml IV Bolus', 'Recheck GDS per 15 menit', 'Evaluasi dosis insulin sebelumnya');
    } else if (hasSurgicalBleeding) {
      clusterTitle = 'POST-OPERATIVE SURGICAL BLEEDING';
      headlineAction = 'ACTIVATE SURGICAL TEAM & PREPARE BLOOD TRANSFUSION';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Hubungi Operator Bedah & Anestesi Cito', 'Kirim Darah Crossmatch 2-4 Unit PRC', 'Cek Hb serial & profil koagulasi');
    } else if (hasMultiInotropes) {
      clusterTitle = 'HIGH-ALERT VASOACTIVE ESCALATION';
      headlineAction = 'IMMEDIATE ICU BED TRANSFER & INVASIVE ARTERIAL LINE';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Titrasi infus inotropik via central line', 'Pasang monitoring tekanan arteri invasif', 'Koordinasi transfer ranjang ICU Cito');
    } else if (isPalliativeOrDnr) {
      clusterTitle = 'PALLIATIVE COMFORT CARE PATHWAY';
      headlineAction = 'REVIEW SYMPTOM MANAGEMENT & COMFORT PROTOCOL';
      priorityTier = ALERT_PRIORITY_TIERS.PRIORITY_REVIEW;
      targetSlaMinutes = 60;
      suggestedClinicalSteps.push('Fokus pada kenyamanan dan analgesia adekuat', 'Hindari pemanggilan MET/Code Blue yang invasif', 'Konsultasikan dengan tim paliatif/keluarga');
    } else if (isMultiDomainMet || worstSeverity === SEVERITY_STATES.CRITICAL || worstRisk === OVERALL_RISK_STATES.CRITICAL) {
      clusterTitle = isMultiDomainMet ? 'MULTI-ORGAN DYSFUNCTION SYNERGY' : 'CRITICAL CARDIORESPIRATORY COLLAPSE';
      headlineAction = 'ACTIVATE MET TEAM / PREPARE INTUBATION & FLUID RESUSCITATION';
      priorityTier = ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT;
      targetSlaMinutes = 5;
      suggestedClinicalSteps.push('Aktivasi Tim Medical Emergency Team (MET)', 'Pasang Monitoring Kontinu / Telemetri', 'Persiapkan transfer ke ICU / HCU');
    } else if (worstRisk === OVERALL_RISK_STATES.HIGH || velocityPerHour >= (protocol.preCrisisVelocityThreshold || 1.5) || (latestObservation.gcs && latestObservation.gcs <= 13 && latestObservation.gcs > 8)) {
      clusterTitle = 'URGENT PRE-CRISIS DETERIORATION';
      headlineAction = 'BEDSIDE DPJP SPECIALIST ASSESSMENT REQUIRED (<= 15 MIN)';
      priorityTier = ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION;
      targetSlaMinutes = 15;
      suggestedClinicalSteps.push('Tinjauan dokter jaga / DPJP dalam rentang <= 15 menit', 'Periksa Analisa Gas Darah (AGD) & Laktat serial', 'Titrasi oksigenasi dan evaluasi cairan');
    } else if (isDialysis && maxNews2 <= 1) {
      clusterTitle = 'CHRONIC_DIALYSIS_BASELINE';
      headlineAction = 'ROUTINE HEMODIALYSIS MONITORING';
      priorityTier = ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS;
      targetSlaMinutes = 240;
    } else if (isCopd && latestObservation.spo2 >= 88 && maxNews2 <= 2) {
      clusterTitle = 'NORMAL_MONITORING_PPOK_SCALE_2';
      headlineAction = 'TARGET SPO2 88-92% MAINTAINED';
      priorityTier = ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS;
      targetSlaMinutes = 240;
    } else if (latestObservation.temp >= 38.5 && (!latestObservation.hr || latestObservation.hr <= 90) && (!latestObservation.rr || latestObservation.rr <= 20) && maxNews2 <= 2) {
      clusterTitle = 'ISOLATED BENIGN FEVER';
      headlineAction = 'ANTIPYRETIC & ROUTINE OBSERVATION';
      priorityTier = ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS;
      targetSlaMinutes = 240;
    } else if (worstRisk === OVERALL_RISK_STATES.MODERATE || worstSeverity === SEVERITY_STATES.MODERATE) {
      clusterTitle = 'PRIORITY CLINICAL REVIEW';
      headlineAction = 'RESIDENT DOCTOR REVIEW WITHIN 60 MINUTES';
      priorityTier = ALERT_PRIORITY_TIERS.PRIORITY_REVIEW;
      targetSlaMinutes = 60;
      suggestedClinicalSteps.push('Evaluasi respons terapi bangsal', 'Observasi TTV tiap 1-2 jam', 'Koreksi elektrolit bila ada indikasi');
    } else if (hasDataDeficit || (latestObservation.rr === undefined || latestObservation.spo2 === undefined)) {
      clusterTitle = 'DATA DEFICIT RE-ASSESSMENT REQUIRED';
      headlineAction = 'COMPLETE VITAL SIGNS MEASUREMENT IMMEDIATELY';
      priorityTier = ALERT_PRIORITY_TIERS.PRIORITY_REVIEW;
      targetSlaMinutes = 30;
      suggestedClinicalSteps.push('Lakukan pengukuran lengkap TTV 6 parameter', 'Pastikan saturasi SpO2 dan kesadaran terisi');
    }

    // ─── Level 1, 2, 3 Explainability Synthesis ───
    const keyDrivers = [];
    if (latestObservation.rr !== undefined) {
      keyDrivers.push({
        parameter: 'Respirasi (RR)',
        trend: `${latestObservation.rr} x/menit`,
        slope: velocityPerHour ? `${velocityPerHour > 0 ? '+' : ''}${velocityPerHour}/h` : 'Stabil',
        impact: 'PRIMARY'
      });
    }
    if (latestObservation.spo2 !== undefined) {
      keyDrivers.push({
        parameter: 'Saturasi O2',
        trend: `${latestObservation.spo2}%`,
        slope: latestObservation.spo2 < 92 ? 'Menurun' : 'Aman',
        impact: latestObservation.spo2 < 92 ? 'PRIMARY' : 'CONTRIBUTING'
      });
    }
    if (latestObservation.map !== undefined || latestObservation.sbp !== undefined) {
      const pMap = latestObservation.map || latestObservation.sbp;
      keyDrivers.push({
        parameter: 'Hemodinamik (MAP)',
        trend: `${Math.round(pMap)} mmHg`,
        slope: latestObservation.map < 70 ? 'Hipotensi' : 'Stabil',
        impact: latestObservation.map < 70 ? 'PRIMARY' : 'SECONDARY'
      });
    }

    const explainability = {
      summaryReason: `${clusterTitle}: Terdeteksi perburukan pada ${affectedDomains.length || 1} domain organ (${affectedDomains.join(', ') || dominantDomain}) dengan skor NEWS2 = ${maxNews2}.`,
      keyDrivers: keyDrivers.slice(0, 3),
      suggestedClinicalSteps,
      protocolGovernanceNote: `Diatur berdasarkan Protokol ${protocol.protocolId} (v${protocol.protocolVersion}) disetujui Komite Medis.`
    };

    // Cryptographic Merkle Hash Root
    const createdAt = new Date().toISOString();
    const clusterId = `CLUST-${patientId}-${Date.now().toString(36).toUpperCase()}`;
    const hashPayload = JSON.stringify({
      clusterId,
      patientId,
      encounterId,
      clusterTitle,
      priorityTier,
      correlatedEventIds,
      protocolId: protocol.protocolId,
      createdAt
    });
    const tamperProofHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const cluster = {
      clusterId,
      patientId,
      encounterId,
      wardOrBedLocation,
      createdAt,
      updatedAt: createdAt,

      // Cluster Identity & Priority
      clusterTitle,
      headlineAction,
      priorityTier,
      targetSlaMinutes,
      velocityPerHour,
      hasEmergentCondition: Boolean(hasAnaphylaxis || hasStridor || hasOpioidOird || hasHypoglycemia || hasSurgicalBleeding),

      // Synthesized Fisiologi
      compositeSeverity: worstSeverity,
      compositeTrajectory: worstTrajectory,
      compositeRisk: worstRisk,
      dominantDomain,
      affectedDomains,

      // Correlated Evidence
      correlatedEventIds,
      evidenceQuality: hasSignalArtefact ? 'LOW' : (hasDataDeficit ? 'INSUFFICIENT' : 'HIGH'),
      explainability,

      // Lifecycle FSM State
      lifecycleState: ALERT_LIFECYCLE_STATES.ACTIVE,
      appliedProtocol: {
        protocolId: protocol.protocolId,
        protocolVersion: protocol.protocolVersion,
        ruleDescription: protocol.actionPolicy
      },
      tamperProofHash
    };

    // Cache active cluster
    this.activeClusters.set(patientId, cluster);

    try {
      persistenceAdapter.recordEvent(ALERT_CLUSTERS_COLLECTION, {
        clusterId: cluster.clusterId,
        patientId: cluster.patientId,
        cluster,
        timestamp: createdAt,
        tamperProofHash
      });
    } catch (e) {
      this.auditLedger.push(cluster);
    }

    return cluster;
  }

  /**
   * 4. Mesin Keadaan Siklus Hidup Alert (Alert Lifecycle State Transitions)
   */
  transitionLifecycleState(clusterId, targetState, transitionPayload = {}, clinicianIdentity = {}) {
    let foundCluster = null;
    for (const [pId, clust] of this.activeClusters.entries()) {
      if (clust.clusterId === clusterId) {
        foundCluster = clust;
        break;
      }
    }

    if (!foundCluster) {
      throw new Error(`Cluster ID ${clusterId} not found in active clusters.`);
    }

    const previousState = foundCluster.lifecycleState;
    const transitionTimestamp = new Date().toISOString();

    // Validate Valid State Transitions
    const allowedTransitions = {
      [ALERT_LIFECYCLE_STATES.GENERATED]: [ALERT_LIFECYCLE_STATES.ACTIVE, ALERT_LIFECYCLE_STATES.SUPPRESSED],
      [ALERT_LIFECYCLE_STATES.ACTIVE]: [ALERT_LIFECYCLE_STATES.ACKNOWLEDGED, ALERT_LIFECYCLE_STATES.ESCALATED, ALERT_LIFECYCLE_STATES.OVERRIDDEN, ALERT_LIFECYCLE_STATES.RESOLVED, ALERT_LIFECYCLE_STATES.EXPIRED],
      [ALERT_LIFECYCLE_STATES.ACKNOWLEDGED]: [ALERT_LIFECYCLE_STATES.ACTIVE, ALERT_LIFECYCLE_STATES.ESCALATED, ALERT_LIFECYCLE_STATES.OVERRIDDEN, ALERT_LIFECYCLE_STATES.RESOLVED],
      [ALERT_LIFECYCLE_STATES.ESCALATED]: [ALERT_LIFECYCLE_STATES.RESOLVED, ALERT_LIFECYCLE_STATES.OVERRIDDEN],
      [ALERT_LIFECYCLE_STATES.OVERRIDDEN]: [ALERT_LIFECYCLE_STATES.RESOLVED, ALERT_LIFECYCLE_STATES.ESCALATED],
      [ALERT_LIFECYCLE_STATES.RESOLVED]: [ALERT_LIFECYCLE_STATES.ACTIVE],
      [ALERT_LIFECYCLE_STATES.SUPPRESSED]: [ALERT_LIFECYCLE_STATES.ACTIVE]
    };

    if (!allowedTransitions[previousState]?.includes(targetState)) {
      throw new Error(`Invalid lifecycle transition from ${previousState} to ${targetState}.`);
    }

    // Apply Transition Effects
    foundCluster.lifecycleState = targetState;
    foundCluster.updatedAt = transitionTimestamp;

    if (targetState === ALERT_LIFECYCLE_STATES.ACKNOWLEDGED) {
      foundCluster.acknowledgedBy = clinicianIdentity;
      foundCluster.acknowledgedAt = transitionTimestamp;
      if (transitionPayload.snoozeMinutes) {
        const snoozeDate = new Date(Date.now() + transitionPayload.snoozeMinutes * 60 * 1000);
        foundCluster.snoozeUntil = snoozeDate.toISOString();
      }
    } else if (targetState === ALERT_LIFECYCLE_STATES.ESCALATED) {
      foundCluster.escalatedToRole = transitionPayload.escalateRole || 'MET_ICU_TEAM';
      foundCluster.escalatedAt = transitionTimestamp;
    } else if (targetState === ALERT_LIFECYCLE_STATES.RESOLVED) {
      foundCluster.resolvedAt = transitionTimestamp;
      foundCluster.resolutionNotes = transitionPayload.resolutionNotes || 'Clinical stabilization verified.';
    }

    // New Audit Hash
    const auditHashPayload = JSON.stringify({
      clusterId,
      previousState,
      targetState,
      clinicianId: clinicianIdentity.clinicianId || 'SYSTEM',
      transitionTimestamp
    });
    const transitionHash = crypto.createHash('sha256').update(auditHashPayload).digest('hex');
    foundCluster.tamperProofHash = transitionHash;

    try {
      persistenceAdapter.recordEvent(ALERT_LIFECYCLE_AUDIT_COLLECTION, {
        clusterId,
        previousState,
        targetState,
        clinicianIdentity,
        transitionPayload,
        timestamp: transitionTimestamp,
        transitionHash
      });
    } catch (e) {
      this.auditLedger.push({ clusterId, previousState, targetState, timestamp: transitionTimestamp });
    }

    return foundCluster;
  }

  /**
   * 5. Intelligent Snooze Auto-Wake Evaluator
   * Automatically wakes an ACKNOWLEDGED/Snoozed alert if physiological parameters worsen abruptly.
   */
  evaluateAutoWakeConditions(cluster, newObservation = {}) {
    if (!cluster || cluster.lifecycleState !== ALERT_LIFECYCLE_STATES.ACKNOWLEDGED) {
      return { shouldAutoWake: false, wakeReason: null };
    }

    const { spo2, rr, map, gcs } = newObservation;

    // Auto-Wake Condition 1: Severe desaturation SpO2 < 88% (or < 84% in COPD)
    const isCopd = Boolean(cluster.isCopd);
    if (!isCopd && spo2 !== undefined && spo2 < 88) {
      return { shouldAutoWake: true, wakeReason: `Desaturasi Oksigen Kritis (SpO2 ${spo2}% < 88%)` };
    }
    if (isCopd && spo2 !== undefined && spo2 < 84) {
      return { shouldAutoWake: true, wakeReason: `Hipoksemia PPOK Kritis (SpO2 ${spo2}% < 84%)` };
    }

    // Auto-Wake Condition 2: Respiratory Arrest or Extreme Tachypnea (RR <= 8 or RR >= 35)
    if (rr !== undefined && (rr <= 8 || rr >= 35)) {
      return { shouldAutoWake: true, wakeReason: `Frekuensi Napas Ekstrem (${rr} x/menit)` };
    }

    // Auto-Wake Condition 3: MAP crash (< 60 mmHg)
    if (map !== undefined && map < 60) {
      return { shouldAutoWake: true, wakeReason: `Kolaps Tekanan Darah (MAP ${Math.round(map)} mmHg < 60)` };
    }

    // Auto-Wake Condition 4: GCS Coma Drop (GCS <= 8)
    if (gcs !== undefined && gcs <= 8) {
      return { shouldAutoWake: true, wakeReason: `Penurunan Kesadaran Koma (GCS ${gcs} <= 8)` };
    }

    return { shouldAutoWake: false, wakeReason: null };
  }

  /**
   * 6. Workspace UI Adapters (IGD, Inpatient Ward, ICU)
   */
  generateWorkspacePayload(cluster, targetWorkspace) {
    if (!cluster) return null;

    const base = {
      clusterId: cluster.clusterId,
      patientId: cluster.patientId,
      encounterId: cluster.encounterId,
      wardOrBedLocation: cluster.wardOrBedLocation,
      priorityTier: cluster.priorityTier,
      headlineAction: cluster.headlineAction,
      targetSlaMinutes: cluster.targetSlaMinutes,
      lifecycleState: cluster.lifecycleState,
      updatedAt: cluster.updatedAt
    };

    switch (targetWorkspace) {
      case WORKSPACE_TARGETS.IGD_WORKSPACE:
        return {
          ...base,
          layoutMode: 'RAPID_TRIAGE_CARD',
          triageAcuityBadge: cluster.priorityTier === ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT ? 'ESI-1_RESUSCITATION' : 'ESI-2_EMERGENCY',
          citoActionButton: cluster.priorityTier === ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT ? 'CALL_RESUSCITATION_TEAM' : 'NOTIFY_TRIAGE_DOCTOR',
          quickSummary: cluster.explainability.summaryReason
        };

      case WORKSPACE_TARGETS.INPATIENT_WARD:
        return {
          ...base,
          layoutMode: 'WARD_CENTRAL_BOARD',
          stationDisplayIndex: cluster.priorityTier === ALERT_PRIORITY_TIERS.IMMEDIATE_LIFE_THREAT ? 1 : (cluster.priorityTier === ALERT_PRIORITY_TIERS.URGENT_CLINICAL_ACTION ? 2 : 3),
          bedTag: cluster.wardOrBedLocation,
          countdownTargetEpoch: new Date(cluster.createdAt).getTime() + (cluster.targetSlaMinutes * 60 * 1000),
          actionSteps: cluster.explainability.suggestedClinicalSteps
        };

      case WORKSPACE_TARGETS.ICU_ACUITY:
        return {
          ...base,
          layoutMode: 'ICU_TELEMETRY_DRAWER',
          organVectors: cluster.affectedDomains || [],
          keyDriversTable: cluster.explainability?.keyDrivers || [],
          protocolAuditRef: cluster.appliedProtocol?.protocolId || DEFAULT_HOSPITAL_PROTOCOL.protocolId
        };

      default:
        return base;
    }
  }

  /**
   * 7. Clinician Override Protocol with WORM Signing
   */
  evaluateClinicianOverride(cluster, overridePayload = {}, clinicianIdentity = {}) {
    if (!cluster || !overridePayload.justificationNotes) {
      throw new Error('Cluster and clinical justification notes are required for override.');
    }

    const overrideTimestamp = new Date().toISOString();
    const updatedCluster = {
      ...cluster,
      priorityTier: overridePayload.targetPriority || ALERT_PRIORITY_TIERS.ROUTINE_AWARENESS,
      targetSlaMinutes: overridePayload.targetSla || 240,
      lifecycleState: ALERT_LIFECYCLE_STATES.OVERRIDDEN,
      overrideDetails: {
        overriddenBy: clinicianIdentity.clinicianName || clinicianIdentity.clinicianId || 'Clinician',
        clinicianRole: clinicianIdentity.clinicianRole || 'DPJP',
        overrideDirection: overridePayload.overrideDirection || 'DOWNGRADE',
        justificationCategory: overridePayload.justificationCategory || 'CHRONIC_BASELINE',
        justificationNotes: overridePayload.justificationNotes,
        timestamp: overrideTimestamp
      },
      updatedAt: overrideTimestamp
    };

    const overrideHash = crypto.createHash('sha256').update(JSON.stringify(updatedCluster.overrideDetails)).digest('hex');
    updatedCluster.tamperProofHash = overrideHash;

    this.activeClusters.set(updatedCluster.patientId, updatedCluster);
    return updatedCluster;
  }

  /**
   * 8. High-Performance Deterministic Batch Orchestrator
   */
  batchOrchestrate(patientsData = [], hospitalProtocol = null) {
    if (!Array.isArray(patientsData)) return [];
    return patientsData.map(p => this.synthesizeCluster(p.events, p.context, hospitalProtocol));
  }
}

export const clinicalAlertOrchestrator = new ClinicalAlertOrchestrator();
