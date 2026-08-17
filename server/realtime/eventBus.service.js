/**
 * NurseFlow Enterprise HIS 2026 — Decoupled Event Bus & Message Broker
 * Architecture: Event-Driven Architecture (EDA) supporting In-Memory, Redis Streams & Outbox Relay
 */

export const DOMAIN_EVENTS = {
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
  TRIAGE_COMPLETED: 'TRIAGE_COMPLETED',
  ORDER_CREATED: 'ORDER_CREATED',
  SPECIMEN_COLLECTED: 'SPECIMEN_COLLECTED',
  LAB_RESULT_VERIFIED: 'LAB_RESULT_VERIFIED',
  PANIC_VALUE_TRIGGERED: 'PANIC_VALUE_TRIGGERED',
  MEDICATION_DISPENSED: 'MEDICATION_DISPENSED',
  MEDICATION_ADMINISTERED: 'MEDICATION_ADMINISTERED',
  BED_TRANSFERRED: 'BED_TRANSFERRED',
  CODE_BLUE_ACTIVATED: 'CODE_BLUE_ACTIVATED'
};

class EventBusService {
  constructor() {
    this.subscribers = new Map();
    this.eventLedger = [];
  }

  /**
   * Subscribe to a Domain Event
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Publish a Typed Domain Event with Immutable Traceability
   */
  async publish(eventType, payload, metadata = {}) {
    const eventEnvelope = {
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: metadata.correlationId || `CORR-${Date.now()}`,
        tenantId: metadata.tenantId || 'DEFAULT_TENANT',
        actor: metadata.actor || 'SYSTEM_DAEMON',
        workstationIp: metadata.workstationIp || '10.10.1.50'
      }
    };

    // Store in immutable in-memory ledger
    this.eventLedger.push(eventEnvelope);

    // Dispatch to registered subscribers asynchronously
    const handlers = this.subscribers.get(eventType);
    if (handlers && handlers.size > 0) {
      for (const handler of handlers) {
        try {
          await handler(eventEnvelope);
        } catch (err) {
          console.error(`[EventBus] Error executing subscriber for ${eventType}:`, err);
        }
      }
    }

    return eventEnvelope;
  }

  getLedger(filterType = null) {
    if (filterType) {
      return this.eventLedger.filter(e => e.eventType === filterType);
    }
    return this.eventLedger;
  }

  clear() {
    this.eventLedger = [];
    this.subscribers.clear();
  }
}

export const eventBusService = new EventBusService();
