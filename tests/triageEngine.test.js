import { describe, it, expect } from 'vitest';
import { triageEngineService, TRIAGE_LEVEL_SPECS } from '../src/modules/emergency/services/triageEngine.service.js';

describe('TriageEngineService — ATS / ESI Clinical Scorer', () => {
  it('should classify obstructed airway or apnea as P1_RESUSCITATION with 0 min response target', () => {
    const result = triageEngineService.classifySeverity({
      airwayStatus: 'OBSTRUCTED',
      breathingStatus: 'APNEA',
      circulationStatus: 'SHOCK',
      spo2: 70,
      heartRate: 140,
      gcsTotal: 6,
      painScale: 10
    });

    expect(result.code).toBe('P1_RESUSCITATION');
    expect(result.targetMinutes).toBe(0);
    expect(result.level).toBe(1);
  });

  it('should classify acute dyspnea with SpO2 <= 92% and severe pain as P2_EMERGENT with 10 min response target', () => {
    const result = triageEngineService.classifySeverity({
      airwayStatus: 'PATENT',
      breathingStatus: 'DYSPNEA',
      circulationStatus: 'HEMORRHAGE',
      spo2: 90,
      heartRate: 120,
      gcsTotal: 12,
      painScale: 8
    });

    expect(result.code).toBe('P2_EMERGENT');
    expect(result.targetMinutes).toBe(10);
    expect(result.level).toBe(2);
  });

  it('should calculate GCS properly from Eye, Verbal, and Motor components', () => {
    const gcs = triageEngineService.calculateGcs(4, 5, 6);
    expect(gcs.total).toBe(15);

    const gcsComa = triageEngineService.calculateGcs(1, 1, 1);
    expect(gcsComa.total).toBe(3);
  });
});
