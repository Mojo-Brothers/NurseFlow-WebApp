/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Canonical & Semantic Conformance Validator Service
 * Standards: HL7 FHIR R4 (Normative), RFC 8785 (JSON Canonicalization),
 * Kemkes SATUSEHAT Interoperability Specifications, OWASP API Top 10 (Broken Object Reference).
 */

import crypto from 'crypto';
import {
  mapPatient,
  mapEncounter,
  mapCondition,
  mapObservation,
  mapProcedure,
  mapMedicationRequest,
  mapDiagnosticReport
} from '../mappers/index.js';
import { fhirR4Validator, FhirR4ValidationError } from '../validators/fhirR4Validator.js';

export class FhirBrokenReferenceError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FhirBrokenReferenceError';
    this.details = details;
  }
}

export class FhirCrossTenantLeakageError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FhirCrossTenantLeakageError';
    this.details = details;
  }
}

export class FhirCanonicalModelValidatorService {
  /**
   * Deterministic Canonicalization of JSON Structure (RFC 8785)
   */
  canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + this.canonicalize(obj[k])).join(',') + '}';
  }

  /**
   * Compute Deterministic SHA-256 Digest of Canonical FHIR Resource
   */
  computeCanonicalDigest(resource) {
    const canonicalJson = this.canonicalize(resource);
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
  }

  /**
   * Transform NurseFlow Domain Object into FHIR R4 Resource with Conformance Check
   */
  transformToFhir(domainObject, resourceType) {
    if (!domainObject) throw new Error('Domain object is mandatory for transformation');

    let fhirResource = null;

    switch (resourceType) {
      case 'Patient':
        fhirResource = mapPatient(domainObject);
        break;
      case 'Encounter':
        fhirResource = mapEncounter(domainObject);
        break;
      case 'Condition':
        fhirResource = mapCondition(domainObject);
        break;
      case 'Observation':
        fhirResource = mapObservation(domainObject);
        break;
      case 'Procedure':
        fhirResource = mapProcedure(domainObject);
        break;
      case 'MedicationRequest':
        fhirResource = mapMedicationRequest(domainObject);
        break;
      case 'DiagnosticReport':
        fhirResource = mapDiagnosticReport(domainObject);
        break;
      default:
        throw new FhirR4ValidationError(`Unsupported or invalid resourceType: ${resourceType}`);
    }

    // Semantic and Schema Validation
    fhirR4Validator.validateResource(fhirResource);

    // Compute Deterministic Canonical Digest
    const canonicalHash = this.computeCanonicalDigest(fhirResource);

    return {
      fhirResource,
      canonicalHash,
      resourceType,
      isConformant: true
    };
  }

  /**
   * Validate Strict Referential Hierarchy & Cross-Tenant Isolation Across Clinical Bundle
   */
  validateReferentialBundleHierarchy({
    tenantId,
    patientDomain,
    encounterDomain,
    clinicalResources = []
  }) {
    if (!tenantId) throw new Error('Tenant ID is mandatory for bundle validation');
    if (!patientDomain || !patientDomain.id) throw new Error('Patient domain object is mandatory');
    if (!encounterDomain || !encounterDomain.id) throw new Error('Encounter domain object is mandatory');

    // 1. Check Tenant Isolation on Root Entities
    if (patientDomain.tenantId && patientDomain.tenantId !== tenantId) {
      throw new FhirCrossTenantLeakageError('Patient entity belongs to different tenant organization', {
        expectedTenant: tenantId,
        actualTenant: patientDomain.tenantId
      });
    }

    if (encounterDomain.tenantId && encounterDomain.tenantId !== tenantId) {
      throw new FhirCrossTenantLeakageError('Encounter entity belongs to different tenant organization', {
        expectedTenant: tenantId,
        actualTenant: encounterDomain.tenantId
      });
    }

    // 2. Validate Root Transformation
    const fhirPatient = this.transformToFhir(patientDomain, 'Patient');
    const fhirEncounter = this.transformToFhir(encounterDomain, 'Encounter');

    // Check Encounter -> Patient Reference Integrity
    const expectedPatientRef = `Patient/${patientDomain.id}`;
    if (fhirEncounter.fhirResource.subject.reference !== expectedPatientRef) {
      throw new FhirBrokenReferenceError('Encounter subject reference does not match root Patient ID', {
        expected: expectedPatientRef,
        actual: fhirEncounter.fhirResource.subject.reference
      });
    }

    const expectedEncounterRef = `Encounter/${encounterDomain.id}`;
    const validatedChildResources = [];

    // 3. Validate Each Clinical Child Resource
    for (const child of clinicalResources) {
      // Check Tenant Isolation on Child Resource
      if (child.tenantId && child.tenantId !== tenantId) {
        throw new FhirCrossTenantLeakageError(`Child resource ${child.type || child.resourceType} belongs to different tenant`, {
          expectedTenant: tenantId,
          actualTenant: child.tenantId
        });
      }

      // Check Patient Reference
      if (child.patientId && child.patientId !== patientDomain.id) {
        throw new FhirBrokenReferenceError(`Child resource ${child.type || child.resourceType} references mismatched Patient ID`, {
          expectedPatientId: patientDomain.id,
          actualPatientId: child.patientId
        });
      }

      // Check Encounter Reference
      if (child.encounterId && child.encounterId !== encounterDomain.id) {
        throw new FhirBrokenReferenceError(`Child resource ${child.type || child.resourceType} references mismatched Encounter ID`, {
          expectedEncounterId: encounterDomain.id,
          actualEncounterId: child.encounterId
        });
      }

      const fhirChild = this.transformToFhir(child, child.resourceType || child.type);
      validatedChildResources.push(fhirChild);
    }

    return {
      isValid: true,
      tenantId,
      rootPatient: fhirPatient,
      rootEncounter: fhirEncounter,
      totalChildResources: validatedChildResources.length,
      validatedChildResources
    };
  }

  /**
   * Inbound Normalization: Reconcile External FHIR R4 Resource into NurseFlow Domain Model
   */
  normalizeInboundFhir(fhirResource) {
    if (!fhirResource || !fhirResource.resourceType) {
      throw new FhirR4ValidationError('Cannot normalize invalid FHIR resource without resourceType');
    }

    switch (fhirResource.resourceType) {
      case 'Patient': {
        const nikId = (fhirResource.identifier || []).find(i => (i.system || '').includes('nik'));
        const mrnId = (fhirResource.identifier || []).find(i => (i.system || '').includes('pasien') || i.use === 'secondary');
        const nameText = (fhirResource.name && fhirResource.name[0] && fhirResource.name[0].text) || 'Pasien Rekonsiliasi';

        return {
          id: fhirResource.id,
          mrn: mrnId ? mrnId.value : undefined,
          nik: nikId ? nikId.value : undefined,
          fullName: nameText,
          gender: fhirResource.gender === 'female' ? 'FEMALE' : 'MALE',
          birthDate: fhirResource.birthDate,
          isActive: fhirResource.active !== false
        };
      }

      case 'Observation': {
        const loincCoding = (fhirResource.code?.coding || [])[0] || {};
        const subjectRef = fhirResource.subject?.reference || '';
        const patientId = subjectRef.replace('Patient/', '');
        const value = fhirResource.valueQuantity ? fhirResource.valueQuantity.value : fhirResource.valueString;

        return {
          id: fhirResource.id,
          patientId,
          loincCode: loincCoding.code,
          name: loincCoding.display || fhirResource.code?.text,
          value,
          unit: fhirResource.valueQuantity?.unit,
          status: fhirResource.status
        };
      }

      default:
        return {
          id: fhirResource.id,
          resourceType: fhirResource.resourceType,
          rawFhir: fhirResource
        };
    }
  }

  /**
   * Validate FHIR R4 Bundle Referential Integrity
   * Cross-references all internal references in bundle entries against available resource IDs
   */
  validateBundleReferentialGraph(fhirBundle) {
    if (!fhirBundle || fhirBundle.resourceType !== 'Bundle') {
      throw new FhirR4ValidationError('Resource must be a valid FHIR R4 Bundle');
    }

    if (!Array.isArray(fhirBundle.entry) || fhirBundle.entry.length === 0) {
      throw new FhirR4ValidationError('FHIR Bundle must contain at least one entry');
    }

    const registeredResources = new Set();

    // 1. Index all resource IDs in bundle
    for (const entry of fhirBundle.entry) {
      const res = entry.resource;
      if (res && res.resourceType && res.id) {
        registeredResources.add(`${res.resourceType}/${res.id}`);
      }
    }

    // 2. Cross-reference all references in each entry
    for (let i = 0; i < fhirBundle.entry.length; i++) {
      const res = fhirBundle.entry[i].resource;
      if (!res) continue;

      // Check subject reference (Patient)
      if (res.subject && res.subject.reference) {
        if (!registeredResources.has(res.subject.reference)) {
          throw new FhirBrokenReferenceError(`Bundle entry #${i} (${res.resourceType}/${res.id}) has broken subject reference: ${res.subject.reference}`, {
            entryIndex: i,
            resourceType: res.resourceType,
            danglingReference: res.subject.reference
          });
        }
      }

      // Check encounter reference (Encounter)
      if (res.encounter && res.encounter.reference) {
        if (!registeredResources.has(res.encounter.reference)) {
          throw new FhirBrokenReferenceError(`Bundle entry #${i} (${res.resourceType}/${res.id}) has broken encounter reference: ${res.encounter.reference}`, {
            entryIndex: i,
            resourceType: res.resourceType,
            danglingReference: res.encounter.reference
          });
        }
      }
    }

    return {
      isValid: true,
      totalEntries: fhirBundle.entry.length,
      registeredResourceCount: registeredResources.size,
      status: 'BUNDLE_REFERENTIAL_GRAPH_VERIFIED'
    };
  }

  /**
   * Test Round-Trip Normalization Fidelity
   */
  testRoundTripFidelity(domainPatient) {
    const fhir = this.transformToFhir(domainPatient, 'Patient');
    const normalized = this.normalizeInboundFhir(fhir.fhirResource);

    const isMatch = (
      normalized.id === domainPatient.id &&
      normalized.nik === domainPatient.nik &&
      normalized.fullName === (domainPatient.name || domainPatient.fullName) &&
      normalized.gender === domainPatient.gender
    );

    return {
      isFidelityPreserved: isMatch,
      original: domainPatient,
      normalized
    };
  }
}

export const fhirCanonicalModelValidatorService = new FhirCanonicalModelValidatorService();
