import { describe, it, expect } from 'vitest';
import { hospitalMetricsService } from '../server/services/hospitalMetrics.service.js';

describe('Hospital Operational Metrics (Barber-Johnson & Emergency Door-to-Doctor SLA)', () => {
  it('should calculate accurate Barber-Johnson Inpatient Indicators (BOR, ALOS, TOI, BTO)', () => {
    const metrics = hospitalMetricsService.calculateInpatientMetrics({
      totalBeds: 100,
      totalBedDaysInPeriod: 30, // 3000 Bed-Days
      totalPatientDays: 2100,   // 70% BOR
      totalDischargedPatients: 420
    });

    expect(metrics.bor).toBe(70.00);
    expect(metrics.isBorOptimal).toBe(true);
    expect(metrics.alos).toBe(5.00); // 2100 / 420 = 5.0
    expect(metrics.isAlosOptimal).toBe(true);
    expect(metrics.toi).toBe(2.14); // (3000 - 2100) / 420 = 2.14
    expect(metrics.isToiOptimal).toBe(true);
  });

  it('should evaluate Emergency Door-to-Doctor SLA compliance', () => {
    // ATS P2 Emergent: Target 10 mins
    const p2Compliance = hospitalMetricsService.evaluateEmergencySla('P2_EMERGENT', 7);
    expect(p2Compliance.isCompliant).toBe(true);
    expect(p2Compliance.varianceMinutes).toBe(-3);

    const p2Breached = hospitalMetricsService.evaluateEmergencySla('P2_EMERGENT', 18);
    expect(p2Breached.isCompliant).toBe(false);
    expect(p2Breached.varianceMinutes).toBe(8);
  });
});
