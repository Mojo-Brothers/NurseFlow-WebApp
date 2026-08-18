/**
 * NURSEFLOW ENTERPRISE HIS — FHIR REFERENCE RESOLUTION ENGINE
 * Resolves Internal Canonical Identifiers into External SATUSEHAT Resource References.
 * Guarantees that Outbound FHIR Payloads use verified external SATUSEHAT resource IDs
 * when existing links are available.
 */

import { fhirResourceLink } from '../../satusehat/reconciliation/fhirResourceLink.service.js';

export class FhirReferenceResolverService {
  /**
   * Resolve an internal entity to a standard FHIR reference string.
   * e.g. resolves ('Patient', 'PAT-001') -> 'Patient/SAT-PAT-12345' (if linked) or 'Patient/PAT-001'
   */
  async resolveReference(entityType, internalId, defaultDisplay = '') {
    if (!internalId) return undefined;

    const link = await fhirResourceLink.getLinkByInternalEntity(entityType, internalId);
    const targetId = (link && link.external_resource_id) ? link.external_resource_id : internalId;

    const reference = {
      reference: `${entityType}/${targetId}`
    };

    if (defaultDisplay) {
      reference.display = defaultDisplay;
    }

    return reference;
  }

  /**
   * Resolve Subject (Patient) reference
   */
  async resolveSubject(patientId, patientName = '') {
    return await this.resolveReference('Patient', patientId, patientName);
  }

  /**
   * Resolve Encounter reference
   */
  async resolveEncounter(encounterId) {
    return await this.resolveReference('Encounter', encounterId);
  }

  /**
   * Resolve Practitioner (DPJP / Attender / Nurse) reference
   */
  async resolvePractitioner(practitionerId, practitionerName = '') {
    return await this.resolveReference('Practitioner', practitionerId, practitionerName);
  }

  /**
   * Resolve Location (Bed / Room) reference
   */
  async resolveLocation(locationId, locationDisplay = '') {
    return await this.resolveReference('Location', locationId, locationDisplay);
  }

  /**
   * Resolve MedicationRequest / Prescription reference
   */
  async resolveMedicationRequest(orderId) {
    return await this.resolveReference('MedicationRequest', orderId);
  }
}

export const fhirReferenceResolver = new FhirReferenceResolverService();
export default fhirReferenceResolver;
