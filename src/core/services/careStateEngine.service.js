/**
 * NurseFlow Enterprise HIS — Canonical Patient Care State Engine
 * Single Source of Truth for Clinical Care Journey, Location, and State-Driven Routing.
 * Implements: Gate 0A (Transition Matrix), Gate 0B (Event Taxonomy), Gate 0C (Location Hierarchy),
 * Gate 0D (Event Sourcing), and JCI / Permenkes 24/2022 Audit Compliance.
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';
import { domainEventEngine, DOMAIN_EVENTS } from './domainEventEngine.service.js';
import { clinicalTimelineEngine } from './clinicalTimelineEngine.service.js';
import { adtEngine, BED_STATUS } from './adtEngine.service.js';

// 1. 19 Canonical Primary Care States
export const CARE_STATES = {
  REGISTERED: 'REGISTERED',                     // Terdaftar di Loket Admisi
  TRIAGE_PENDING: 'TRIAGE_PENDING',             // Menunggu Skrining Triase IGD
  IGD_OBSERVATION: 'IGD_OBSERVATION',           // Observasi Singkat IGD (2-6 Jam)
  IGD_ACTIVE: 'IGD_ACTIVE',                     // Dalam Penanganan Dokter/Perawat IGD
  OUTPATIENT_ACTIVE: 'OUTPATIENT_ACTIVE',       // Pelayanan Poliklinik Rawat Jalan
  ADMISSION_PENDING: 'ADMISSION_PENDING',       // Menunggu Alokasi Bed Ranap (SPRI Terbit)
  INPATIENT_ACTIVE: 'INPATIENT_ACTIVE',         // Rawat Inap Aktif di Bangsal
  ICU_ACTIVE: 'ICU_ACTIVE',                     // Perawatan Intensif (ICU/ICCU/NICU)
  OR_ACTIVE: 'OR_ACTIVE',                       // Tindakan Kamar Bedah (IBS / OK)
  PACU_RECOVERY: 'PACU_RECOVERY',               // Pemulihan Anestesi (Recovery Room)
  TRANSFER_PENDING: 'TRANSFER_PENDING',         // Persiapan Pindah Ruangan / Bed
  TRANSFERRED: 'TRANSFERRED',                   // Selesai Pindah Ruangan
  DISCHARGE_PENDING: 'DISCHARGE_PENDING',       // Persiapan Pulang (Resume Medis Terbit)
  DISCHARGED: 'DISCHARGED',                     // Pulang Selesai Pelayanan (Terminal / Immutable)
  REFERRED: 'REFERRED',                         // Rujuk ke RS / Faskes Luar (Terminal)
  LEFT_AGAINST_MEDICAL_ADVICE: 'LEFT_AGAINST_MEDICAL_ADVICE', // Pulang Paksa / PAPS (Terminal)
  ABSCONDING: 'ABSCONDING',                     // Pasien Kabur / Tanpa Izin (Terminal)
  HOSPICE: 'HOSPICE',                           // Perawatan Paliatif Akhir Hayat
  DECEASED: 'DECEASED',                         // Meninggal Dunia (Terminal Mutlak)
  CANCELLED: 'CANCELLED'                        // Kunjungan Dibatalkan (Terminal)
};

// Terminal States where encounters are locked and immutable
export const TERMINAL_STATES = new Set([
  CARE_STATES.DISCHARGED,
  CARE_STATES.REFERRED,
  CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE,
  CARE_STATES.ABSCONDING,
  CARE_STATES.DECEASED,
  CARE_STATES.CANCELLED
]);

// 2. Clinical Event Taxonomy (Gate 0B)
export const CLINICAL_EVENTS = {
  REGISTER_PATIENT: 'REGISTER_PATIENT',
  START_TRIAGE: 'START_TRIAGE',
  COMPLETE_TRIAGE: 'COMPLETE_TRIAGE',
  ASSIGN_IGD_BED: 'ASSIGN_IGD_BED',
  START_OBSERVATION: 'START_OBSERVATION',
  REQUEST_ADMISSION: 'REQUEST_ADMISSION',
  ALLOCATE_WARD_BED: 'ALLOCATE_WARD_BED',
  INITIATE_TRANSFER: 'INITIATE_TRANSFER',
  COMPLETE_TRANSFER: 'COMPLETE_TRANSFER',
  TRANSFER_TO_ICU: 'TRANSFER_TO_ICU',
  SCHEDULE_SURGERY: 'SCHEDULE_SURGERY',
  START_SURGERY: 'START_SURGERY',
  COMPLETE_SURGERY: 'COMPLETE_SURGERY',
  START_PACU: 'START_PACU',
  COMPLETE_PACU: 'COMPLETE_PACU',
  START_DISCHARGE: 'START_DISCHARGE',
  COMPLETE_DISCHARGE: 'COMPLETE_DISCHARGE',
  RECORD_DEATH: 'RECORD_DEATH',
  PATIENT_REFERRED: 'PATIENT_REFERRED',
  PATIENT_PAPS: 'PATIENT_PAPS',
  PATIENT_ABSCONDED: 'PATIENT_ABSCONDED',
  CANCEL_ENCOUNTER: 'CANCEL_ENCOUNTER',
  SYSTEM_MIGRATION_BOOTSTRAP: 'SYSTEM_MIGRATION_BOOTSTRAP'
};

// 3. Deterministic Transition Validation Matrix (Gate 0A)
export const TRANSITION_MATRIX = {
  [CARE_STATES.REGISTERED]: [
    CARE_STATES.TRIAGE_PENDING,
    CARE_STATES.OUTPATIENT_ACTIVE,
    CARE_STATES.CANCELLED
  ],
  [CARE_STATES.TRIAGE_PENDING]: [
    CARE_STATES.IGD_ACTIVE,
    CARE_STATES.IGD_OBSERVATION,
    CARE_STATES.CANCELLED
  ],
  [CARE_STATES.IGD_ACTIVE]: [
    CARE_STATES.IGD_OBSERVATION,
    CARE_STATES.ADMISSION_PENDING,
    CARE_STATES.OR_ACTIVE,
    CARE_STATES.DISCHARGED,
    CARE_STATES.REFERRED,
    CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.IGD_OBSERVATION]: [
    CARE_STATES.IGD_ACTIVE,
    CARE_STATES.ADMISSION_PENDING,
    CARE_STATES.DISCHARGED,
    CARE_STATES.REFERRED,
    CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.OUTPATIENT_ACTIVE]: [
    CARE_STATES.ADMISSION_PENDING,
    CARE_STATES.DISCHARGED,
    CARE_STATES.REFERRED,
    CARE_STATES.CANCELLED
  ],
  [CARE_STATES.ADMISSION_PENDING]: [
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.CANCELLED
  ],
  [CARE_STATES.INPATIENT_ACTIVE]: [
    CARE_STATES.TRANSFER_PENDING,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.OR_ACTIVE,
    CARE_STATES.DISCHARGE_PENDING,
    CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE,
    CARE_STATES.ABSCONDING,
    CARE_STATES.HOSPICE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.ICU_ACTIVE]: [
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.OR_ACTIVE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.OR_ACTIVE]: [
    CARE_STATES.PACU_RECOVERY,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.PACU_RECOVERY]: [
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.DECEASED
  ],
  [CARE_STATES.TRANSFER_PENDING]: [
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.TRANSFERRED,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.CANCELLED
  ],
  [CARE_STATES.TRANSFERRED]: [
    CARE_STATES.INPATIENT_ACTIVE,
    CARE_STATES.ICU_ACTIVE,
    CARE_STATES.DISCHARGE_PENDING
  ],
  [CARE_STATES.DISCHARGE_PENDING]: [
    CARE_STATES.DISCHARGED,
    CARE_STATES.INPATIENT_ACTIVE
  ],
  [CARE_STATES.HOSPICE]: [
    CARE_STATES.DISCHARGED,
    CARE_STATES.DECEASED
  ],
  // Terminal States cannot transition anywhere
  [CARE_STATES.DISCHARGED]: [],
  [CARE_STATES.REFERRED]: [],
  [CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE]: [],
  [CARE_STATES.ABSCONDING]: [],
  [CARE_STATES.DECEASED]: [],
  [CARE_STATES.CANCELLED]: []
};

class CareStateEngine {
  constructor() {
    this.EVENTS_COLLECTION = 'patient_care_state_events';
    this.ENCOUNTERS_COLLECTION = 'encounters';
    this.PROJECTIONS_COLLECTION = 'care_state_projections';
  }

  /**
   * Validate if a state transition is permitted by Gate 0A rules.
   */
  isValidTransition(currentState, targetState) {
    if (!currentState) return targetState === CARE_STATES.REGISTERED || targetState === CARE_STATES.TRIAGE_PENDING;
    if (currentState === targetState) return true; // Idempotent no-op

    // Terminal states cannot be reopened
    if (TERMINAL_STATES.has(currentState)) {
      return false;
    }

    const allowed = TRANSITION_MATRIX[currentState] || [];
    return allowed.includes(targetState);
  }

  /**
   * Authoritative Single State Transition Method (Rule 1 & Rule 2)
   * All clinical modules MUST pass through this method.
   */
  async transition({
    encounterId,
    targetState,
    eventType = CLINICAL_EVENTS.START_TRIAGE,
    location = null,
    bedId = null,
    actorId = 'EMP-SYS-001',
    actorName = 'Petugas Medis',
    actorRole = 'STAFF',
    reason = '',
    clinicalNotes = '',
    secondaryStates = null,
    metadata = {}
  }) {
    if (!encounterId) throw new Error('[CareStateEngine] encounterId is mandatory');
    if (!targetState || !CARE_STATES[targetState]) {
      throw new Error(`[CareStateEngine] Invalid targetState: "${targetState}"`);
    }

    // 1. Fetch current Encounter
    const encounter = await persistenceAdapter.findById(this.ENCOUNTERS_COLLECTION, encounterId);
    if (!encounter) {
      throw new Error(`[CareStateEngine] Encounter "${encounterId}" not found`);
    }

    const currentState = encounter.primaryState || encounter.status || CARE_STATES.REGISTERED;

    // 2. Validate Transition
    if (!this.isValidTransition(currentState, targetState)) {
      throw new Error(
        `[CareStateEngine] Illegal state transition from "${currentState}" to "${targetState}". Encounters in terminal state or invalid sequence cannot be executed.`
      );
    }

    const isTerminal = TERMINAL_STATES.has(targetState);
    const timestamp = new Date().toISOString();
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 3. Handle ADT Bed Synchronizations (Atomic Bed State Allocation / Release)
    let finalLocation = location || encounter.location || {
      departmentId: encounter.departmentId || 'DEPT-GENERAL',
      departmentName: encounter.departmentName || 'Pelayanan Umum'
    };

    if (bedId) {
      try {
        adtEngine.assignPatientToBed(
          bedId,
          encounter.patientId,
          encounter.patientName,
          encounter.id,
          actorName
        );
        finalLocation = {
          ...finalLocation,
          bedId,
          bedCode: bedId.split('-').pop()
        };
      } catch (err) {
        console.warn(`[CareStateEngine] ADT Bed Assignment notice: ${err.message}`);
      }
    } else if (isTerminal && encounter.location?.bedId) {
      try {
        adtEngine.dischargeBed(encounter.location.bedId, actorName);
      } catch (err) {
        console.warn(`[CareStateEngine] ADT Bed Release notice: ${err.message}`);
      }
    }

    // 4. Create and Save Immutable Event Sourcing Record (Gate 0B & Gate 0D)
    const careEvent = {
      id: eventId,
      encounter_id: encounterId,
      patient_id: encounter.patientId,
      event_type: eventType,
      previous_state: currentState,
      new_state: targetState,
      secondary_states: secondaryStates || encounter.secondaryStates || [],
      location: finalLocation,
      performed_by_id: actorId,
      performed_by_name: actorName,
      performed_by_role: actorRole,
      performed_at: timestamp,
      reason: reason || `Transisi klinis: ${currentState} ➔ ${targetState}`,
      clinical_notes: clinicalNotes,
      metadata: {
        ...metadata,
        encounterNumber: encounter.encounterNumber,
        mrn: encounter.mrn
      }
    };

    await persistenceAdapter.save(this.EVENTS_COLLECTION, careEvent.id, careEvent);

    // 5. Update Encounter Entity (Single Source of Truth Projection)
    encounter.primaryState = targetState;
    encounter.status = targetState; // Backward compatibility bridge
    encounter.isTerminal = isTerminal;
    encounter.location = finalLocation;
    if (secondaryStates) encounter.secondaryStates = secondaryStates;
    if (targetState === CARE_STATES.DISCHARGED) encounter.dischargeDate = timestamp;
    encounter.updatedAt = timestamp;
    encounter.lastEventId = eventId;

    const savedEncounter = await persistenceAdapter.save(this.ENCOUNTERS_COLLECTION, encounter.id, encounter);

    // 6. Update Active Care State Projection Cache
    await persistenceAdapter.save(this.PROJECTIONS_COLLECTION, encounter.id, {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      mrn: encounter.mrn,
      patientName: encounter.patientName,
      primaryState: targetState,
      secondaryStates: encounter.secondaryStates || [],
      location: finalLocation,
      dpjpId: encounter.dpjpId,
      dpjpName: encounter.dpjpName,
      isTerminal,
      lastEventId: eventId,
      updatedAt: timestamp
    });

    // 7. Publish Domain Event for Subscribers (Rule 2)
    domainEventEngine.publish(DOMAIN_EVENTS.PATIENT_CARE_STATE_CHANGED || 'PATIENT_CARE_STATE_CHANGED', {
      encounterId: savedEncounter.id,
      patientId: savedEncounter.patientId,
      mrn: savedEncounter.mrn,
      previousState: currentState,
      newState: targetState,
      eventType,
      location: finalLocation,
      actorName,
      actorRole,
      timestamp,
      eventId
    }, actorName);

    // 8. Record JCI Timeline Audit Trail
    clinicalTimelineEngine.recordEvent({
      patientId: savedEncounter.patientId,
      encounterId: savedEncounter.id,
      type: 'CARE_STATE_CHANGED',
      sourceEntityType: 'CareStateTransition',
      sourceEntityId: eventId,
      title: `Perubahan Status Pelayanan: ${currentState} ➔ ${targetState}`,
      actor: `${actorName} (${actorRole})`,
      icon: isTerminal ? 'task_alt' : 'clinical_notes'
    });

    return {
      success: true,
      encounter: savedEncounter,
      event: careEvent
    };
  }

  /**
   * Retrieve full event history for an encounter (Gate 0D)
   */
  async getEventStreamByEncounter(encounterId) {
    const allEvents = await persistenceAdapter.query(this.EVENTS_COLLECTION);
    return allEvents
      .filter(e => e.encounter_id === encounterId)
      .sort((a, b) => new Date(a.performed_at) - new Date(b.performed_at));
  }

  /**
   * Retrieve active care state for an encounter
   */
  async getCareState(encounterId) {
    const enc = await persistenceAdapter.findById(this.ENCOUNTERS_COLLECTION, encounterId);
    if (!enc) return null;
    return {
      primaryState: enc.primaryState || enc.status || CARE_STATES.REGISTERED,
      secondaryStates: enc.secondaryStates || [],
      location: enc.location || null,
      isTerminal: TERMINAL_STATES.has(enc.primaryState || enc.status)
    };
  }
}

export const careStateEngine = new CareStateEngine();
export default careStateEngine;
