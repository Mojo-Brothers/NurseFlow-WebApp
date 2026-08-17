/**
 * NurseFlow Enterprise HIS 2026 — Emergency Resuscitation & Disposition Workflow Engine
 * Sprint 3: Code Blue / Resuscitation Timeline Logger & Inpatient ADT Escalation
 * Standar Kepatuhan: AHA ACLS 2025, JCI 7th Edition (Resuscitation Standards).
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { encounterEngineService } from '../../clinical_core/services/encounterEngine.service.js';

const RESUSCITATION_EVENTS_KEY = 'nurseflow_emergency_resuscitation_events';

const getStoredResusEvents = () => {
  try {
    const raw = localStorage.getItem(RESUSCITATION_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[EmergencyWorkflowEngine] Failed to load resus events:', e);
  }
  return [];
};

const saveStoredResusEvents = (events) => {
  try {
    localStorage.setItem(RESUSCITATION_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn('[EmergencyWorkflowEngine] Failed to save resus events:', e);
  }
};

export const emergencyWorkflowEngineService = {
  /**
   * Log Immediate Resuscitation Action (ACLS Timeline)
   */
  logResuscitationEvent: async ({
    encounterId,
    eventType, // 'AIRWAY_INTUBATION' | 'CPR_CYCLE' | 'DEFIBRILLATION' | 'EPINEPHRINE_DOSE' | 'FLUID_BOLUS' | 'ROSC_ACHIEVED'
    performerName = 'Tim Resusitasi IGD',
    doseOrJoules = '',
    notes = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const eventRecord = {
      id: `RESUS-EVT-${Date.now()}`,
      encounter_id: encounterId,
      event_type: eventType,
      event_timestamp: now,
      performer_name: performerName,
      dose_or_joules: doseOrJoules,
      notes,
      created_at: now
    };

    const events = getStoredResusEvents();
    saveStoredResusEvents([eventRecord, ...events]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'RESUSCITATION',
      aggregateId: eventRecord.id,
      eventName: 'RESUSCITATION_EVENT_LOGGED',
      payload: eventRecord,
      actor: actorEmail
    });

    return eventRecord;
  },

  /**
   * Decide Patient Emergency Disposition (Admit Ranap, OK Cito, Pulang, Rujuk)
   */
  decideDisposition: async ({
    encounterId,
    episodeId,
    dispositionType, // 'ADMIT_ICU' | 'ADMIT_WARD' | 'EMERGENCY_OR' | 'DISCHARGE_HOME' | 'TRANSFER_EXTERNAL'
    destinationWardName = 'Ruang ICU / Bangsal',
    transferNotes = '',
    doctorName = 'dr. Jaga Emergensi',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();

    const dispositionRecord = {
      id: `DISPO-${Date.now()}`,
      encounter_id: encounterId,
      episode_id: episodeId,
      disposition_type: dispositionType,
      destination_ward_name: destinationWardName,
      transfer_notes: transferNotes,
      decided_by: doctorName,
      decided_at: now
    };

    // Transition encounter status
    const nextStatus = dispositionType === 'DISCHARGE_HOME' ? 'DISCHARGED' : 'COMPLETED';
    await encounterEngineService.transitionEncounterStatus({
      encounterId,
      nextStatus,
      reason: `Disposisi IGD: ${dispositionType} ke ${destinationWardName}`,
      actorEmail
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'EMERGENCY_DISPOSITION',
      aggregateId: dispositionRecord.id,
      eventName: 'EMERGENCY_DISPOSITION_DECIDED',
      payload: dispositionRecord,
      actor: actorEmail
    });

    return dispositionRecord;
  },

  /**
   * Get Resuscitation Timeline Logs
   */
  getResuscitationTimeline: (encounterId) => {
    const events = getStoredResusEvents();
    return events.filter(e => e.encounter_id === encounterId);
  }
};
