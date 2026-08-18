/**
 * NurseFlow Enterprise HIS 2026 — CDSS Domain Entities
 * Standards: JCI IPSG 3, Dynamic Relational Rule Engine & Medicolegal Replay Engine
 */

export class ClinicalRule {
  constructor({
    id,
    ruleCode,
    ruleVersion = 1,
    ruleType, // 'DRUG_ALLERGY' | 'DRUG_DRUG_INTERACTION' | 'DUPLICATE_THERAPY' | 'PEDIATRIC_DOSE' | 'RENAL_ADJUSTMENT' | 'SEPSIS_BUNDLE'
    severity, // 'FATAL_HARD_STOP' | 'CRITICAL_WARNING' | 'ADVISORY_INFO'
    alertTitle,
    alertMessage,
    clinicalRecommendation,
    primaryEntityCode,
    secondaryEntityCode = null,
    effectiveFrom = Date.now(),
    effectiveUntil = null,
    isActive = true,
    createdAt = Date.now(),
    updatedAt = Date.now()
  }) {
    this.id = id;
    this.ruleCode = ruleCode;
    this.ruleVersion = ruleVersion;
    this.ruleType = ruleType;
    this.severity = severity;
    this.alertTitle = alertTitle;
    this.alertMessage = alertMessage;
    this.clinicalRecommendation = clinicalRecommendation;
    this.primaryEntityCode = primaryEntityCode;
    this.secondaryEntityCode = secondaryEntityCode;
    this.effectiveFrom = effectiveFrom;
    this.effectiveUntil = effectiveUntil;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class ClinicalRuleCondition {
  constructor({
    id,
    ruleId,
    fieldName, // 'primary_atc', 'secondary_atc', 'latest_egfr', 'patient_age_years', 'dose_mg_per_kg'
    operator, // '<', '<=', '=', '>=', '>', '!=', 'IN', 'CONTAINS'
    comparisonValue,
    logicalOperator = 'AND',
    createdAt = Date.now()
  }) {
    this.id = id;
    this.ruleId = ruleId;
    this.fieldName = fieldName;
    this.operator = operator;
    this.comparisonValue = comparisonValue;
    this.logicalOperator = logicalOperator;
    this.createdAt = createdAt;
  }
}

export class CdssExecution {
  constructor({
    id,
    organizationId,
    encounterId,
    patientId,
    medicationId,
    executedRuleId,
    executedRuleVersion,
    evaluationResult, // 'PASSED' | 'WARNING_OVERRIDDEN' | 'HARD_STOPPED'
    overrideJustification = null,
    inputSnapshot, // Patient Age, Weight, eGFR, Active Meds, Allergies
    outputSnapshot, // Alerts triggered, severity, recommendations
    executedByPractitionerId,
    executedAt = Date.now()
  }) {
    this.id = id;
    this.organizationId = organizationId;
    this.encounterId = encounterId;
    this.patientId = patientId;
    this.medicationId = medicationId;
    this.executedRuleId = executedRuleId;
    this.executedRuleVersion = executedRuleVersion;
    this.evaluationResult = evaluationResult;
    this.overrideJustification = overrideJustification;
    this.inputSnapshot = inputSnapshot;
    this.outputSnapshot = outputSnapshot;
    this.executedByPractitionerId = executedByPractitionerId;
    this.executedAt = executedAt;
  }
}
