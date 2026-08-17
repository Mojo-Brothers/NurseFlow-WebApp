/**
 * NurseFlow Enterprise HIS — Clinical Timeline Engine Service
 * Authoritative Chronological Clinical Event Read Model / Projection
 * Enforces mandatory source entity pointers (sourceEntityType & sourceEntityId) for 100% traceability to domain transactions.
 */

class ClinicalTimelineEngine {
  constructor() {
    this.timelineEvents = [];
    this.initializeSampleTimeline();
  }

  initializeSampleTimeline() {
    this.timelineEvents = [];
  }

  // Record Projected Timeline Event from Domain Transaction Event
  recordEvent({ patientId, encounterId, episodeId = null, type, sourceEntityType, sourceEntityId, title, actor, payload = {}, icon = 'analytics' }) {
    if (!sourceEntityType || !sourceEntityId) {
      throw new Error(`[ClinicalTimelineEngine] TRACEABILITY_ERROR: Timeline projection events must specify sourceEntityType and sourceEntityId.`);
    }

    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      encounterId,
      episodeId,
      type,
      sourceEntityType,
      sourceEntityId,
      title,
      actor,
      payload,
      icon,
      timestamp: new Date().toISOString()
    };

    this.timelineEvents.push(event);
    return event;
  }

  getPatientTimeline(patientId) {
    return this.timelineEvents
      .filter(e => e.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export const clinicalTimelineEngine = new ClinicalTimelineEngine();
export default clinicalTimelineEngine;
