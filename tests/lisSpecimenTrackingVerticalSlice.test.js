import { describe, it, expect } from 'vitest';
import { lisPacsEngineService, SPECIMEN_STATUS } from '../server/services/lisPacsEngine.service.js';

describe('Gate 1D.7: Laboratory Information System (LIS) & Specimen Tracking Vertical Slice', () => {

  // 1. Specimen Collection & Barcode Generation
  it('1. should collect specimen with structured barcode and vacutainer tube assignment', () => {
    const specimen = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-TEST-01',
      encounterId: 'ENC-LAB-TEST-01',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      specimenType: 'EDTA_WHOLE_BLOOD',
      vacutainerTubeColor: 'PURPLE_EDTA',
      phlebotomistName: 'Analis Rina, A.Md.AK'
    });

    expect(specimen.specimenBarcode).toMatch(/^LAB-\d{4}-\d{4}$/);
    expect(specimen.status).toBe(SPECIMEN_STATUS.COLLECTED);
    expect(specimen.phlebotomistName).toBe('Analis Rina, A.Md.AK');
    expect(specimen.vacutainerTubeColor).toBe('PURPLE_EDTA');
  });

  // 2. Specimen Accessioning & Chain of Custody in Lab
  it('2. should accession specimen in central lab and log transport temperature', () => {
    const collected = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-TEST-02',
      encounterId: 'ENC-LAB-TEST-02',
      patientId: 'P-1002',
      patientMrn: 'MRN-2026-001002',
      specimenType: 'SERUM_SST',
      vacutainerTubeColor: 'YELLOW_SST',
      phlebotomistName: 'Analis Rina, A.Md.AK'
    });

    const received = lisPacsEngineService.receiveSpecimenInLab({
      specimenBarcode: collected.specimenBarcode,
      receivingAnalystName: 'Analis Budi, S.Tr.Kes',
      transportTemperatureCelsius: 4.2
    });

    expect(received.status).toBe(SPECIMEN_STATUS.RECEIVED_IN_LAB);
    expect(received.receivingAnalystName).toBe('Analis Budi, S.Tr.Kes');
    expect(received.transportTemperatureCelsius).toBe(4.2);
    expect(received.history.length).toBe(3);
  });

  // 3. Normal & Abnormal Result Validation
  it('3. should enter and validate analytical results with reference ranges', () => {
    const spec = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-TEST-03',
      encounterId: 'ENC-LAB-TEST-03',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001'
    });

    // Normal Sodium: 138 (Ref: 135 - 145)
    const normalRes = lisPacsEngineService.enterAndValidateResult({
      specimenBarcode: spec.specimenBarcode,
      testCode: 'LOINC-2951-2',
      testName: 'Natrium Serum (Na+)',
      numericValue: 138,
      unit: 'mmol/L',
      refLow: 135,
      refHigh: 145,
      analystName: 'Analis Budi'
    });

    expect(normalRes.isAbnormal).toBe(false);
    expect(normalRes.isCriticalPanic).toBe(false);
  });

  // 4. Critical Panic Value Detection (JCI IPSG 2)
  it('4. should auto-detect critical panic values and generate escalation record for Severe Lactic Acidosis', () => {
    const spec = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-TEST-04',
      encounterId: 'ENC-LAB-TEST-04',
      patientId: 'P-1003',
      patientMrn: 'MRX-2026-A1'
    });

    // Severe Lactic Acidosis (5.2 mmol/L, Panic Threshold >= 4.0 mmol/L)
    const panicRes = lisPacsEngineService.enterAndValidateResult({
      specimenBarcode: spec.specimenBarcode,
      testCode: 'LOINC-2524-7', // Lactate
      testName: 'Laktat Darah Kuantitatif',
      numericValue: 5.2,
      unit: 'mmol/L',
      refLow: 0.5,
      refHigh: 2.0,
      analystName: 'Analis Budi'
    });

    expect(panicRes.isAbnormal).toBe(true);
    expect(panicRes.isCriticalPanic).toBe(true);
    expect(panicRes.panicThreat).toContain('Severe Sepsis');

    // Verify Panic Alert entry was pushed to queue
    const alerts = lisPacsEngineService.getPanicAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].specimenBarcode).toBe(spec.specimenBarcode);
  });

  // 5. JCI IPSG 2 Mandatory Read-Back Confirmation
  it('5. should record mandatory read-back verification for panic value reporting', () => {
    const alerts = lisPacsEngineService.getPanicAlerts();
    const alertId = alerts[0].alertId;

    const confirmed = lisPacsEngineService.confirmPanicValueReadBack({
      alertId,
      reportedToClinicianName: 'dr. Surya Johnson, Sp.PD (DPJP IGD)',
      reportedByAnalystName: 'Analis Budi, S.Tr.Kes',
      readBackConfirmedText: 'dr. Surya Johnson telah membacakan ulang nilai kritis Laktat 5.2 mmol/L'
    });

    expect(confirmed.status).toBe('ACKNOWLEDGED_READ_BACK');
    expect(confirmed.reportedTo).toBe('dr. Surya Johnson, Sp.PD (DPJP IGD)');
    expect(confirmed.readBackConfirmedAt).toBeDefined();
  });

  // 6. Delta Check Detection (> 50% Variance)
  it('6. should detect significant variance via Delta Check mechanism', () => {
    const spec = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-TEST-05',
      encounterId: 'ENC-LAB-TEST-05',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001'
    });

    // Previous K+ was 3.5, new is 5.8 (+65% jump)
    const deltaRes = lisPacsEngineService.enterAndValidateResult({
      specimenBarcode: spec.specimenBarcode,
      testCode: 'LOINC-2823-3',
      testName: 'Kalium Serum',
      numericValue: 5.8,
      unit: 'mmol/L',
      refLow: 3.5,
      refHigh: 5.0,
      analystName: 'Analis Budi',
      previousNumericValue: 3.5
    });

    expect(deltaRes.deltaFlag).toBe('SIGNIFICANT_RISE');
  });
});
