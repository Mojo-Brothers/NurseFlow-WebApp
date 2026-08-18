/**
 * NurseFlow Enterprise HIS — Clinical Timeline Engine Service
 * Authoritative Chronological Clinical Event Read Model / Projection
 * Enforces mandatory source entity pointers (sourceEntityType & sourceEntityId) for 100% traceability to domain transactions.
 * Backed by Multi-Tier Persistence (RAM Memory + LocalStorage Mirror) to prevent event loss on browser reload (F5).
 */

const TIMELINE_STORAGE_KEY = 'nurseflow_timeline_events';

class ClinicalTimelineEngine {
  constructor() {
    this.timelineEvents = [];
    this.initializeTimeline();
  }

  initializeTimeline() {
    this.timelineEvents = this._loadFromLocalStorage();
  }

  // ─── LocalStorage Synchronization Helpers ──────────────────────────────
  _loadFromLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[ClinicalTimelineEngine] Failed to load timeline from localStorage:', err.message);
      }
    }
    return [];
  }

  _saveToLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(this.timelineEvents.slice(0, 500)));
      } catch (err) {
        console.warn('[ClinicalTimelineEngine] Failed to save timeline to localStorage:', err.message);
      }
    }
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

    // Ensure memory array is fresh
    if (this.timelineEvents.length === 0) {
      this.timelineEvents = this._loadFromLocalStorage();
    }

    this.timelineEvents.unshift(event);
    this._saveToLocalStorage();
    return event;
  }

  getPatientTimeline(patientId) {
    if (!patientId) return [];
    
    // Always re-hydrate from localStorage to ensure cross-tab & reload freshness
    const allEvents = this._loadFromLocalStorage();
    this.timelineEvents = allEvents;

    return allEvents
      .filter(e => e.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  clearAll() {
    this.timelineEvents = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TIMELINE_STORAGE_KEY);
    }
  }
}

export const clinicalTimelineEngine = new ClinicalTimelineEngine();
export default clinicalTimelineEngine;
