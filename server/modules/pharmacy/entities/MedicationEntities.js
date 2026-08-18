/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy Domain Entities
 * Standards: ATC WHO, RxNorm, SNOMED CT, JCI IPSG 3, FHIR Medication & AllergyIntolerance
 */

export class Medication {
  constructor({
    id,
    genericName,
    brandName,
    atcCode,
    rxnormCode = null,
    kfaCode = null,
    dosageForm,
    strengthAmount,
    strengthUnit,
    drugClassCode,
    isHighAlert = false,
    isLasa = false,
    isNarcotic = false,
    pregnancyCategory = 'B',
    renalAdjustmentThresholdEgfr = null,
    pediatricMaxMgPerKg = null,
    recordStatus = 'ACTIVE',
    statusReason = null,
    version = 1,
    createdAt = Date.now(),
    updatedAt = Date.now()
  }) {
    this.id = id;
    this.genericName = genericName;
    this.brandName = brandName;
    this.atcCode = atcCode;
    this.rxnormCode = rxnormCode;
    this.kfaCode = kfaCode;
    this.dosageForm = dosageForm;
    this.strengthAmount = strengthAmount;
    this.strengthUnit = strengthUnit;
    this.drugClassCode = drugClassCode;
    this.isHighAlert = isHighAlert;
    this.isLasa = isLasa;
    this.isNarcotic = isNarcotic;
    this.pregnancyCategory = pregnancyCategory;
    this.renalAdjustmentThresholdEgfr = renalAdjustmentThresholdEgfr;
    this.pediatricMaxMgPerKg = pediatricMaxMgPerKg;
    this.recordStatus = recordStatus;
    this.statusReason = statusReason;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class MedicationClass {
  constructor({ id, classCode, className, description, isActive = true, createdAt = Date.now(), updatedAt = Date.now() }) {
    this.id = id;
    this.classCode = classCode;
    this.className = className;
    this.description = description;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class MedicationIngredient {
  constructor({ id, medicationId, activeIngredientName, strengthAmount, strengthUnit, createdAt = Date.now() }) {
    this.id = id;
    this.medicationId = medicationId;
    this.activeIngredientName = activeIngredientName;
    this.strengthAmount = strengthAmount;
    this.strengthUnit = strengthUnit;
    this.createdAt = createdAt;
  }
}

export class MedicationTerminology {
  constructor({ id, medicationId, terminologySystem, terminologyCode, terminologyDisplay, createdAt = Date.now() }) {
    this.id = id;
    this.medicationId = medicationId;
    this.terminologySystem = terminologySystem; // 'SNOMED_CT' | 'RXNORM' | 'ATC' | 'UNII' | 'NDC' | 'GTIN_BARCODE' | 'KFA_KEMENKES'
    this.terminologyCode = terminologyCode;
    this.terminologyDisplay = terminologyDisplay;
    this.createdAt = createdAt;
  }
}

export class MedicationInteraction {
  constructor({
    id,
    drugAId,
    drugBId,
    severity, // 'FATAL_HARD_STOP' | 'CRITICAL_HIGH' | 'MODERATE' | 'MINOR'
    clinicalMechanism,
    clinicalEffect,
    managementRecommendation,
    evidenceSource = 'Lexicomp / FDA 2026',
    isActive = true,
    createdAt = Date.now(),
    updatedAt = Date.now()
  }) {
    this.id = id;
    this.drugAId = drugAId;
    this.drugBId = drugBId;
    this.severity = severity;
    this.clinicalMechanism = clinicalMechanism;
    this.clinicalEffect = clinicalEffect;
    this.managementRecommendation = managementRecommendation;
    this.evidenceSource = evidenceSource;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class PatientAllergy {
  constructor({
    id,
    organizationId,
    patientId,
    allergenType, // 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'LATEX'
    allergenCode,
    allergenName,
    reactionDescription,
    severity, // 'MILD' | 'MODERATE' | 'SEVERE_ANAPHYLAXIS'
    verificationStatus = 'CONFIRMED', // 'SUSPECTED' | 'CONFIRMED' | 'REFUTED'
    recordedByPractitionerId,
    recordedAt = Date.now(),
    recordStatus = 'ACTIVE', // 'ACTIVE' | 'AMENDED' | 'VOIDED' | 'ARCHIVED'
    statusReason = null,
    parentAllergyId = null,
    version = 1,
    createdAt = Date.now(),
    updatedAt = Date.now()
  }) {
    this.id = id;
    this.organizationId = organizationId;
    this.patientId = patientId;
    this.allergenType = allergenType;
    this.allergenCode = allergenCode;
    this.allergenName = allergenName;
    this.reactionDescription = reactionDescription;
    this.severity = severity;
    this.verificationStatus = verificationStatus;
    this.recordedByPractitionerId = recordedByPractitionerId;
    this.recordedAt = recordedAt;
    this.recordStatus = recordStatus;
    this.statusReason = statusReason;
    this.parentAllergyId = parentAllergyId;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class HospitalFormulary {
  constructor({
    id,
    organizationId,
    drugId,
    isActive = true,
    formularyTier = 'FORMULARIUM_RS', // 'GENERIK_NASIONAL' | 'FORMULARIUM_RS' | 'RESTRICTED_ANTIBIOTIC' | 'NON_FORMULARIUM'
    approvalLevelRequired = 'NONE', // 'NONE' | 'DPJP_ONLY' | 'KFT_APPROVAL_REQUIRED' | 'INFECTIOUS_DISEASE_CONSULTANT'
    restrictedDepartmentId = null,
    requiresPharmacistApproval = false,
    maxPrescribingDays = 30,
    dailyDefinedDoseUnit = null,
    clinicalStewardshipGuideline = null,
    recordStatus = 'ACTIVE',
    version = 1,
    createdAt = Date.now(),
    updatedAt = Date.now()
  }) {
    this.id = id;
    this.organizationId = organizationId;
    this.drugId = drugId;
    this.isActive = isActive;
    this.formularyTier = formularyTier;
    this.approvalLevelRequired = approvalLevelRequired;
    this.restrictedDepartmentId = restrictedDepartmentId;
    this.requiresPharmacistApproval = requiresPharmacistApproval;
    this.maxPrescribingDays = maxPrescribingDays;
    this.dailyDefinedDoseUnit = dailyDefinedDoseUnit;
    this.clinicalStewardshipGuideline = clinicalStewardshipGuideline;
    this.recordStatus = recordStatus;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
