import { describe, it, expect } from 'vitest';
import { lisPacsEngineService, SPECIMEN_STATUS } from '../server/services/lisPacsEngine.service.js';

describe('LIS & RIS/PACS Clinical Engine (Specimen Lifecycle, Panic Alerts & DICOM Worklist)', () => {
  it('should track laboratory specimen collection and assign barcode', () => {
    const specimen = lisPacsEngineService.collectSpecimen({
      orderId: 'ORD-LAB-01',
      patientId: 'P-1001',
      testCode: '718-7',
      phlebotomistName: 'Analis Laboratorium Rina'
    });

    expect(specimen.specimenBarcode).toBeDefined();
    expect(specimen.status).toBe(SPECIMEN_STATUS.COLLECTED);
  });

  it('should trigger Critical Panic Value Alert when Potassium / Troponin reaches life-threatening levels', () => {
    // Critical Panic Potassium: < 2.5 or > 6.5 mmol/L (Current: 7.2 mmol/L)
    const result = lisPacsEngineService.validateLabResult({
      specimenBarcode: 'SPEC-TEST-99',
      testCode: '2823-3', // Potassium
      numericValue: 7.2,
      refLow: 3.5,
      refHigh: 5.1,
      panicLow: 2.5,
      panicHigh: 6.5,
      analystName: 'Sp.PK dr. Hendro'
    });

    expect(result.isCriticalPanic).toBe(true);
    expect(result.interpretation).toBe('CRITICAL_PANIC_VALUE');
    expect(lisPacsEngineService.getCriticalAlerts().length).toBeGreaterThan(0);
  });

  it('should generate valid DICOM Study Instance UID and Viewer URL for RIS/PACS', () => {
    const dicom = lisPacsEngineService.generateDicomStudy({
      orderId: 'ORD-RAD-01',
      patientMrn: 'MRN-2026-001001',
      modality: 'CR',
      procedureName: 'Thorax PA Digital'
    });

    expect(dicom.studyInstanceUid).toContain('1.2.840.113619.2.');
    expect(dicom.pacsViewerUrl).toContain('https://pacs.nurseflow.org/viewer?study=');
  });
});
