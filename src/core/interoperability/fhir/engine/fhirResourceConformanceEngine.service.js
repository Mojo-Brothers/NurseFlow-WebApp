/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Multi-Layer Resource Conformance Engine
 * Standards: HL7 FHIR R4 (Normative), Kemkes SATUSEHAT Profile Specifications,
 * Terminology Validation (ICD-10, ICD-9-CM, LOINC, KFA, UCUM), Semantic & Temporal Invariants.
 * 
 * Philosophy: FHIR-Valid != SATUSEHAT-Valid != Clinically-Valid.
 * Output: Machine-Readable, Deterministic, Explainable Diagnostic Conformance Output.
 */

import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../profiles/kemkesProfiles.js';
import { terminologyGateway } from '../validators/terminologyGateway.service.js';

export class FhirResourceConformanceEngineService {
  /**
   * Deep Multi-Layer Conformance Validation for any of the 7 Core Resources
   */
  evaluateResourceConformance(resource) {
    const issues = {
      errors: [],
      warnings: [],
      information: []
    };

    const layerStatus = {
      L1_STRUCTURAL: { passed: true, issues: [] },
      L2_PROFILE: { passed: true, issues: [] },
      L3_TERMINOLOGY: { passed: true, issues: [] },
      L4_REFERENTIAL: { passed: true, issues: [] },
      L5_SEMANTIC: { passed: true, issues: [] }
    };

    const addIssue = (layer, severity, code, path, message, profile = null) => {
      const issue = {
        layer,
        severity,
        code,
        path,
        resourceType: resource?.resourceType || 'Unknown',
        profile: profile || this._getDefaultProfile(resource?.resourceType),
        message
      };

      if (severity === 'error') {
        issues.errors.push(issue);
        layerStatus[layer].passed = false;
      } else if (severity === 'warning') {
        issues.warnings.push(issue);
      } else {
        issues.information.push(issue);
      }
      layerStatus[layer].issues.push(issue);
    };

    // ------------------------------------------------------------------------
    // LAYER 1: STRUCTURAL VALIDATION (Datatype, Cardinality, Required Fields)
    // ------------------------------------------------------------------------
    this._validateL1Structural(resource, addIssue);

    // ------------------------------------------------------------------------
    // LAYER 2: KEMKES PROFILE CONFORMANCE (Meta.profile, Slicing, Must Support)
    // ------------------------------------------------------------------------
    this._validateL2Profile(resource, addIssue);

    // ------------------------------------------------------------------------
    // LAYER 3: TERMINOLOGY CONFORMANCE (CodeSystem, ValueSet, UCUM Units)
    // ------------------------------------------------------------------------
    this._validateL3Terminology(resource, addIssue);

    // ------------------------------------------------------------------------
    // LAYER 4: REFERENTIAL INTEGRITY (URI Schemes, Reference Syntax)
    // ------------------------------------------------------------------------
    this._validateL4Referential(resource, addIssue);

    // ------------------------------------------------------------------------
    // LAYER 5: SEMANTIC & TEMPORAL INVARIANTS (Clinical Consistency, Ranges)
    // ------------------------------------------------------------------------
    this._validateL5Semantic(resource, addIssue);

    const isConformant = issues.errors.length === 0;
    let decision = 'CONFORMANT';
    if (!isConformant) {
      decision = 'REJECTED';
    } else if (issues.warnings.length > 0) {
      decision = 'CONFORMANT_WITH_WARNINGS';
    }

    return {
      isConformant,
      decision,
      resourceType: resource?.resourceType || 'Unknown',
      resourceId: resource?.id || null,
      totalErrors: issues.errors.length,
      totalWarnings: issues.warnings.length,
      layerStatus,
      errors: issues.errors,
      warnings: issues.warnings,
      information: issues.information
    };
  }

  // ==========================================================================
  // LAYER 1: STRUCTURAL VALIDATION
  // ==========================================================================
  _validateL1Structural(res, addIssue) {
    if (!res || typeof res !== 'object') {
      addIssue('L1_STRUCTURAL', 'error', 'invalid-structure', 'Resource', 'Resource must be a non-null JSON object');
      return;
    }

    if (!res.resourceType) {
      addIssue('L1_STRUCTURAL', 'error', 'required', 'Resource.resourceType', 'Missing mandatory resourceType field');
      return;
    }

    if (!res.id) {
      addIssue('L1_STRUCTURAL', 'error', 'required', `${res.resourceType}.id`, 'Missing mandatory resource logical ID');
    }

    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

    switch (res.resourceType) {
      case 'Patient':
        if (!Array.isArray(res.identifier) || res.identifier.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Patient.identifier', 'Patient must contain at least one identifier');
        }
        if (!res.gender || !['male', 'female', 'other', 'unknown'].includes(res.gender)) {
          addIssue('L1_STRUCTURAL', 'error', 'invalid-code', 'Patient.gender', 'Patient gender must be one of: male, female, other, unknown');
        }
        if (res.birthDate && !ISO_DATE_REGEX.test(res.birthDate)) {
          addIssue('L1_STRUCTURAL', 'error', 'invalid-format', 'Patient.birthDate', 'birthDate must follow YYYY-MM-DD format');
        }
        break;

      case 'Encounter':
        if (!res.status) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Encounter.status', 'Missing mandatory encounter status');
        }
        if (!res.class || !res.class.code) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Encounter.class', 'Missing mandatory encounter class coding');
        }
        if (res.period) {
          if (res.period.start && !ISO_DATETIME_REGEX.test(res.period.start) && !ISO_DATE_REGEX.test(res.period.start)) {
            addIssue('L1_STRUCTURAL', 'error', 'invalid-format', 'Encounter.period.start', 'period.start must be valid ISO timestamp');
          }
        }
        break;

      case 'Condition':
        if (!res.clinicalStatus) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Condition.clinicalStatus', 'Condition must specify clinicalStatus');
        }
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Condition.code', 'Condition must specify at least one diagnosis code.coding');
        }
        break;

      case 'Observation':
        if (!res.status) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Observation.status', 'Missing mandatory observation status');
        }
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Observation.code', 'Missing mandatory observation code.coding');
        }
        if (res.valueQuantity) {
          if (typeof res.valueQuantity.value !== 'number') {
            addIssue('L1_STRUCTURAL', 'error', 'invalid-datatype', 'Observation.valueQuantity.value', 'valueQuantity.value must be numeric');
          }
        }
        break;

      case 'Procedure':
        if (!res.status) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Procedure.status', 'Missing mandatory procedure status');
        }
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'Procedure.code', 'Missing mandatory procedure code.coding');
        }
        break;

      case 'MedicationRequest':
        if (!res.status) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'MedicationRequest.status', 'Missing mandatory medication request status');
        }
        if (!res.intent) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'MedicationRequest.intent', 'Missing mandatory medication request intent');
        }
        if (!res.medicationCodeableConcept || !Array.isArray(res.medicationCodeableConcept.coding) || res.medicationCodeableConcept.coding.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'MedicationRequest.medicationCodeableConcept', 'Missing mandatory medication coding');
        }
        break;

      case 'DiagnosticReport':
        if (!res.status) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'DiagnosticReport.status', 'Missing mandatory diagnostic report status');
        }
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          addIssue('L1_STRUCTURAL', 'error', 'required', 'DiagnosticReport.code', 'Missing mandatory diagnostic report code');
        }
        break;

      default:
        addIssue('L1_STRUCTURAL', 'error', 'unsupported-resource', 'Resource.resourceType', `Unsupported resource type: ${res.resourceType}`);
        break;
    }
  }

  // ==========================================================================
  // LAYER 2: KEMKES PROFILE CONFORMANCE
  // ==========================================================================
  _validateL2Profile(res, addIssue) {
    if (!res || !res.resourceType) return;

    const expectedProfile = this._getDefaultProfile(res.resourceType);

    if (!res.meta || !Array.isArray(res.meta.profile) || res.meta.profile.length === 0) {
      addIssue('L2_PROFILE', 'error', 'missing-profile', `${res.resourceType}.meta.profile`, `Resource must declare meta.profile pointing to ${expectedProfile}`);
    } else {
      const hasKemkesProfile = res.meta.profile.some(p => p.includes('fhir.kemkes.go.id'));
      if (!hasKemkesProfile) {
        addIssue('L2_PROFILE', 'error', 'unsupported-profile', `${res.resourceType}.meta.profile`, `meta.profile does not contain standard Kemkes StructureDefinition URL`);
      }
    }

    // Patient Slicing & Must Support Checks
    if (res.resourceType === 'Patient') {
      const hasNik = (res.identifier || []).some(i => i.system === KEMKES_SYSTEMS.NIK && i.value && i.value.length === 16);
      if (!hasNik) {
        addIssue('L2_PROFILE', 'error', 'slicing-violation', 'Patient.identifier:nik', 'Kemkes Patient profile mandates valid 16-digit NIK identifier (system: https://fhir.kemkes.go.id/id/nik)');
      }
    }

    // Encounter Class Slicing Checks
    if (res.resourceType === 'Encounter') {
      const VALID_CLASSES = new Set(['AMB', 'IMP', 'EMER', 'HH', 'SS', 'OBSENC']);
      if (res.class && res.class.code && !VALID_CLASSES.has(res.class.code)) {
        addIssue('L2_PROFILE', 'error', 'invalid-class', 'Encounter.class.code', `Encounter class code "${res.class.code}" is not in Kemkes allowed encounter classes`);
      }
    }
  }

  // ==========================================================================
  // LAYER 3: TERMINOLOGY CONFORMANCE
  // ==========================================================================
  _validateL3Terminology(res, addIssue) {
    if (!res || !res.resourceType) return;

    try {
      if (res.resourceType === 'Condition' && res.code?.coding) {
        for (const coding of res.code.coding) {
          if (coding.system === KEMKES_SYSTEMS.ICD10) {
            terminologyGateway.validateICD10(coding.code);
          }
        }
      }

      if (res.resourceType === 'Observation') {
        if (res.code?.coding) {
          for (const coding of res.code.coding) {
            if (coding.system === KEMKES_SYSTEMS.LOINC) {
              terminologyGateway.validateLOINC(coding.code);
            }
          }
        }
        if (res.valueQuantity?.unit) {
          terminologyGateway.validateUCUM(res.valueQuantity.unit);
        }
      }

      if (res.resourceType === 'Procedure' && res.code?.coding) {
        for (const coding of res.code.coding) {
          if (coding.system === KEMKES_SYSTEMS.ICD9CM) {
            terminologyGateway.validateICD9CM(coding.code);
          }
        }
      }

      if (res.resourceType === 'MedicationRequest' && res.medicationCodeableConcept?.coding) {
        for (const coding of res.medicationCodeableConcept.coding) {
          if (coding.system === KEMKES_SYSTEMS.KFA) {
            terminologyGateway.validateKFA(coding.code);
          }
        }
      }

      if (res.resourceType === 'DiagnosticReport' && res.code?.coding) {
        for (const coding of res.code.coding) {
          if (coding.system === KEMKES_SYSTEMS.LOINC) {
            terminologyGateway.validateLOINC(coding.code);
          }
        }
      }
    } catch (termErr) {
      addIssue('L3_TERMINOLOGY', 'error', 'invalid-terminology', `${res.resourceType}.code`, termErr.message);
    }
  }

  // ==========================================================================
  // LAYER 4: REFERENTIAL INTEGRITY
  // ==========================================================================
  _validateL4Referential(res, addIssue) {
    if (!res || !res.resourceType) return;

    const REF_URI_REGEX = /^[A-Z][a-zA-Z]+\/[A-Za-z0-9\-_.]+$/;

    const checkReference = (refObj, path, requiredPrefix = null) => {
      if (!refObj || !refObj.reference) {
        addIssue('L4_REFERENTIAL', 'error', 'missing-reference', path, `Reference object at "${path}" must contain a non-empty "reference" string`);
        return;
      }

      const refStr = refObj.reference;
      if (!REF_URI_REGEX.test(refStr)) {
        addIssue('L4_REFERENTIAL', 'error', 'invalid-reference-format', path, `Reference "${refStr}" does not match canonical format "<ResourceType>/<id>"`);
        return;
      }

      if (requiredPrefix && !refStr.startsWith(`${requiredPrefix}/`)) {
        addIssue('L4_REFERENTIAL', 'error', 'reference-target-mismatch', path, `Reference "${refStr}" must point to a "${requiredPrefix}" target type`);
      }
    };

    if (res.resourceType === 'Encounter') {
      checkReference(res.subject, 'Encounter.subject', 'Patient');
    }

    if (['Condition', 'Observation', 'Procedure', 'MedicationRequest', 'DiagnosticReport'].includes(res.resourceType)) {
      checkReference(res.subject, `${res.resourceType}.subject`, 'Patient');
      if (res.encounter) {
        checkReference(res.encounter, `${res.resourceType}.encounter`, 'Encounter');
      }
    }
  }

  // ==========================================================================
  // LAYER 5: SEMANTIC & TEMPORAL INVARIANTS
  // ==========================================================================
  _validateL5Semantic(res, addIssue) {
    if (!res || !res.resourceType) return;

    const now = Date.now();

    // Temporal Invariants
    if (res.resourceType === 'Encounter' && res.period) {
      if (res.period.start && res.period.end) {
        const tStart = new Date(res.period.start).getTime();
        const tEnd = new Date(res.period.end).getTime();

        if (tEnd < tStart) {
          addIssue('L5_SEMANTIC', 'error', 'temporal-inversion', 'Encounter.period', `Encounter period.end (${res.period.end}) cannot precede period.start (${res.period.start})`);
        }
      }
    }

    // Observation Clinical Ranges
    if (res.resourceType === 'Observation') {
      if (res.effectiveDateTime) {
        const tObs = new Date(res.effectiveDateTime).getTime();
        // Allow up to 5 minutes future clock skew
        if (tObs > now + 300000) {
          addIssue('L5_SEMANTIC', 'error', 'future-observation-time', 'Observation.effectiveDateTime', `Observation effectiveDateTime (${res.effectiveDateTime}) is in the future`);
        }
      }

      if (res.valueQuantity && typeof res.valueQuantity.value === 'number') {
        const val = res.valueQuantity.value;
        const loincCode = (res.code?.coding || [])[0]?.code;

        // Heart Rate Range: 20 - 260 bpm
        if (loincCode === '8867-4' && (val < 20 || val > 260)) {
          addIssue('L5_SEMANTIC', 'warning', 'clinical-range-outlier', 'Observation.valueQuantity.value', `Heart Rate value (${val} bpm) is outside plausible physiological range (20-260 bpm)`);
        }

        // Body Temperature Range: 30 - 45 C
        if (loincCode === '8310-5' && (val < 30 || val > 45)) {
          addIssue('L5_SEMANTIC', 'warning', 'clinical-range-outlier', 'Observation.valueQuantity.value', `Temperature value (${val} C) is outside plausible physiological range (30-45 C)`);
        }
      }
    }
  }

  _getDefaultProfile(resourceType) {
    switch (resourceType) {
      case 'Patient': return KEMKES_PROFILES.PATIENT;
      case 'Encounter': return KEMKES_PROFILES.ENCOUNTER;
      case 'Condition': return KEMKES_PROFILES.CONDITION;
      case 'Observation': return KEMKES_PROFILES.OBSERVATION;
      case 'Procedure': return KEMKES_PROFILES.PROCEDURE;
      case 'MedicationRequest': return KEMKES_PROFILES.MEDICATION_REQUEST;
      case 'DiagnosticReport': return KEMKES_PROFILES.DIAGNOSTIC_REPORT;
      default: return 'https://fhir.kemkes.go.id/r4/StructureDefinition/Resource';
    }
  }
}

export const fhirResourceConformanceEngineService = new FhirResourceConformanceEngineService();
