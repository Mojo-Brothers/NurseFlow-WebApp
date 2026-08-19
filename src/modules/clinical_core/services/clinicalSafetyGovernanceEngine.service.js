/**
 * NurseFlow Enterprise HIS 2026 — Clinical Safety & Escalation Governance Engine
 * Standards:
 * 1. JCI IPSG, RCP NEWS2 Governance & IHI Early Warning Escalation
 * 2. Non-Negotiable Invariant: "Every clinical alert must be explainable, traceable, attributable, and reversible"
 * 3. Human-in-the-Loop Authorization Guard (Detection -> Recommendation -> Authorization -> Execution)
 * 4. Alert Fatigue Control, Deduplication, and Downgrade/Recovery Pathways
 */

import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const GOVERNANCE_ALERTS_COLLECTION = 'clinical_governance_alerts';
const GOVERNANCE_AUDIT_COLLECTION = 'clinical_governance_audit_ledger';

export const ALERT_LIFECYCLE_STATES = {
  GENERATED: 'GENERATED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  AUTHORIZED: 'AUTHORIZED',
  EXECUTED: 'EXECUTED',
  OVERRIDDEN: 'OVERRIDDEN',
  DOWNGRADED: 'DOWNGRADED',
  RESOLVED: 'RESOLVED'
};

export const RULE_REGISTRY = {
  NEWS2_CRITICAL_ESCALATION: {
    ruleId: 'RULE-NEWS2-CRIT-V1',
    ruleName: 'NEWS2 Critical Care Escalation Rule',
    ruleVersion: '1.2.0',
    thresholdDescription: 'Aggregate NEWS2 >= 7 or single extreme parameter = 3',
    evidenceBase: 'Royal College of Physicians (RCP) National Early Warning Score 2 (2017)'
  },
  NEWS2_MEDIUM_RRT: {
    ruleId: 'RULE-NEWS2-MED-V1',
    ruleName: 'NEWS2 Rapid Response Team (RRT) Review Rule',
    ruleVersion: '1.1.0',
    thresholdDescription: 'Aggregate NEWS2 score 5 - 6',
    evidenceBase: 'IHI Rapid Response Systems Guidelines'
  },
  ADE_ANAPHYLAXIS_RECOGNITION: {
    ruleId: 'RULE-ADE-ANAPHYLAXIS-V1',
    ruleName: 'Post-Medication Anaphylaxis Detection Rule',
    ruleVersion: '1.0.4',
    thresholdDescription: 'Allergic cutaneous symptoms + respiratory compromise (RR > 25 / SpO2 < 92) or SBP < 90 within 60m of IV antibiotic',
    evidenceBase: 'World Allergy Organization (WAO) Anaphylaxis Guidelines 2020'
  },
  ADE_OIRD_RECOGNITION: {
    ruleId: 'RULE-ADE-OIRD-V1',
    ruleName: 'Opioid-Induced Respiratory Depression Detection Rule',
    ruleVersion: '1.0.2',
    thresholdDescription: 'Respiratory Rate <= 9 or CNS depression within 120m of Opioid administration',
    evidenceBase: 'American Society of Anesthesiologists (ASA) Opioid Safety Standards'
  },
  ADE_HYPOGLYCEMIA_RECOGNITION: {
    ruleId: 'RULE-ADE-HYPO-V1',
    ruleName: 'Post-Insulin Hypoglycemia Rescue Rule',
    ruleVersion: '1.1.0',
    thresholdDescription: 'Blood glucose <= 70 mg/dL (Warning) or <= 54 mg/dL (Critical) within 240m of Insulin',
    evidenceBase: 'American Diabetes Association (ADA) Standards of Care 2024'
  },
  ADE_REFRACTORY_SHOCK: {
    ruleId: 'RULE-ADE-SHOCK-V1',
    ruleName: 'Inadequate Vasopressor Response / Refractory Shock Rule',
    ruleVersion: '1.0.1',
    thresholdDescription: 'Mean Arterial Pressure (MAP) < 65 mmHg after >= 30m of Norepinephrine titration',
    evidenceBase: 'Surviving Sepsis Campaign (SSC) 2021 Guidelines'
  },
  TRAJECTORY_PERSISTENT_WORSENING: {
    ruleId: 'RULE-TRAJ-WORSEN-V1',
    ruleName: 'Persistent Multi-Observation Deterioration Trajectory',
    ruleVersion: '1.0.0',
    thresholdDescription: 'NEWS2 velocity >= +1.0/h across >= 3 consecutive observations',
    evidenceBase: 'Longitudinal Clinical Deterioration Dynamics & Early Warning Escalation'
  }
};

class ClinicalSafetyGovernanceEngine {
  constructor() {
    this.memoryAlerts = new Map();
    this.recentAlertWindowMs = 15 * 60 * 1000; // 15-minute alert deduplication window
  }

  /**
   * 1. Create Explainable, Traceable Clinical Alert
   */
  async createExplainableAlert({
    encounterId,
    patientId,
    patientName,
    mrn,
    ruleKey,
    contributingFactors,
    clinicalFindings,
    recommendedActions = [],
    severity = 'HIGH',
    actor = { id: 'SYSTEM', name: 'Clinical Deterioration Engine', role: 'CDSS' }
  }) {
    const rule = RULE_REGISTRY[ruleKey] || {
      ruleId: `RULE-CUSTOM-${ruleKey}`,
      ruleName: ruleKey,
      ruleVersion: '1.0.0',
      thresholdDescription: 'Clinical Safety Boundary Threshold',
      evidenceBase: 'Clinical Practice Guideline'
    };

    // Alert Deduplication & Fatigue Control: Check if identical alert was generated in the last 15 minutes
    const existingAlerts = await persistenceAdapter.query(GOVERNANCE_ALERTS_COLLECTION);
    const now = Date.now();
    const duplicate = existingAlerts.find(a => 
      a.encounterId === encounterId &&
      a.ruleId === rule.ruleId &&
      a.status === ALERT_LIFECYCLE_STATES.GENERATED &&
      (now - new Date(a.generatedAt).getTime()) < this.recentAlertWindowMs
    );

    if (duplicate) {
      // Deduplicate: Return existing active alert without spamming clinicians
      return { alert: duplicate, isDeduplicated: true };
    }

    const alertId = `ALT-GOV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const explainableAlert = {
      id: alertId,
      encounterId,
      patientId,
      patientName,
      mrn,
      ruleId: rule.ruleId,
      ruleName: rule.ruleName,
      ruleVersion: rule.ruleVersion,
      evidenceBase: rule.evidenceBase,
      thresholdDescription: rule.thresholdDescription,
      severity,
      contributingFactors,
      clinicalFindings,
      recommendedActions,
      requiresHumanAuthorization: true,
      status: ALERT_LIFECYCLE_STATES.GENERATED,
      generatedAt: timestamp,
      generatedBy: actor,
      acknowledgement: null,
      authorization: null,
      overrideReason: null,
      downgradeInfo: null
    };

    await persistenceAdapter.save(GOVERNANCE_ALERTS_COLLECTION, alertId, explainableAlert);

    // Stage outbox event for real-time clinician notifications
    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_SAFETY_ALERT',
      aggregateId: alertId,
      eventName: 'EXPLAINABLE_ALERT_GENERATED',
      payload: explainableAlert
    });

    return { alert: explainableAlert, isDeduplicated: false };
  }

  /**
   * 2. Acknowledge Clinical Alert (Human-in-the-Loop Step 1)
   */
  async acknowledgeAlert({ alertId, actorId, actorName, actorRole }) {
    const alert = await persistenceAdapter.findById(GOVERNANCE_ALERTS_COLLECTION, alertId);
    if (!alert) throw new Error(`[ClinicalGovernance] Alert "${alertId}" not found`);

    const timestamp = new Date().toISOString();
    alert.status = ALERT_LIFECYCLE_STATES.ACKNOWLEDGED;
    alert.acknowledgement = {
      acknowledgedBy: { id: actorId, name: actorName, role: actorRole },
      acknowledgedAt: timestamp
    };

    await persistenceAdapter.save(GOVERNANCE_ALERTS_COLLECTION, alertId, alert);
    await this._recordAuditTrail(alertId, 'ALERT_ACKNOWLEDGED', { actorId, actorName, actorRole, timestamp });

    return alert;
  }

  /**
   * 3. Authorize Clinical Intervention (Human-in-the-Loop Step 2)
   */
  async authorizeIntervention({ alertId, authorizedBy, notes = '' }) {
    const alert = await persistenceAdapter.findById(GOVERNANCE_ALERTS_COLLECTION, alertId);
    if (!alert) throw new Error(`[ClinicalGovernance] Alert "${alertId}" not found`);

    if (authorizedBy.role !== 'DOCTOR' && authorizedBy.role !== 'SPECIALIST') {
      throw new Error(`[ClinicalGovernance:UNAUTHORIZED] Only licensed physicians (DOCTOR) can authorize clinical interventions.`);
    }

    const timestamp = new Date().toISOString();
    alert.status = ALERT_LIFECYCLE_STATES.AUTHORIZED;
    alert.authorization = {
      authorizedBy,
      authorizedAt: timestamp,
      notes
    };

    await persistenceAdapter.save(GOVERNANCE_ALERTS_COLLECTION, alertId, alert);
    await this._recordAuditTrail(alertId, 'INTERVENTION_AUTHORIZED', { authorizedBy, notes, timestamp });

    return alert;
  }

  /**
   * 4. Clinical Override / Dismissal with Medicolegal Justification
   */
  async overrideAlert({ alertId, clinician, justificationReason }) {
    if (!justificationReason || justificationReason.trim().length < 5) {
      throw new Error(`[ClinicalGovernance:JUSTIFICATION_REQUIRED] Clinical override requires explicit medicolegal justification.`);
    }

    const alert = await persistenceAdapter.findById(GOVERNANCE_ALERTS_COLLECTION, alertId);
    if (!alert) throw new Error(`[ClinicalGovernance] Alert "${alertId}" not found`);

    const timestamp = new Date().toISOString();
    alert.status = ALERT_LIFECYCLE_STATES.OVERRIDDEN;
    alert.overrideReason = {
      clinician,
      justificationReason,
      overriddenAt: timestamp
    };

    await persistenceAdapter.save(GOVERNANCE_ALERTS_COLLECTION, alertId, alert);
    await this._recordAuditTrail(alertId, 'ALERT_OVERRIDDEN', { clinician, justificationReason, timestamp });

    return alert;
  }

  /**
   * 5. Downgrade / Recovery Pathway (e.g. Patient Stabilizes: NEWS2 Drops from 8 -> 3)
   */
  async evaluateDowngradePathway({ encounterId, newNews2, actor }) {
    const activeAlerts = await persistenceAdapter.query(GOVERNANCE_ALERTS_COLLECTION);
    const criticalAlerts = activeAlerts.filter(a => 
      a.encounterId === encounterId && 
      (a.status === ALERT_LIFECYCLE_STATES.GENERATED || a.status === ALERT_LIFECYCLE_STATES.ACKNOWLEDGED || a.status === ALERT_LIFECYCLE_STATES.AUTHORIZED) &&
      a.ruleId === RULE_REGISTRY.NEWS2_CRITICAL_ESCALATION.ruleId
    );

    if (criticalAlerts.length > 0 && newNews2.totalScore <= 4) {
      const timestamp = new Date().toISOString();
      for (const alert of criticalAlerts) {
        alert.status = ALERT_LIFECYCLE_STATES.DOWNGRADED;
        alert.downgradeInfo = {
          previousScore: alert.contributingFactors?.totalScore || '>= 7',
          recoveredScore: newNews2.totalScore,
          downgradedBy: actor,
          downgradedAt: timestamp,
          clinicalRecommendation: 'Pasien telah stabil (NEWS2 <= 4). Rekomendasi de-eskalasi pemantauan ke tingkat bangsal rawat inap.'
        };
        await persistenceAdapter.save(GOVERNANCE_ALERTS_COLLECTION, alert.id, alert);
        await this._recordAuditTrail(alert.id, 'CLINICAL_ALERT_DOWNGRADED', { newScore: newNews2.totalScore, actor, timestamp });
      }

      return {
        downgraded: true,
        downgradedAlertsCount: criticalAlerts.length,
        message: 'Pasien mengalami perbaikan klinis. Status perburukan dide-eskalasi secara aman.'
      };
    }

    return { downgraded: false };
  }

  /**
   * 6. Forensic WORM Audit Ledger Recorder
   */
  async _recordAuditTrail(alertId, actionType, payload) {
    const auditEventId = `AUD-GOV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const auditRecord = {
      id: auditEventId,
      alertId,
      actionType,
      payload,
      recordedAt: new Date().toISOString()
    };
    await persistenceAdapter.save(GOVERNANCE_AUDIT_COLLECTION, auditEventId, auditRecord);
  }

  /**
   * 7. Query Explainability History for Any Encounter
   */
  async getExplainabilityReport(alertId) {
    const alert = await persistenceAdapter.findById(GOVERNANCE_ALERTS_COLLECTION, alertId);
    if (!alert) throw new Error(`[ClinicalGovernance] Alert "${alertId}" not found`);

    const auditLedger = await persistenceAdapter.query(GOVERNANCE_AUDIT_COLLECTION);
    const alertAuditTrail = auditLedger.filter(a => a.alertId === alertId);

    return {
      alert,
      explainabilityText: `
============================================================
NURSEFLOW CLINICAL SAFETY EXPLAINABILITY REPORT
============================================================
Alert ID:               ${alert.id}
Status:                 ${alert.status}
Triggered Rule:         ${alert.ruleName} (${alert.ruleId}) [v${alert.ruleVersion}]
Evidence Base:          ${alert.evidenceBase}
Threshold Criteria:     ${alert.thresholdDescription}
Severity Level:         ${alert.severity}

Contributing Factors:
${JSON.stringify(alert.contributingFactors, null, 2)}

Clinical Findings:
${alert.clinicalFindings}

Recommended Protocols (Human Authorization Required):
${alert.recommendedActions.map((act, i) => `  ${i+1}. ${act}`).join('\n')}

Audit Trail Lineage:
${alertAuditTrail.map(t => `  • [${t.recordedAt}] ${t.actionType}`).join('\n')}
============================================================
      `.trim()
    };
  }
}

export const clinicalSafetyGovernanceEngine = new ClinicalSafetyGovernanceEngine();
export default clinicalSafetyGovernanceEngine;
