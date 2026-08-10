/**
 * NurseFlow Enterprise HIS — Domain Event Engine Service
 * Event-Driven Enterprise Architecture Bus with Idempotency Protection
 * Decouples domain interactions across EMR, Lab, Pharmacy, Inventory, Billing, and Interoperability.
 */

export const DOMAIN_EVENTS = {
  PATIENT_REGISTERED: 'PatientRegistered',
  PATIENT_MERGED: 'PatientMerged',
  ENCOUNTER_CREATED: 'EncounterCreated',
  ENCOUNTER_STATUS_CHANGED: 'EncounterStatusChanged',
  CARE_TEAM_ASSIGNED: 'CareTeamAssigned',
  ORDER_PLACED: 'OrderPlaced',
  ORDER_STATUS_CHANGED: 'OrderStatusChanged',
  RESULT_VERIFIED: 'ResultVerified',
  MEDICATION_PRESCRIBED: 'MedicationPrescribed',
  MEDICATION_DISPENSED: 'MedicationDispensed',
  MEDICATION_ADMINISTERED: 'MedicationAdministered',
  PATIENT_ADMITTED: 'PatientAdmitted',
  PATIENT_TRANSFERRED: 'PatientTransferred',
  PATIENT_DISCHARGED: 'PatientDischarged',
  CHARGE_GENERATED: 'ChargeGenerated',
  CLAIM_SUBMITTED: 'ClaimSubmitted'
};

class DomainEventEngine {
  constructor() {
    this.listeners = new Map();
    this.eventLog = [];
    this.processedEvents = new Set(); // Idempotency Protection Set
  }

  // Subscribe listener callback to eventType
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType) || [];
      this.listeners.set(eventType, callbacks.filter(cb => cb !== callback));
    };
  }

  // Publish Domain Event (Post-Persist Pattern)
  publish(eventType, payload, actorName = 'System', eventId = null) {
    const finalEventId = eventId || `EVT-BUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Idempotency Check: Ignore duplicate event processing
    if (this.processedEvents.has(finalEventId)) {
      console.warn(`[DomainEventEngine] IDEMPOTENCY_GUARD: Event ${finalEventId} already processed. Skipping duplicate publication.`);
      return null;
    }

    const event = {
      eventId: finalEventId,
      eventType,
      patientId: payload.patientId || null,
      encounterId: payload.encounterId || null,
      actorName,
      timestamp: new Date().toISOString(),
      payload
    };

    this.processedEvents.add(finalEventId);
    this.eventLog.push(event);

    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error(`[DomainEventEngine] Error in listener for ${eventType}:`, err);
      }
    });

    return event;
  }

  getEventLog() {
    return this.eventLog;
  }
}

export const domainEventEngine = new DomainEventEngine();
export default domainEventEngine;
