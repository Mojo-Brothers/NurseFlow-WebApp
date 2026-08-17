import { describe, it, expect } from 'vitest';
import { cdssEngineService } from '../src/modules/emr/services/cdssEngine.service.js';

describe('CdssEngineService — Renal & Interaction CDSS Prescribing Guard', () => {
  it('should alert for critical block when Metformin is prescribed with eGFR < 30 mL/min', async () => {
    const result = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId: 'ENC-TEST-01',
      patientId: 'P-1001',
      prescribedDrugName: 'Metformin 500mg',
      patientEgfr: 22,
      activeMedications: []
    });

    expect(result.hasAlerts).toBe(true);
    expect(result.hasCriticalBlock).toBe(true);
    const renalAlert = result.alerts.find(a => a.alert_type === 'RENAL_DOSAGE_ADJUSTMENT');
    expect(renalAlert).toBeDefined();
    expect(renalAlert.severity).toBe('CRITICAL_BLOCK');
  });

  it('should detect major Drug-Drug Interaction between Simvastatin and Amlodipine', async () => {
    const result = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId: 'ENC-TEST-02',
      patientId: 'P-1001',
      prescribedDrugName: 'Simvastatin 20mg',
      patientEgfr: 85,
      activeMedications: ['Amlodipine 10mg']
    });

    expect(result.hasAlerts).toBe(true);
    const ddiAlert = result.alerts.find(a => a.alert_type === 'DRUG_DRUG_INTERACTION');
    expect(ddiAlert).toBeDefined();
    expect(ddiAlert.title).toContain('Simvastatin + Amlodipine');
  });

  it('should pass with 0 alerts when there are no contraindications or interactions', async () => {
    const result = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId: 'ENC-TEST-03',
      patientId: 'P-1001',
      prescribedDrugName: 'Vitamin C 500mg',
      patientEgfr: 90,
      activeMedications: []
    });

    expect(result.hasAlerts).toBe(false);
    expect(result.hasCriticalBlock).toBe(false);
    expect(result.alerts).toHaveLength(0);
  });
});
