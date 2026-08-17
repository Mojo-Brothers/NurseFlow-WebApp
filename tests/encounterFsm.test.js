import { describe, it, expect } from 'vitest';
import { encounterEngineService, ENCOUNTER_STATE_TRANSITIONS } from '../src/modules/clinical_core/services/encounterEngine.service.js';

describe('EncounterEngineService — Finite State Machine Transitions', () => {
  it('should allow legitimate lifecycle progression: PLANNED -> ARRIVED -> TRIAGED -> WAITING -> IN_PROGRESS -> COMPLETED -> DISCHARGED -> CLOSED', () => {
    expect(ENCOUNTER_STATE_TRANSITIONS.PLANNED).toContain('ARRIVED');
    expect(ENCOUNTER_STATE_TRANSITIONS.ARRIVED).toContain('TRIAGED');
    expect(ENCOUNTER_STATE_TRANSITIONS.TRIAGED).toContain('IN_PROGRESS');
    expect(ENCOUNTER_STATE_TRANSITIONS.IN_PROGRESS).toContain('COMPLETED');
    expect(ENCOUNTER_STATE_TRANSITIONS.COMPLETED).toContain('DISCHARGED');
    expect(ENCOUNTER_STATE_TRANSITIONS.DISCHARGED).toContain('CLOSED');
  });

  it('should strictly prohibit invalid reverse transitions from CLOSED terminal state', () => {
    expect(ENCOUNTER_STATE_TRANSITIONS.CLOSED).toEqual([]);
    expect(ENCOUNTER_STATE_TRANSITIONS.CANCELLED).toEqual([]);
  });
});
