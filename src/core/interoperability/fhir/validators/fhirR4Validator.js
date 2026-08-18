/**
 * NURSEFLOW ENTERPRISE HIS — FHIR R4 RESOURCE SCHEMA VALIDATOR
 * Pure validation engine for FHIR R4 Resources before transmission.
 */

export class FhirR4ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'FhirR4ValidationError';
    this.details = details;
  }
}

export const fhirR4Validator = {
  /**
   * Validate generic FHIR Resource structure
   */
  validateResource(resource) {
    const errors = [];

    if (!resource || typeof resource !== 'object') {
      throw new FhirR4ValidationError('FHIR Resource must be a non-null JSON object');
    }

    if (!resource.resourceType || typeof resource.resourceType !== 'string') {
      errors.push('Missing or invalid "resourceType"');
    }

    if (!resource.id && !resource.identifier) {
      errors.push(`Resource ${resource.resourceType || 'UNKNOWN'} must have either an "id" or "identifier"`);
    }

    // Specific resource type checks
    switch (resource.resourceType) {
      case 'Patient':
        if (!resource.name || !Array.isArray(resource.name) || resource.name.length === 0) {
          errors.push('Patient must have at least one name object');
        }
        if (!resource.gender) {
          errors.push('Patient must specify "gender"');
        }
        break;

      case 'Encounter':
        if (!resource.status) {
          errors.push('Encounter must specify "status"');
        }
        if (!resource.class || !resource.class.code) {
          errors.push('Encounter must specify "class.code"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('Encounter must have a valid "subject.reference" to Patient');
        }
        break;

      case 'Condition':
        if (!resource.clinicalStatus) {
          errors.push('Condition must specify "clinicalStatus"');
        }
        if (!resource.code || !resource.code.coding) {
          errors.push('Condition must specify "code.coding"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('Condition must have a valid "subject.reference"');
        }
        break;

      case 'Observation':
        if (!resource.status) {
          errors.push('Observation must specify "status"');
        }
        if (!resource.code || !resource.code.coding) {
          errors.push('Observation must specify "code.coding"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('Observation must have a valid "subject.reference"');
        }
        if (resource.valueQuantity === undefined && resource.valueString === undefined && !resource.component) {
          errors.push('Observation must specify a value or components');
        }
        break;

      case 'MedicationRequest':
        if (!resource.status) {
          errors.push('MedicationRequest must specify "status"');
        }
        if (!resource.intent) {
          errors.push('MedicationRequest must specify "intent"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('MedicationRequest must specify "subject.reference"');
        }
        break;

      case 'MedicationAdministration':
        if (!resource.status) {
          errors.push('MedicationAdministration must specify "status"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('MedicationAdministration must specify "subject.reference"');
        }
        if (!resource.effectiveDateTime && !resource.effectivePeriod) {
          errors.push('MedicationAdministration must specify administration timestamp');
        }
        break;

      case 'Procedure':
        if (!resource.status) {
          errors.push('Procedure must specify "status"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('Procedure must specify "subject.reference"');
        }
        break;

      case 'AllergyIntolerance':
        if (!resource.patient || !resource.patient.reference) {
          errors.push('AllergyIntolerance must specify "patient.reference"');
        }
        break;

      case 'Consent':
        if (!resource.status) {
          errors.push('Consent must specify "status"');
        }
        if (!resource.patient || !resource.patient.reference) {
          errors.push('Consent must specify "patient.reference"');
        }
        break;

      case 'DocumentReference':
        if (!resource.status) {
          errors.push('DocumentReference must specify "status"');
        }
        if (!resource.subject || !resource.subject.reference) {
          errors.push('DocumentReference must specify "subject.reference"');
        }
        break;

      default:
        break;
    }

    if (errors.length > 0) {
      throw new FhirR4ValidationError(
        `FHIR Validation Failed for ${resource.resourceType || 'Resource'}: ${errors.join(', ')}`,
        errors
      );
    }

    return { valid: true, resourceType: resource.resourceType };
  }
};
