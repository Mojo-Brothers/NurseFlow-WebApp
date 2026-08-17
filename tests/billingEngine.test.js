import { describe, it, expect } from 'vitest';
import { billingEngineService } from '../src/modules/billing/services/billingEngine.service.js';

describe('BillingEngineService — Revenue Cycle & Claims', () => {
  it('should calculate INA-CBGs variance correctly for profitable surplus', () => {
    const analysis = billingEngineService.calculateInacbgVariance(3500000, 4800000);
    expect(analysis.variance).toBe(1300000);
    expect(analysis.status).toBe('PROFITABLE_SURPLUS');
  });

  it('should calculate INA-CBGs variance correctly for potential deficit', () => {
    const analysis = billingEngineService.calculateInacbgVariance(6200000, 5000000);
    expect(analysis.variance).toBe(-1200000);
    expect(analysis.status).toBe('POTENTIAL_DEFICIT');
  });
});
