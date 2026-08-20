/**
 * NurseFlow Enterprise HIS 2026 — Client-Side Clinical Realtime Event Bus
 * Lightweight frontend subscriber & notification dispatch
 */

export const DOMAIN_EVENTS = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_VERIFIED: 'ORDER_VERIFIED',
  RADIOLOGY_CRITICAL_FINDING: 'RADIOLOGY_CRITICAL_FINDING',
  RADIOLOGY_REPORT_FINALIZED: 'RADIOLOGY_REPORT_FINALIZED',
  RADIOLOGY_READBACK_CONFIRMED: 'RADIOLOGY_READBACK_CONFIRMED',
  PANIC_VALUE_TRIGGERED: 'PANIC_VALUE_TRIGGERED',
  BED_STATE_CHANGED: 'BED_STATE_CHANGED',
  SURGERY_STATE_CHANGED: 'SURGERY_STATE_CHANGED'
};

class ClientEventBusService {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => this.listeners.get(eventType)?.delete(callback);
  }

  publish(eventType, payload) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EVENT_BUS_ERROR] Event ${eventType}:`, e);
        }
      });
    }
  }
}

export const eventBusService = new ClientEventBusService();
