/**
 * NURSEFLOW ENTERPRISE HIS — EXTERNAL CONTRACT LINEAGE RECORDER
 * Maintains end-to-end traceable forensic lineage between Internal Clinical Entities
 * and SATUSEHAT Sandbox/Production Transmissions.
 * 
 * Lineage Trace:
 * Internal Entity (e.g. PAT-001) ➔ Canonical Event ➔ FHIR Payload ➔ HTTP Request ➔
 * Response Body ➔ Parsed OperationOutcome ➔ External SATUSEHAT ID ➔ Reconciliation Link.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';
import { OperationOutcomeParser } from '../gateway/operationOutcomeParser.service.js';

export class ExternalContractRecorderService {
  constructor() {
    this.COLLECTION_NAME = 'external_contract_lineage_records';
  }

  /**
   * Record complete end-to-end transmission lineage artifact
   */
  async recordTrace({
    internalEntityType,
    internalEntityId,
    fhirResourceType,
    correlationId,
    requestMethod = 'POST',
    endpointUrl,
    requestPayload,
    httpStatus,
    responseBody,
    externalResourceId = null,
    durationMs = 0,
    status = 'SUCCESS'
  }) {
    const parsedOutcome = OperationOutcomeParser.parse(responseBody);
    const traceId = `TRACE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const lineageRecord = {
      id: traceId,
      internalEntityType,
      internalEntityId,
      fhirResourceType,
      correlationId: correlationId || `CORR-${Date.now()}`,
      request: {
        method: requestMethod,
        endpoint: endpointUrl,
        timestamp: new Date().toISOString(),
        payload: requestPayload
      },
      response: {
        httpStatus,
        durationMs,
        rawBody: responseBody,
        operationOutcome: parsedOutcome.isOperationOutcome ? parsedOutcome : null,
        formattedDiagnostics: OperationOutcomeParser.formatForAudit(parsedOutcome)
      },
      externalResourceId: externalResourceId || (responseBody?.id || null),
      status: status, // SUCCESS | FAILED | RETRIED
      recordedAt: new Date().toISOString()
    };

    await persistenceAdapter.save(this.COLLECTION_NAME, lineageRecord.id, lineageRecord);
    return lineageRecord;
  }

  /**
   * 1-Click Forensic Trace by Internal Clinical Entity
   */
  async getLineageByInternalEntity(internalEntityType, internalEntityId) {
    try {
      return await persistenceAdapter.query(this.COLLECTION_NAME, (record) => 
        record.internalEntityType === internalEntityType && record.internalEntityId === internalEntityId
      ) || [];
    } catch {
      return [];
    }
  }

  /**
   * Forensic Trace by SATUSEHAT External Resource ID
   */
  async getLineageByExternalId(externalResourceId) {
    try {
      return await persistenceAdapter.query(this.COLLECTION_NAME, (record) => 
        record.externalResourceId === externalResourceId
      ) || [];
    } catch {
      return [];
    }
  }

  /**
   * Forensic Trace by Correlation ID
   */
  async getLineageByCorrelationId(correlationId) {
    try {
      return await persistenceAdapter.query(this.COLLECTION_NAME, (record) => 
        record.correlationId === correlationId
      ) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get all lineage traces
   */
  async getAllTraces() {
    try {
      return await persistenceAdapter.query(this.COLLECTION_NAME) || [];
    } catch {
      return [];
    }
  }
}

export const externalContractRecorder = new ExternalContractRecorderService();
export default externalContractRecorder;
