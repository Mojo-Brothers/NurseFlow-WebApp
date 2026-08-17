import { describe, it, expect } from 'vitest';
import { criticalCareService } from '../server/services/criticalCare.service.js';

describe('ICU & Critical Care Clinical Scoring (SOFA & Fluid Balance)', () => {
  it('should calculate accurate SOFA Score and classify severe organ failure risk', () => {
    const sofa = criticalCareService.calculateSofaScore({
      pao2Fio2Ratio: 180, // Score: 3
      platelets: 45000,   // Score: 3
      bilirubin: 3.5,     // Score: 2
      meanArterialPressure: 60, // Score: 1
      onVasopressors: true, // Score: 3
      gcs: 8,             // Score: 3
      creatinine: 3.8     // Score: 3
    });

    expect(sofa.totalSofa).toBeGreaterThanOrEqual(12);
    expect(sofa.isSepsisOrganFailure).toBe(true);
    expect(sofa.riskCategory).toContain('HIGH_MORTALITY_RISK');
  });

  it('should calculate 24-Hour fluid balance accurately', () => {
    const balance = criticalCareService.calculateFluidBalance({
      oralIntake: 500,
      ivFluids: 2000,
      urineOutput: 1500,
      drainage: 200,
      insensibleLoss: 500
    });

    expect(balance.totalIntake).toBe(2500);
    expect(balance.totalOutput).toBe(2200);
    expect(balance.netBalance).toBe(300);
    expect(balance.interpretation).toBe('EUVOLEMIC_BALANCED');
  });
});
