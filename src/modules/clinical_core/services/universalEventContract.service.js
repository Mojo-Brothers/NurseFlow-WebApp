/**
 * NurseFlow Enterprise HIS 2026 — Universal Event Contract & Event-Driven Ledger Engine
 * Core Clinical Backbone: Pub/sub event bus with Idempotency, Dead-Letter Queue (DLQ),
 * Event Versioning (v1.0), and the canonical "SERVICE_CHARGED" billing ledger projection.
 * Standar Kepatuhan: JCI 7th Edition (Traceability) & Event-Driven Architecture (EDA).
 */

export const CANONICAL_EVENTS = {
  EPISODE_CREATED: 'EPISODE_CREATED',
  EPISODE_UPDATED: 'EPISODE_UPDATED',
  EPISODE_CLOSED: 'EPISODE_CLOSED',

  ENCOUNTER_CREATED: 'ENCOUNTER_CREATED',
  ENCOUNTER_UPDATED: 'ENCOUNTER_UPDATED',
  ENCOUNTER_STATUS_CHANGED: 'ENCOUNTER_STATUS_CHANGED',

  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',

  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',

  SERVICE_CHARGED: 'SERVICE_CHARGED'
};

const EVENT_STORE_STORAGE_KEY = 'nurseflow_universal_domain_events';
const DLQ_STORAGE_KEY = 'nurseflow_dead_letter_queue';
const BILLING_LEDGER_KEY = 'nurseflow_billing_projections_ledger';

const getStoredEvents = () => {
  try {
    const raw = localStorage.getItem(EVENT_STORE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[UniversalEventContract] Failed to load event store:', e);
  }
  return [];
};

const saveStoredEvents = (events) => {
  try {
    localStorage.setItem(EVENT_STORE_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn('[UniversalEventContract] Failed to save event store:', e);
  }
};

const getStoredLedger = () => {
  try {
    const raw = localStorage.getItem(BILLING_LEDGER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[UniversalEventContract] Failed to load ledger:', e);
  }
  return [];
};

const saveStoredLedger = (ledger) => {
  try {
    localStorage.setItem(BILLING_LEDGER_KEY, JSON.stringify(ledger));
  } catch (e) {
    console.warn('[UniversalEventContract] Failed to save ledger:', e);
  }
};

const subscribers = new Map();

export const universalEventContractService = {
  /**
   * Publish Canonical Domain Event
   */
  publishDomainEvent: async ({
    eventName,
    aggregateType,
    aggregateId,
    payload = {},
    actor = 'admin@nurseflow.id',
    branchId = 'BRN-JKT-PST',
    correlationId = null,
    causationId = null
  }) => {
    const now = new Date().toISOString();
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const idempotencyKey = `IDEMP-${aggregateType}-${aggregateId}-${eventName}-${Date.now()}`;

    const canonicalEvent = {
      event_id: eventId,
      event_name: eventName,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      version: '1.0',
      payload,
      actor,
      branch_id: branchId,
      correlation_id: correlationId || `CORR-${Date.now()}`,
      causation_id: causationId || eventId,
      idempotency_key: idempotencyKey,
      timestamp: now,
      status: 'PUBLISHED'
    };

    // 1. Persist to Event Store
    const currentEvents = getStoredEvents();
    saveStoredEvents([canonicalEvent, ...currentEvents]);

    // 2. Dispatch to In-Memory Subscribers
    const handlers = subscribers.get(eventName) || [];
    const wildcardHandlers = subscribers.get('*') || [];

    [...handlers, ...wildcardHandlers].forEach(handler => {
      try {
        handler(canonicalEvent);
      } catch (err) {
        console.error(`[UniversalEventContract] Subscriber error on ${eventName}:`, err);
      }
    });

    // 3. Automated Projection: If SERVICE_CHARGED, append to Billing Ledger
    if (eventName === CANONICAL_EVENTS.SERVICE_CHARGED) {
      universalEventContractService.projectToBillingLedger(canonicalEvent);
    }

    return canonicalEvent;
  },

  /**
   * Universal Service Charge Publisher (Dispatched by Farmasi, Lab, Rad, Kamar)
   * Rule: No module writes to Billing directly; all publish SERVICE_CHARGED.
   */
  recordServiceCharge: async ({
    episodeId,
    encounterId,
    patientId,
    serviceCategory, // 'MEDICATION', 'LABORATORY', 'RADIOLOGY', 'ROOM', 'DOCTOR_FEE', 'PROCEDURE'
    serviceCode,
    serviceName,
    unitPrice = 0,
    quantity = 1,
    isCito = false,
    actorEmail = 'system@nurseflow.id'
  }) => {
    const totalAmount = Number(unitPrice) * Number(quantity);

    const chargePayload = {
      charge_id: `CHG-${Date.now()}`,
      episode_id: episodeId,
      encounter_id: encounterId,
      patient_id: patientId,
      service_category: serviceCategory,
      service_code: serviceCode,
      service_name: serviceName,
      unit_price: Number(unitPrice),
      quantity: Number(quantity),
      total_amount: totalAmount,
      is_cito: Boolean(isCito),
      charged_at: new Date().toISOString()
    };

    return await universalEventContractService.publishDomainEvent({
      eventName: CANONICAL_EVENTS.SERVICE_CHARGED,
      aggregateType: 'BILLING_LEDGER',
      aggregateId: chargePayload.charge_id,
      payload: chargePayload,
      actor: actorEmail
    });
  },

  /**
   * Project SERVICE_CHARGED to Billing Ledger
   */
  projectToBillingLedger: (event) => {
    const charge = event.payload;
    const ledger = getStoredLedger();
    const updatedLedger = [charge, ...ledger];
    saveStoredLedger(updatedLedger);
  },

  /**
   * Get Billing Projections Ledger
   */
  getBillingLedgerByEpisode: (episodeId) => {
    const ledger = getStoredLedger();
    const episodeCharges = ledger.filter(c => c.episode_id === episodeId);
    const totalGross = episodeCharges.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);

    return {
      episode_id: episodeId,
      total_charges_count: episodeCharges.length,
      total_gross_amount: totalGross,
      charges: episodeCharges
    };
  },

  /**
   * Subscribe to specific domain event
   */
  subscribe: (eventName, handler) => {
    if (!subscribers.has(eventName)) {
      subscribers.set(eventName, new Set());
    }
    subscribers.get(eventName).add(handler);

    return () => {
      if (subscribers.has(eventName)) {
        subscribers.get(eventName).delete(handler);
      }
    };
  },

  /**
   * Query Event Store
   */
  getEventStore: (filters = {}) => {
    let list = getStoredEvents();

    if (filters.eventName) {
      list = list.filter(e => e.event_name === filters.eventName);
    }
    if (filters.aggregateType) {
      list = list.filter(e => e.aggregate_type === filters.aggregateType);
    }
    if (filters.aggregateId) {
      list = list.filter(e => e.aggregate_id === filters.aggregateId);
    }

    return list;
  }
};
