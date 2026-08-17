import { describe, it, expect } from 'vitest';
import { universalOrderEngineService, ALLOWED_ORDER_TRANSITIONS } from '../src/modules/orders/services/universalOrderEngine.service.js';

describe('UniversalOrderEngineService — FSM Transitions', () => {
  it('should only permit legitimate transitions from DRAFT to ORDERED or CANCELLED', () => {
    expect(ALLOWED_ORDER_TRANSITIONS.DRAFT).toEqual(['ORDERED', 'CANCELLED']);
    expect(ALLOWED_ORDER_TRANSITIONS.ORDERED).toEqual(['VERIFIED', 'CANCELLED']);
    expect(ALLOWED_ORDER_TRANSITIONS.VERIFIED).toEqual(['IN_PROGRESS', 'CANCELLED']);
    expect(ALLOWED_ORDER_TRANSITIONS.IN_PROGRESS).toEqual(['COMPLETED', 'CANCELLED']);
  });

  it('should reject invalid transition attempts e.g. COMPLETED to DRAFT', () => {
    expect(ALLOWED_ORDER_TRANSITIONS.COMPLETED).toEqual([]);
  });
});
