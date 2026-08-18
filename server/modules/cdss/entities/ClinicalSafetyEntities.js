/**
 * NurseFlow Enterprise HIS 2026 — CDSS Clinical Production Safety Entities (Sprint 2.1)
 * Standards: JCI MCI, KDIGO 2024, WHO Pediatric Formulary, Lexicomp 2026
 */

export class ClinicalRuleGovernance {
  constructor({
    id,
    ruleId,
    ruleCode,
    ruleVersion,
    evidenceSource, // 'Lexicomp 2026', 'KDIGO 2024', 'WHO Model Formulary', 'FDA Black Box'
    evidenceVersion,
    evidenceReferenceUrl,
    authorPractitionerId,
    clinicalReviewerId,
    approvedByCommitteeId = 'KFT-COMMITTEE-01',
    approvalStatus = 'APPROVED',
    approvedAt = Date.now(),
    changeJustification,
    createdAt = Date.now()
  }) {
    this.id = id;
    this.ruleId = ruleId;
    this.ruleCode = ruleCode;
    this.ruleVersion = ruleVersion;
    this.evidenceSource = evidenceSource;
    this.evidenceVersion = evidenceVersion;
    this.evidenceReferenceUrl = evidenceReferenceUrl;
    this.authorPractitionerId = authorPractitionerId;
    this.clinicalReviewerId = clinicalReviewerId;
    this.approvedByCommitteeId = approvedByCommitteeId;
    this.approvalStatus = approvalStatus;
    this.approvedAt = approvedAt;
    this.changeJustification = changeJustification;
    this.createdAt = createdAt;
  }
}

export class MultiDrugInteractionCluster {
  constructor({
    id,
    clusterCode,
    clusterName,
    participatingClasses, // Array of class codes, e.g. ['ANTICOAGULANT', 'ANTIPLATELET', 'NSAID']
    minMatchingDrugs = 2,
    severity = 'CRITICAL_HIGH', // 'FATAL_HARD_STOP' | 'CRITICAL_HIGH' | 'MODERATE'
    clinicalSynergyMechanism,
    clinicalRiskEffect,
    mandatoryAction,
    isActive = true,
    createdAt = Date.now()
  }) {
    this.id = id;
    this.clusterCode = clusterCode;
    this.clusterName = clusterName;
    this.participatingClasses = participatingClasses;
    this.minMatchingDrugs = minMatchingDrugs;
    this.severity = severity;
    this.clinicalSynergyMechanism = clinicalSynergyMechanism;
    this.clinicalRiskEffect = clinicalRiskEffect;
    this.mandatoryAction = mandatoryAction;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}

export class RenalLabSnapshot {
  constructor({
    value,
    unit = 'mL/min/1.73m²',
    measurementTime = Date.now(),
    source = 'LIS_AUTOMATED',
    formula = 'CKD-EPI 2021',
    serumCreatinineMgDl = null,
    patientAge,
    patientSex
  }) {
    this.value = value;
    this.unit = unit;
    this.measurementTime = measurementTime;
    this.source = source;
    this.formula = formula;
    this.serumCreatinineMgDl = serumCreatinineMgDl;
    this.patientAge = patientAge;
    this.patientSex = patientSex;
  }
}

export class PediatricDosingProfile {
  constructor({
    ageYears,
    ageMonths = null,
    isNeonate = false,
    weightKg,
    heightCm = null,
    bodySurfaceAreaM2 = null,
    dosePerAdministrationMg,
    frequencyPerDay = 1,
    totalDailyDoseMg = null
  }) {
    this.ageYears = ageYears;
    this.ageMonths = ageMonths ?? (ageYears * 12);
    this.isNeonate = isNeonate;
    this.weightKg = weightKg;
    this.heightCm = heightCm;
    // Mosteller BSA formula: sqrt((height * weight) / 3600)
    this.bodySurfaceAreaM2 = bodySurfaceAreaM2 ?? (heightCm && weightKg ? Math.sqrt((heightCm * weightKg) / 3600) : null);
    this.dosePerAdministrationMg = dosePerAdministrationMg;
    this.frequencyPerDay = frequencyPerDay;
    this.totalDailyDoseMg = totalDailyDoseMg ?? (dosePerAdministrationMg * frequencyPerDay);
  }
}

export class ImmutableCdssExecutionLedger {
  constructor({
    id,
    executionId,
    organizationId,
    encounterId,
    patientId,
    medicationId,
    engineSemanticVersion = '2.1.0',
    terminologyReleaseVersion = 'SNOMED_2026-03_RXNORM_2026',
    appliedRulesSnapshot,
    patientClinicalSnapshot,
    evaluatedAlerts,
    decisionOutcome, // 'PASSED' | 'WARNING_OVERRIDDEN' | 'HARD_STOP_OVERRIDDEN' | 'HARD_STOPPED_BLOCKED'
    overrideReason = null,
    overrideAuthorizedBy = null,
    overrideDigitalSignatureHash = null,
    cryptographicHash,
    previousHash = null,
    executedAt = Date.now()
  }) {
    this.id = id;
    this.executionId = executionId;
    this.organizationId = organizationId;
    this.encounterId = encounterId;
    this.patientId = patientId;
    this.medicationId = medicationId;
    this.engineSemanticVersion = engineSemanticVersion;
    this.terminologyReleaseVersion = terminologyReleaseVersion;
    this.appliedRulesSnapshot = appliedRulesSnapshot;
    this.patientClinicalSnapshot = patientClinicalSnapshot;
    this.evaluatedAlerts = evaluatedAlerts;
    this.decisionOutcome = decisionOutcome;
    this.overrideReason = overrideReason;
    this.overrideAuthorizedBy = overrideAuthorizedBy;
    this.overrideDigitalSignatureHash = overrideDigitalSignatureHash;
    this.cryptographicHash = cryptographicHash;
    this.previousHash = previousHash;
    this.executedAt = executedAt;
  }
}
