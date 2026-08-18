/**
 * ============================================================================
 * MEDICATION LIFECYCLE PLATFORM — SPRINT 3B PROJECTIONS ENGINE
 * 
 * Implements Read-Model Projections derived from `medication_events`:
 * 1. eMAR Bedside Projection (emar_projections)
 * 2. Pharmacy Dispensing Projection (pharmacy_projections)
 * 3. Medicolegal Audit Ledger Projection (medication_audit_projections)
 * 
 * Supports 100% Deterministic Event Replay & Reconstruction.
 * ============================================================================
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';
import { MEDICATION_EVENTS, MEDICATION_ORDER_STATES, MEDICATION_SLOT_STATES } from './medicationLifecycleEngine.service.js';

class MedicationProjectionEngine {
  constructor() {
    this.EVENTS_COLLECTION = 'medication_events';
    this.ORDERS_COLLECTION = 'medication_orders';
    this.EMAR_PROJECTIONS = 'emar_projections';
    this.PHARMACY_PROJECTIONS = 'pharmacy_projections';
    this.AUDIT_PROJECTIONS = 'medication_audit_projections';
  }

  /**
   * Deterministic Rebuild of All Medication Projections from Event Stream
   */
  async rebuildAllProjections() {
    const allEvents = await persistenceAdapter.query(this.EVENTS_COLLECTION);
    
    // Sort chronologically by recordedAt / occurredAt
    const sortedEvents = [...allEvents].sort((a, b) => 
      new Date(a.recordedAt || a.performedAt).getTime() - new Date(b.recordedAt || b.performedAt).getTime()
    );

    const emarMap = new Map();
    const pharmacyMap = new Map();
    const auditMap = new Map();

    for (const event of sortedEvents) {
      this._applyEventToEmarProjection(event, emarMap);
      this._applyEventToPharmacyProjection(event, pharmacyMap);
      this._applyEventToAuditProjection(event, auditMap);
    }

    // Persist projected documents
    for (const [key, doc] of emarMap.entries()) {
      await persistenceAdapter.save(this.EMAR_PROJECTIONS, key, doc);
    }

    for (const [key, doc] of pharmacyMap.entries()) {
      await persistenceAdapter.save(this.PHARMACY_PROJECTIONS, key, doc);
    }

    for (const [key, doc] of auditMap.entries()) {
      await persistenceAdapter.save(this.AUDIT_PROJECTIONS, key, doc);
    }

    return {
      success: true,
      eventCount: sortedEvents.length,
      emarCount: emarMap.size,
      pharmacyCount: pharmacyMap.size,
      auditCount: auditMap.size
    };
  }

  /**
   * Private: eMAR Projection Projector
   */
  _applyEventToEmarProjection(event, emarMap) {
    const key = event.patientId || event.encounterId;
    if (!key) return;

    if (!emarMap.has(key)) {
      emarMap.set(key, {
        patientId: event.patientId,
        encounterId: event.encounterId,
        activeOrders: [],
        dueSlots: [],
        administeredCount: 0,
        refusedCount: 0,
        lastUpdated: event.recordedAt
      });
    }

    const doc = emarMap.get(key);
    doc.lastUpdated = event.recordedAt;

    if (event.eventType === MEDICATION_EVENTS.PRESCRIBE_MEDICATION) {
      doc.activeOrders.push({
        orderId: event.medicationOrderId,
        medicationName: event.payload.medicationName,
        dose: event.payload.dose,
        route: event.payload.route,
        frequency: event.payload.frequency,
        status: MEDICATION_ORDER_STATES.ORDERED
      });
    } else if (event.eventType === MEDICATION_EVENTS.CANCEL_ORDER) {
      doc.activeOrders = doc.activeOrders.filter(o => o.orderId !== event.medicationOrderId);
    } else if (event.eventType === MEDICATION_EVENTS.ADMINISTER_DOSE) {
      doc.administeredCount += 1;
    } else if (event.eventType === MEDICATION_EVENTS.RECORD_REFUSED_DOSE) {
      doc.refusedCount += 1;
    }
  }

  /**
   * Private: Pharmacy Dispensing Projection Projector
   */
  _applyEventToPharmacyProjection(event, pharmacyMap) {
    const orderId = event.medicationOrderId;
    if (!orderId) return;

    if (!pharmacyMap.has(orderId)) {
      pharmacyMap.set(orderId, {
        orderId,
        patientId: event.patientId,
        encounterId: event.encounterId,
        medicationName: event.payload?.medicationName || '',
        status: MEDICATION_ORDER_STATES.ORDERED,
        dispenseInfo: null,
        lastEvent: event.eventType,
        lastUpdated: event.recordedAt
      });
    }

    const doc = pharmacyMap.get(orderId);
    doc.lastEvent = event.eventType;
    doc.lastUpdated = event.recordedAt;

    if (event.eventType === MEDICATION_EVENTS.DISPENSE_MEDICATION) {
      doc.status = MEDICATION_ORDER_STATES.DISPENSED;
      doc.dispenseInfo = event.payload;
    } else if (event.eventType === MEDICATION_EVENTS.CANCEL_ORDER) {
      doc.status = MEDICATION_ORDER_STATES.CANCELLED;
    }
  }

  /**
   * Private: Audit Ledger Projection Projector
   */
  _applyEventToAuditProjection(event, auditMap) {
    const key = event.medicationOrderId || event.aggregateId;
    if (!key) return;

    if (!auditMap.has(key)) {
      auditMap.set(key, {
        orderId: key,
        patientId: event.patientId,
        encounterId: event.encounterId,
        history: []
      });
    }

    const doc = auditMap.get(key);
    doc.history.push({
      eventId: event.id,
      eventVersion: event.eventVersion,
      aggregateVersion: event.aggregateVersion,
      correlationId: event.correlationId,
      commandId: event.commandId || null,
      eventType: event.eventType,
      previousState: event.previousState,
      newState: event.newState,
      performedBy: event.performedBy,
      recordedAt: event.recordedAt,
      payload: event.payload
    });
  }
}

export const medicationProjectionEngine = new MedicationProjectionEngine();
export default medicationProjectionEngine;
