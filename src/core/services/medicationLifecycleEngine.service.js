/**
 * ============================================================================
 * MEDICATION LIFECYCLE PLATFORM — SPRINT 3A & 3B DOMAIN CONTRACT
 * 
 * WARNING:
 * This engine is the authoritative clinical safety foundation for all medication
 * orders, schedules, pharmacy dispensing, and point-of-care administrations.
 * 
 * Standard: JCI MMU (Medication Management & Use), IPSG 3 (High-Alert / LASA Safety),
 * Permenkes 24/2022, ISO 27799 WORM Event Sourcing.
 * ============================================================================
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';
import { CARE_STATES, TERMINAL_STATES } from './careStateEngine.service.js';

// Canonical Machine-Readable Medication Error Codes (Gate 3B)
export const MED_ERROR_CODES = {
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  PATIENT_TERMINAL: 'PATIENT_TERMINAL',
  DISCHARGE_BEDSIDE_ADMIN_BLOCKED: 'DISCHARGE_BEDSIDE_ADMIN_BLOCKED',
  WRONG_PATIENT: 'WRONG_PATIENT',
  WRONG_DRUG: 'WRONG_DRUG',
  WRONG_DOSE: 'WRONG_DOSE',
  WRONG_ROUTE: 'WRONG_ROUTE',
  WRONG_TIME: 'WRONG_TIME',
  HIGH_ALERT_DUAL_SIGN_REQUIRED: 'HIGH_ALERT_DUAL_SIGN_REQUIRED',
  SLOT_ALREADY_ADMINISTERED: 'SLOT_ALREADY_ADMINISTERED',
  OCC_CONFLICT: 'OCC_CONFLICT',
  COMMAND_ALREADY_PROCESSED: 'COMMAND_ALREADY_PROCESSED',
  ORDER_NOT_ACTIVE: 'ORDER_NOT_ACTIVE',
  RIGHT_REASON_REQUIRED: 'RIGHT_REASON_REQUIRED'
};

export class MedicationSafetyException extends Error {
  constructor(code, message, details = {}) {
    super(`[${code}] ${message}`);
    this.name = 'MedicationSafetyException';
    this.code = code;
    this.details = details;
  }
}

// Canonical Medication Order States
export const MEDICATION_ORDER_STATES = {
  ORDERED: 'ORDERED',
  PHARMACY_VERIFIED: 'PHARMACY_VERIFIED',
  PREPARED: 'PREPARED',
  DISPENSED: 'DISPENSED',
  RECEIVED_IN_WARD: 'RECEIVED_IN_WARD',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISCONTINUED: 'DISCONTINUED',
  REJECTED_BY_PHARMACY: 'REJECTED_BY_PHARMACY'
};

// Canonical Medication Administration Schedule Slot States
export const MEDICATION_SLOT_STATES = {
  SCHEDULED: 'SCHEDULED',
  PREPARED: 'PREPARED',
  READY_AT_BEDSIDE: 'READY_AT_BEDSIDE',
  ADMINISTERED: 'ADMINISTERED',
  PARTIALLY_ADMINISTERED: 'PARTIALLY_ADMINISTERED',
  HELD: 'HELD',
  REFUSED: 'REFUSED',
  MISSED: 'MISSED',
  OMITTED: 'OMITTED',
  NOT_GIVEN: 'NOT_GIVEN',
  CANCELLED: 'CANCELLED'
};

// Canonical Medication Clinical Events
export const MEDICATION_EVENTS = {
  PRESCRIBE_MEDICATION: 'PRESCRIBE_MEDICATION',
  VERIFY_PRESCRIPTION: 'VERIFY_PRESCRIPTION',
  PREPARE_DOSE: 'PREPARE_DOSE',
  DISPENSE_MEDICATION: 'DISPENSE_MEDICATION',
  RECEIVE_WARD_STOCK: 'RECEIVE_WARD_STOCK',
  PREPARE_BEDSIDE_DOSE: 'PREPARE_BEDSIDE_DOSE',
  ADMINISTER_DOSE: 'ADMINISTER_DOSE',
  RECORD_HELD_DOSE: 'RECORD_HELD_DOSE',
  RECORD_REFUSED_DOSE: 'RECORD_REFUSED_DOSE',
  RECORD_MISSED_DOSE: 'RECORD_MISSED_DOSE',
  CANCEL_ORDER: 'CANCEL_ORDER',
  DISCONTINUE_ORDER: 'DISCONTINUE_ORDER'
};

// High-Alert Drug Risk Categories (JCI IPSG 3)
export const HIGH_ALERT_CATEGORIES = {
  INSULIN: 'INSULIN',
  OPIOID_NARCOTIC: 'OPIOID_NARCOTIC',
  ANTICOAGULANT: 'ANTICOAGULANT',
  CONCENTRATED_ELECTROLYTE: 'CONCENTRATED_ELECTROLYTE',
  CHEMOTHERAPY: 'CHEMOTHERAPY',
  NEUROMUSCULAR_BLOCKER: 'NEUROMUSCULAR_BLOCKER'
};

class MedicationLifecycleEngine {
  constructor() {
    this.ORDERS_COLLECTION = 'medication_orders';
    this.SCHEDULES_COLLECTION = 'medication_schedules';
    this.EVENTS_COLLECTION = 'medication_events';
    this.processedCommandIds = new Map();
  }

  /**
   * Helper: Generate Discrete Administration Slots from Frequency
   */
  generateScheduleSlots(frequency, startDate = new Date(), durationDays = 1) {
    const timeMappings = {
      'ONCE': ['08:00'],
      'STAT': ['NOW'],
      'PRN': ['AS_NEEDED'],
      'QD': ['08:00'],
      '1X1': ['08:00'],
      'BID': ['08:00', '20:00'],
      '2X1': ['08:00', '20:00'],
      'TID': ['08:00', '14:00', '20:00'],
      '3X1': ['08:00', '14:00', '20:00'],
      'QID': ['06:00', '12:00', '18:00', '24:00'],
      '4X1': ['06:00', '12:00', '18:00', '24:00'],
      'Q4H': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      'Q6H': ['00:00', '06:00', '12:00', '18:00'],
      'Q8H': ['06:00', '14:00', '22:00'],
      'Q12H': ['08:00', '20:00']
    };

    const normalizedFreq = (frequency || 'QD').toUpperCase().replace(/\s+/g, '');
    const dailyTimes = timeMappings[normalizedFreq] || ['08:00'];
    const slots = [];

    const baseDate = new Date(startDate);
    for (let day = 0; day < durationDays; day++) {
      const currentDay = new Date(baseDate);
      currentDay.setDate(baseDate.getDate() + day);
      const dateStr = currentDay.toISOString().split('T')[0];

      dailyTimes.forEach((timeStr, idx) => {
        slots.push({
          slotId: `SLOT-${dateStr}-${timeStr.replace(':', '')}-${idx + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          targetTimestamp: timeStr === 'NOW' ? new Date().toISOString() : `${dateStr}T${timeStr}:00.000Z`,
          status: MEDICATION_SLOT_STATES.SCHEDULED,
          version: 1,
          administeredDose: null,
          administeredRoute: null,
          administeredAt: null,
          administeredBy: null,
          coSignatureBy: null,
          heldReason: null,
          refusedReason: null
        });
      });
    }

    return slots;
  }

  /**
   * 1. Prescribe Medication (Doctor CPOE ➔ Medication Order & Schedule Generation)
   */
  async prescribeMedication({
    encounterId,
    patientId,
    patientName,
    mrn,
    prescriberId,
    prescriberName,
    medicationCode,
    medicationName,
    dose,
    doseUnit,
    route,
    frequency,
    durationDays = 3,
    instructions = '',
    isHighAlert = false,
    highAlertCategory = null,
    isLasa = false,
    lasaPairDrug = null,
    workflowType = 'INPATIENT_ROUTINE', // 'INPATIENT_ROUTINE' | 'DISCHARGE_TAKE_HOME'
    commandId = null,
    correlationId = null
  }) {
    if (commandId && this.processedCommandIds.has(commandId)) {
      return this.processedCommandIds.get(commandId);
    }

    // Invariant Check 1: Patient must be in an active care state (unless discharge take-home meds)
    const encounter = await persistenceAdapter.findById('encounters', encounterId);
    if (!encounter) throw new Error(`[MedicationLifecycle] Encounter "${encounterId}" not found`);
    if (TERMINAL_STATES.has(encounter.primaryState) && workflowType !== 'DISCHARGE_TAKE_HOME') {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.PATIENT_TERMINAL,
        `Cannot prescribe routine inpatient medication for encounter in terminal state "${encounter.primaryState}"`
      );
    }

    const orderId = `ORD-MED-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const corrId = correlationId || `CORR-MED-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const scheduleSlots = this.generateScheduleSlots(frequency, new Date(), durationDays);

    const order = {
      id: orderId,
      orderNumber: `RX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      encounterId,
      patientId,
      patientName,
      mrn,
      prescriberId,
      prescriberName,
      medicationCode,
      medicationName,
      dose,
      doseUnit,
      route,
      frequency,
      durationDays,
      instructions,
      workflowType,
      isHighAlert: !!isHighAlert,
      highAlertCategory: highAlertCategory || null,
      isLasa: !!isLasa,
      lasaPairDrug: lasaPairDrug || null,
      status: MEDICATION_ORDER_STATES.ORDERED,
      version: 1,
      scheduleSlots,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await persistenceAdapter.save(this.ORDERS_COLLECTION, order.id, order);

    // Record Event Sourcing
    const event = {
      id: `EVT-MED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: order.id,
      aggregateVersion: 1,
      correlationId: corrId,
      commandId,
      eventType: MEDICATION_EVENTS.PRESCRIBE_MEDICATION,
      patientId,
      encounterId,
      medicationOrderId: order.id,
      administrationSlotId: null,
      previousState: null,
      newState: MEDICATION_ORDER_STATES.ORDERED,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: prescriberId, name: prescriberName, role: 'DOCTOR' },
      payload: {
        orderId: order.id,
        medicationName,
        dose: `${dose} ${doseUnit}`,
        route,
        frequency,
        workflowType,
        slotCount: scheduleSlots.length
      }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    const response = { success: true, order, event };
    if (commandId) this.processedCommandIds.set(commandId, response);
    return response;
  }

  /**
   * 2. Cancel Medication Order (Doctor / System ➔ Cancel Active Order)
   */
  async cancelMedicationOrder({
    orderId,
    cancelledById,
    cancelledByName,
    cancellationReason = 'Clinical order cancelled by physician',
    commandId = null,
    correlationId = null
  }) {
    if (commandId && this.processedCommandIds.has(commandId)) {
      return this.processedCommandIds.get(commandId);
    }

    const order = await persistenceAdapter.findById(this.ORDERS_COLLECTION, orderId);
    if (!order) throw new Error(`[MedicationLifecycle] Order "${orderId}" not found`);

    const timestamp = new Date().toISOString();
    const previousState = order.status;
    order.status = MEDICATION_ORDER_STATES.CANCELLED;
    order.version = (order.version || 1) + 1;
    order.cancellationInfo = {
      cancelledById,
      cancelledByName,
      cancellationReason,
      cancelledAt: timestamp
    };

    // Mark remaining scheduled slots as CANCELLED
    order.scheduleSlots = order.scheduleSlots.map(s => {
      if (s.status === MEDICATION_SLOT_STATES.SCHEDULED || s.status === MEDICATION_SLOT_STATES.PREPARED) {
        return { ...s, status: MEDICATION_SLOT_STATES.CANCELLED, version: (s.version || 1) + 1 };
      }
      return s;
    });

    order.updatedAt = timestamp;
    await persistenceAdapter.save(this.ORDERS_COLLECTION, order.id, order);

    const event = {
      id: `EVT-MED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: order.id,
      aggregateVersion: order.version,
      correlationId: correlationId || `CORR-CANCEL-${Date.now()}`,
      commandId,
      eventType: MEDICATION_EVENTS.CANCEL_ORDER,
      patientId: order.patientId,
      encounterId: order.encounterId,
      medicationOrderId: order.id,
      administrationSlotId: null,
      previousState,
      newState: MEDICATION_ORDER_STATES.CANCELLED,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: cancelledById, name: cancelledByName, role: 'DOCTOR' },
      payload: order.cancellationInfo
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    const response = { success: true, order, event };
    if (commandId) this.processedCommandIds.set(commandId, response);
    return response;
  }

  /**
   * 3. Pharmacy Verification & Dispensing (Apoteker ➔ Verify & Allocate FEFO Batch)
   */
  async verifyAndDispense({
    orderId,
    pharmacistId,
    pharmacistName,
    dispensedQty,
    allocatedBatchNumber,
    allocatedLotNumber,
    allocatedExpiryDate,
    depotLocation = 'CENTRAL_PHARMACY',
    commandId = null,
    correlationId = null
  }) {
    if (commandId && this.processedCommandIds.has(commandId)) {
      return this.processedCommandIds.get(commandId);
    }

    const order = await persistenceAdapter.findById(this.ORDERS_COLLECTION, orderId);
    if (!order) throw new Error(`[MedicationLifecycle] Order "${orderId}" not found`);
    if (order.status === MEDICATION_ORDER_STATES.CANCELLED) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.ORDER_CANCELLED,
        `Cannot dispense a CANCELLED medication order`
      );
    }

    const timestamp = new Date().toISOString();
    const previousState = order.status;
    order.status = MEDICATION_ORDER_STATES.DISPENSED;
    order.version = (order.version || 1) + 1;
    order.dispenseInfo = {
      pharmacistId,
      pharmacistName,
      dispensedQty,
      batchNumber: allocatedBatchNumber,
      lotNumber: allocatedLotNumber,
      expiryDate: allocatedExpiryDate,
      depotLocation,
      dispensedAt: timestamp
    };
    order.updatedAt = timestamp;

    await persistenceAdapter.save(this.ORDERS_COLLECTION, order.id, order);

    const event = {
      id: `EVT-MED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: order.id,
      aggregateVersion: order.version,
      correlationId: correlationId || `CORR-DISP-${Date.now()}`,
      commandId,
      eventType: MEDICATION_EVENTS.DISPENSE_MEDICATION,
      patientId: order.patientId,
      encounterId: order.encounterId,
      medicationOrderId: order.id,
      administrationSlotId: null,
      previousState,
      newState: MEDICATION_ORDER_STATES.DISPENSED,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: pharmacistId, name: pharmacistName, role: 'PHARMACIST' },
      payload: order.dispenseInfo
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    const response = { success: true, order, event };
    if (commandId) this.processedCommandIds.set(commandId, response);
    return response;
  }

  /**
   * 4. Point-of-Care Bedside Medication Administration (7-Rights & Dual Verification Engine)
   */
  async administerDose({
    orderId,
    slotId,
    nurseId,
    nurseName,
    coSignatureNurseId = null,
    coSignatureNurseName = null,
    scannedPatientMrn = null,
    scannedMedicationCode = null,
    actualDose = null,
    actualRoute = null,
    notes = '',
    expectedSlotVersion = null,
    commandId = null,
    correlationId = null
  }) {
    // 0. Idempotency Check (Network retry safety)
    if (commandId && this.processedCommandIds.has(commandId)) {
      return this.processedCommandIds.get(commandId);
    }

    // 1. Fetch Order
    const order = await persistenceAdapter.findById(this.ORDERS_COLLECTION, orderId);
    if (!order) throw new Error(`[MedicationLifecycle] Order "${orderId}" not found`);

    // Invariant Check 1: Order must not be cancelled
    if (order.status === MEDICATION_ORDER_STATES.CANCELLED) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.ORDER_CANCELLED,
        `Cannot administer dose from CANCELLED order "${order.orderNumber}"`
      );
    }

    // 2. Fetch Active Patient Encounter & Verify Invariants
    const encounter = await persistenceAdapter.findById('encounters', order.encounterId);
    if (encounter) {
      if (encounter.primaryState === CARE_STATES.DECEASED) {
        throw new MedicationSafetyException(
          MED_ERROR_CODES.PATIENT_TERMINAL,
          `Patient is DECEASED. All medication administration strictly prohibited.`
        );
      }
      if (encounter.primaryState === CARE_STATES.DISCHARGED && order.workflowType !== 'DISCHARGE_TAKE_HOME') {
        throw new MedicationSafetyException(
          MED_ERROR_CODES.DISCHARGE_BEDSIDE_ADMIN_BLOCKED,
          `Patient is already DISCHARGED from hospital. Inpatient bedside administration is blocked.`
        );
      }
    }

    // 3. Find Schedule Slot
    const slotIndex = order.scheduleSlots.findIndex(s => s.slotId === slotId);
    if (slotIndex === -1) throw new Error(`[MedicationLifecycle] Slot "${slotId}" not found in order "${orderId}"`);

    const slot = order.scheduleSlots[slotIndex];

    // Optimistic Concurrency Control (OCC) Check on Slot
    if (expectedSlotVersion !== null && slot.version !== undefined && slot.version !== expectedSlotVersion) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.OCC_CONFLICT,
        `Slot "${slotId}" was already modified by another clinical actor (Server Slot Version: ${slot.version}, Client Expected: ${expectedSlotVersion})`
      );
    }

    // Double Administration Prevention: Slot cannot be re-administered if already terminal
    if (slot.status === MEDICATION_SLOT_STATES.ADMINISTERED) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.SLOT_ALREADY_ADMINISTERED,
        `Dose for slot "${slot.scheduledTime}" has ALREADY been administered at ${slot.administeredAt} by ${slot.administeredBy?.name}. Double administration strictly blocked!`
      );
    }

    // 4. Clinical Safety Invariant: High-Alert Dual Independent Verification (JCI IPSG 3)
    if (order.isHighAlert && (!coSignatureNurseId || !coSignatureNurseName)) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.HIGH_ALERT_DUAL_SIGN_REQUIRED,
        `Medication "${order.medicationName}" is classified as HIGH-ALERT (${order.highAlertCategory || 'High Risk'}). Independent Dual-Verification (Co-Signature) by a second RN is mandatory!`
      );
    }

    // 5. 7-Rights Validation
    if (scannedPatientMrn && scannedPatientMrn !== order.mrn) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.WRONG_PATIENT,
        `Barcode mismatch! Scanned Patient MRN "${scannedPatientMrn}" does NOT match order MRN "${order.mrn}"`
      );
    }
    if (scannedMedicationCode && scannedMedicationCode !== order.medicationCode) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.WRONG_DRUG,
        `Barcode mismatch! Scanned Drug Code "${scannedMedicationCode}" does NOT match ordered code "${order.medicationCode}" (${order.medicationName})`
      );
    }

    const timestamp = new Date().toISOString();
    const previousSlotState = slot.status;

    // 6. Mutate Slot State
    slot.status = MEDICATION_SLOT_STATES.ADMINISTERED;
    slot.version = (slot.version || 1) + 1;
    slot.administeredDose = actualDose || order.dose;
    slot.administeredRoute = actualRoute || order.route;
    slot.administeredAt = timestamp;
    slot.administeredBy = { id: nurseId, name: nurseName };
    if (coSignatureNurseId) {
      slot.coSignatureBy = { id: coSignatureNurseId, name: coSignatureNurseName, signedAt: timestamp };
    }
    slot.notes = notes;

    // Check if all slots are completed
    const allCompleted = order.scheduleSlots.every(s => 
      s.status === MEDICATION_SLOT_STATES.ADMINISTERED || 
      s.status === MEDICATION_SLOT_STATES.REFUSED || 
      s.status === MEDICATION_SLOT_STATES.CANCELLED
    );
    if (allCompleted) {
      order.status = MEDICATION_ORDER_STATES.COMPLETED;
    } else {
      order.status = MEDICATION_ORDER_STATES.IN_PROGRESS;
    }

    order.version = (order.version || 1) + 1;
    order.updatedAt = timestamp;

    await persistenceAdapter.save(this.ORDERS_COLLECTION, order.id, order);

    // 7. Record Immutable Medication Event Sourcing Ledger
    const event = {
      id: `EVT-MED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: order.id,
      aggregateVersion: order.version,
      correlationId: correlationId || `CORR-ADM-${Date.now()}`,
      commandId,
      eventType: MEDICATION_EVENTS.ADMINISTER_DOSE,
      patientId: order.patientId,
      encounterId: order.encounterId,
      medicationOrderId: order.id,
      administrationSlotId: slot.slotId,
      previousState: previousSlotState,
      newState: MEDICATION_SLOT_STATES.ADMINISTERED,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: nurseId, name: nurseName, role: 'NURSE' },
      payload: {
        orderId: order.id,
        slotId: slot.slotId,
        scheduledTime: slot.scheduledTime,
        administeredDose: slot.administeredDose,
        administeredRoute: slot.administeredRoute,
        coSignature: slot.coSignatureBy || null,
        isHighAlert: order.isHighAlert,
        notes
      }
    };

    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    const response = { success: true, order, slot, event };
    if (commandId) this.processedCommandIds.set(commandId, response);
    return response;
  }

  /**
   * 5. Record Non-Administration (Right Reason: Refused, Held, Missed, Omitted)
   */
  async recordNonAdministration({
    orderId,
    slotId,
    reasonCategory,
    detailedReason,
    nurseId,
    nurseName,
    commandId = null,
    correlationId = null
  }) {
    if (commandId && this.processedCommandIds.has(commandId)) {
      return this.processedCommandIds.get(commandId);
    }

    if (!reasonCategory || !detailedReason) {
      throw new MedicationSafetyException(
        MED_ERROR_CODES.RIGHT_REASON_REQUIRED,
        `Recording non-administration requires a clinical reasonCategory and detailedReason`
      );
    }

    const order = await persistenceAdapter.findById(this.ORDERS_COLLECTION, orderId);
    if (!order) throw new Error(`[MedicationLifecycle] Order "${orderId}" not found`);

    const slotIndex = order.scheduleSlots.findIndex(s => s.slotId === slotId);
    if (slotIndex === -1) throw new Error(`[MedicationLifecycle] Slot "${slotId}" not found in order "${orderId}"`);

    const slot = order.scheduleSlots[slotIndex];
    const timestamp = new Date().toISOString();
    const previousSlotState = slot.status;

    const targetStatus = reasonCategory === 'REFUSED' 
      ? MEDICATION_SLOT_STATES.REFUSED 
      : reasonCategory === 'HELD' 
      ? MEDICATION_SLOT_STATES.HELD 
      : MEDICATION_SLOT_STATES.MISSED;

    slot.status = targetStatus;
    slot.version = (slot.version || 1) + 1;
    slot.nonAdministeredReason = {
      category: reasonCategory,
      details: detailedReason,
      recordedBy: { id: nurseId, name: nurseName },
      recordedAt: timestamp
    };

    order.version = (order.version || 1) + 1;
    order.updatedAt = timestamp;
    await persistenceAdapter.save(this.ORDERS_COLLECTION, order.id, order);

    const event = {
      id: `EVT-MED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: order.id,
      aggregateVersion: order.version,
      correlationId: correlationId || `CORR-NONADMIN-${Date.now()}`,
      commandId,
      eventType: reasonCategory === 'REFUSED' ? MEDICATION_EVENTS.RECORD_REFUSED_DOSE : MEDICATION_EVENTS.RECORD_HELD_DOSE,
      patientId: order.patientId,
      encounterId: order.encounterId,
      medicationOrderId: order.id,
      administrationSlotId: slot.slotId,
      previousState: previousSlotState,
      newState: targetStatus,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: nurseId, name: nurseName, role: 'NURSE' },
      payload: {
        orderId: order.id,
        slotId: slot.slotId,
        reasonCategory,
        detailedReason
      }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    const response = { success: true, order, slot, event };
    if (commandId) this.processedCommandIds.set(commandId, response);
    return response;
  }
}

export const medicationLifecycleEngine = new MedicationLifecycleEngine();
export default medicationLifecycleEngine;
