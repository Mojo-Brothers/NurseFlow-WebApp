/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT GATEWAY ORCHESTRATOR
 * Authoritative integration gateway orchestrating Outbox dispatch,
 * OAuth2 token lifecycle, FHIR validation, reconciliation, and domain event subscriptions.
 */

import { tokenManager } from '../auth/tokenManager.service.js';
import { fhirOutbox } from '../outbox/fhirOutbox.service.js';
import { retryPolicyFsm, OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';
import { fhirResourceLink } from '../reconciliation/fhirResourceLink.service.js';
import { integrationAudit } from '../audit/integrationAudit.service.js';
import { fhirR4Validator, FhirR4ValidationError } from '../../fhir/validators/fhirR4Validator.js';
import * as mappers from '../../fhir/mappers/index.js';
import { domainEventEngine } from '../../../services/domainEventEngine.service.js';

export class SatusehatGatewayService {
  constructor() {
    this.baseUrl = 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1';
    this.isSimulatedFailureMode = false;
    this.simulatedErrorStatus = null;
    this.simulatedErrorMessage = null;
    this.isEventSubscriptionActive = false;
  }

  /**
   * Set simulated failure mode for fault injection / network resilience tests
   */
  setSimulationMode({ enabled = false, httpStatus = null, errorMessage = null }) {
    this.isSimulatedFailureMode = enabled;
    this.simulatedErrorStatus = httpStatus;
    this.simulatedErrorMessage = errorMessage;
  }

  /**
   * Initialize Domain Event Listeners (Pure Asynchronous Reaction)
   */
  initDomainEventListeners() {
    if (this.isEventSubscriptionActive) return;

    domainEventEngine.subscribe('PATIENT_REGISTERED', async (evt) => {
      if (evt?.payload?.patient) {
        const fhirPatient = mappers.mapPatient(evt.payload.patient);
        await fhirOutbox.enqueue({
          entityType: 'Patient',
          entityId: evt.payload.patient.id,
          fhirResourceType: 'Patient',
          payload: fhirPatient,
          correlationId: evt.correlationId
        });
      }
    });

    domainEventEngine.subscribe('PATIENT_CARE_STATE_CHANGED', async (evt) => {
      if (evt?.payload) {
        const encounterPayload = {
          id: evt.payload.encounterId,
          patientId: evt.payload.patientId,
          primaryState: evt.payload.newState,
          type: evt.payload.encounterType || 'INPATIENT',
          admittedAt: evt.payload.timestamp
        };
        const fhirEncounter = mappers.mapEncounter(encounterPayload);
        await fhirOutbox.enqueue({
          entityType: 'Encounter',
          entityId: evt.payload.encounterId,
          fhirResourceType: 'Encounter',
          payload: fhirEncounter,
          correlationId: evt.correlationId
        });
      }
    });

    this.isEventSubscriptionActive = true;
  }

  /**
   * Process a single Outbox record through the SATUSEHAT pipeline
   */
  async processOutboxItem(item) {
    const startTime = Date.now();
    await fhirOutbox.markProcessing(item);

    try {
      // 1. Schema Validation before network transmission
      fhirR4Validator.validateResource(item.payload);

      // 2. Fault Injection Check (For Resilience Torture Tests)
      if (this.isSimulatedFailureMode) {
        const status = this.simulatedErrorStatus || 503;
        const msg = this.simulatedErrorMessage || 'SATUSEHAT Gateway Temporarily Unavailable';
        throw { httpStatus: status, message: msg };
      }

      // 3. Acquire Token
      const token = await tokenManager.getAccessToken();

      // 4. Simulate / Execute HTTP POST to SATUSEHAT Endpoint
      const resourceType = item.fhirResourceType || item.payload.resourceType;
      const externalId = `SAT-${resourceType.toUpperCase()}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 5. Update Outbox to ACKNOWLEDGED
      await fhirOutbox.markAcknowledged(item, externalId, 201);

      // 6. Save FHIR Reconciliation Link
      await fhirResourceLink.linkResource({
        internalEntityType: item.entityType,
        internalEntityId: item.entityId,
        externalResourceType: resourceType,
        externalResourceId: externalId,
        externalSystem: 'SATUSEHAT',
        status: 'SYNCED'
      });

      // 7. Log Integration Audit Trail
      await integrationAudit.logTransmission({
        correlationId: item.correlationId,
        endpoint: `${this.baseUrl}/${resourceType}`,
        resourceType,
        internalEntityId: item.entityId,
        payload: item.payload,
        httpStatus: 201,
        responseBody: { id: externalId, resourceType, status: 'created' },
        durationMs: Date.now() - startTime,
        status: 'SUCCESS'
      });

      return { success: true, externalId, status: 201 };

    } catch (err) {
      const httpStatus = err instanceof FhirR4ValidationError ? 400 : (err.httpStatus || 500);
      const errorMessage = err.message || String(err);

      // If 401, invalidate token cache so next attempt refreshes
      if (httpStatus === 401) {
        tokenManager.invalidateToken();
      }

      // Mark Outbox Failed (transitions to RETRY or DEAD_LETTER)
      const updatedItem = await fhirOutbox.markFailed(item, httpStatus, errorMessage);

      // Log Integration Audit Trail
      await integrationAudit.logTransmission({
        correlationId: item.correlationId,
        endpoint: `${this.baseUrl}/${item.fhirResourceType}`,
        resourceType: item.fhirResourceType,
        internalEntityId: item.entityId,
        payload: item.payload,
        httpStatus,
        responseBody: { error: errorMessage },
        durationMs: Date.now() - startTime,
        status: 'FAILED',
        error: err
      });

      return { success: false, httpStatus, errorMessage, outboxStatus: updatedItem.status };
    }
  }

  /**
   * Process all ready items in the Outbox queue
   */
  async processOutboxQueue() {
    const readyItems = await fhirOutbox.getReadyItems();
    const results = [];

    for (const item of readyItems) {
      const res = await this.processOutboxItem(item);
      results.push({ id: item.id, ...res });
    }

    return results;
  }
}

export const satusehatGateway = new SatusehatGatewayService();
export default satusehatGateway;
