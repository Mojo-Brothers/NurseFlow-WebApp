/**
 * NURSEFLOW ENTERPRISE HIS — FHIR RECONCILIATION & RESOURCE LINK ENGINE
 * Manages Bidirectional Mapping between Internal Clinical Entities and SATUSEHAT Resource IDs.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';

export class FhirResourceLinkService {
  constructor() {
    this.COLLECTION_NAME = 'fhir_resource_links';
  }

  /**
   * Generate canonical link composite key
   */
  _buildKey(entityType, entityId, externalSystem = 'SATUSEHAT') {
    return `${externalSystem}_${entityType}_${entityId}`.toUpperCase();
  }

  /**
   * Save or update external resource link
   */
  async linkResource({
    internalEntityType,
    internalEntityId,
    externalResourceType,
    externalResourceId,
    externalSystem = 'SATUSEHAT',
    version = '1.0',
    status = 'SYNCED'
  }) {
    const key = this._buildKey(internalEntityType, internalEntityId, externalSystem);
    const linkRecord = {
      id: key,
      internal_entity_type: internalEntityType,
      internal_entity_id: internalEntityId,
      external_system: externalSystem,
      external_resource_type: externalResourceType,
      external_resource_id: externalResourceId,
      version: version,
      status: status,
      last_synced_at: new Date().toISOString()
    };

    await persistenceAdapter.save(this.COLLECTION_NAME, linkRecord.id, linkRecord);
    return linkRecord;
  }

  /**
   * Find external link by internal entity
   */
  async getLinkByInternalEntity(internalEntityType, internalEntityId, externalSystem = 'SATUSEHAT') {
    const key = this._buildKey(internalEntityType, internalEntityId, externalSystem);
    return await persistenceAdapter.findById(this.COLLECTION_NAME, key);
  }

  /**
   * Find internal entity by SATUSEHAT Resource ID
   */
  async getLinkByExternalResourceId(externalResourceId) {
    const links = await persistenceAdapter.query(this.COLLECTION_NAME, (link) => link.external_resource_id === externalResourceId);
    return links[0] || null;
  }

  /**
   * Retrieve all links for an encounter
   */
  async getAllLinks() {
    return await persistenceAdapter.query(this.COLLECTION_NAME);
  }
}

export const fhirResourceLink = new FhirResourceLinkService();
export default fhirResourceLink;
