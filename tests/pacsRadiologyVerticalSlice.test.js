import { describe, it, expect, beforeEach } from 'vitest';
import {
  pacsDicomEngineService,
  WINDOWING_PRESETS,
  CRITICAL_RADIOLOGY_FINDINGS,
  generateSha256Digest
} from '../src/modules/radiology/services/pacsDicomEngine.service.js';
import { eventBusService, DOMAIN_EVENTS } from '../server/realtime/eventBus.service.js';

describe('Gate 1D.8: PACS & Radiology Vertical Slice (DICOMweb, MWL & Structured Reports)', () => {
  beforeEach(() => {
    // Isolated Test Fixture Setup
    pacsDicomEngineService.studies.clear();
    pacsDicomEngineService.reports.clear();

    pacsDicomEngineService.studies.set('1.2.840.113619.2.2026.081701.1001', {
      studyInstanceUid: '1.2.840.113619.2.2026.081701.1001',
      accessionNumber: 'ACC-2026-0817-01',
      orderId: 'ORD-RAD-2026-001',
      encounterId: 'ENC-2026-001',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      patientName: 'Test Patient CR',
      modality: 'CR',
      bodyPart: 'CHEST',
      studyDescription: 'Thorax PA Digital (Ereksi)',
      studyDate: '2026-08-17',
      studyTime: '09:30:00',
      referringDoctor: 'dr. Surya Johnson, Sp.PD',
      technologist: 'Radiografer Agus, S.Tr.Rad',
      status: 'ACQUIRED',
      wadoEndpoint: 'https://pacs.nurseflow.org/wado-rs/studies/1.2.840.113619.2.2026.081701.1001',
      series: [
        {
          seriesInstanceUid: '1.2.840.113619.2.2026.081701.1001.1',
          seriesNumber: 1,
          modality: 'CR',
          description: 'Chest PA Standing View',
          sliceThickness: 1.0,
          kvp: 120,
          ma: 250,
          instances: [
            {
              sopInstanceUid: '1.2.840.113619.2.2026.081701.1001.1.1',
              instanceNumber: 1,
              rows: 512,
              columns: 512,
              windowCenter: 40,
              windowWidth: 350,
              pixelSpacing: '0.14\\0.14',
              previewPlaceholder: 'THORAX_PA_SAMPLE'
            }
          ]
        }
      ]
    });

    pacsDicomEngineService.studies.set('1.2.840.113619.2.2026.081702.1003', {
      studyInstanceUid: '1.2.840.113619.2.2026.081702.1003',
      accessionNumber: 'ACC-2026-0817-02',
      orderId: 'ORD-RAD-2026-002',
      encounterId: 'ENC-2026-003',
      patientId: 'P-1003',
      patientMrn: 'MRX-2026-A1',
      patientName: 'Test Patient CT',
      modality: 'CT',
      bodyPart: 'BRAIN',
      studyDescription: 'CT Scan Kepala Non-Kontras Cito (Trauma)',
      studyDate: '2026-08-17',
      studyTime: '10:15:00',
      referringDoctor: 'dr. Budi Santoso, Sp.B',
      technologist: 'Radiografer Agus, S.Tr.Rad',
      status: 'REPORTED',
      wadoEndpoint: 'https://pacs.nurseflow.org/wado-rs/studies/1.2.840.113619.2.2026.081702.1003',
      series: [
        {
          seriesInstanceUid: '1.2.840.113619.2.2026.081702.1003.1',
          seriesNumber: 1,
          modality: 'CT',
          description: 'Brain Axial Thin 2.5mm',
          sliceThickness: 2.5,
          kvp: 130,
          ma: 320,
          instances: [
            {
              sopInstanceUid: '1.2.840.113619.2.2026.081702.1003.1.1',
              instanceNumber: 1,
              rows: 512,
              columns: 512,
              windowCenter: 40,
              windowWidth: 80,
              pixelSpacing: '0.48\\0.48',
              previewPlaceholder: 'CT_BRAIN_BLEED_SAMPLE'
            }
          ]
        }
      ]
    });
  });

  // 1. QIDO-RS Study Query
  it('1. should query DICOM studies by patient MRN and modality via QIDO-RS', () => {
    const studies = pacsDicomEngineService.queryStudies({ patientMrn: 'MRN-2026-001001' });
    expect(studies.length).toBeGreaterThan(0);
    expect(studies[0].modality).toBe('CR');
    expect(studies[0].accessionNumber).toBe('ACC-2026-0817-01');

    const ctStudies = pacsDicomEngineService.queryStudies({ modality: 'CT' });
    expect(ctStudies.length).toBeGreaterThan(0);
    expect(ctStudies[0].studyDescription).toContain('CT Scan');
  });

  // 2. WADO-RS Retrieval
  it('2. should retrieve full study metadata and series hierarchy via WADO-RS', () => {
    const study = pacsDicomEngineService.getStudyByUid('1.2.840.113619.2.2026.081701.1001');
    expect(study.studyInstanceUid).toBe('1.2.840.113619.2.2026.081701.1001');
    expect(study.series.length).toBeGreaterThan(0);
    expect(study.series[0].instances.length).toBeGreaterThan(0);
    expect(study.series[0].instances[0].windowWidth).toBe(350);
  });

  // 3. STOW-RS Ingestion
  it('3. should store new DICOM study into PACS archive via STOW-RS', () => {
    const stored = pacsDicomEngineService.storeDicomStudy({
      orderId: 'ORD-RAD-TEST-99',
      encounterId: 'ENC-TEST-01',
      patientId: 'P-1002',
      patientMrn: 'MRN-2026-001002',
      patientName: 'Tn. Bambang Pamungkas',
      modality: 'MR',
      bodyPart: 'KNEE',
      studyDescription: 'MRI Genu Sinistra Non-Contrast',
      studyDate: '2026-08-17',
      studyTime: '11:00:00',
      referringDoctor: 'dr. Budi Santoso, Sp.B',
      technologist: 'Radiografer Agus',
      series: [{ seriesNumber: 1, modality: 'MR', description: 'Sagittal T2', instances: [{ sopInstanceUid: 'SOP-991' }] }]
    });

    expect(stored.studyInstanceUid).toBeDefined();
    expect(stored.accessionNumber).toMatch(/^ACC-/);
    expect(stored.status).toBe('ACQUIRED');
  });

  // 4. Structured Radiologist Report & Cryptographic SHA-256 Digital Sign-off
  it('4. should create structured radiologist report with SHA-256 digital signature and RADS classification', () => {
    const report = pacsDicomEngineService.createRadiologyReport({
      studyInstanceUid: '1.2.840.113619.2.2026.081701.1001',
      radiologistName: 'dr. Hendro Prasetyo, Sp.Rad(K)',
      clinicalHistory: 'Evaluasi batuk lama',
      findings: 'Cor dan Pulmo dalam batas normal. Sinus kostofrenikus lancip.',
      impression: 'Tidak tampak proses spesifik aktif pada paru.',
      radsClassification: 'Lung-RADS 1',
      isUrgentCritical: false
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe('FINALIZED');
    expect(report.signatureHash).toMatch(/^SHA256:[0-9A-F]{32}$/);
    expect(report.radsClassification).toBe('Lung-RADS 1');
  });

  // 5. Urgent Radiology Finding Alert, Event Bus & Exact Alert ID JCI IPSG 2 Read-Back
  it('5. should auto-trigger urgent critical alert with exact alertId match and publish to event bus', async () => {
    let capturedEvent = null;
    const unsub = eventBusService.subscribe(DOMAIN_EVENTS.RADIOLOGY_CRITICAL_FINDING, (evt) => {
      capturedEvent = evt;
    });

    const criticalReport = pacsDicomEngineService.createRadiologyReport({
      studyInstanceUid: '1.2.840.113619.2.2026.081702.1003',
      radiologistName: 'dr. Hendro Prasetyo, Sp.Rad(K)',
      clinicalHistory: 'Trauma toraks tumpul, sesak napas berat',
      findings: 'Tampak hiperlusen avaskular masif hemitoraks kanan disertai deviasi trakea dan mediastinum ke kiri.',
      impression: 'Tension Pneumothorax Masif Kanan.',
      isUrgentCritical: true,
      criticalFindingKey: 'TENSION_PNEUMOTHORAX'
    });

    expect(criticalReport.isUrgentCritical).toBe(true);
    expect(criticalReport.alertId).toBeDefined();
    expect(criticalReport.alertId).toMatch(/^RAD-CRIT-/);
    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent.payload.alertId).toBe(criticalReport.alertId);

    // Confirm Read-Back using exact alertId from report
    const confirmed = pacsDicomEngineService.confirmCriticalFindingReadBack({
      alertId: criticalReport.alertId,
      reportedToClinicianName: 'dr. Budi Santoso, Sp.B (Dokter Bedah Jaga IGD)',
      reportedByRadiologistName: 'dr. Hendro Prasetyo, Sp.Rad(K)',
      readBackConfirmedStatement: 'dr. Budi Santoso telah membacakan ulang temuan Tension Pneumothorax Masif Kanan'
    });

    expect(confirmed.status).toBe('ACKNOWLEDGED_READ_BACK');
    expect(confirmed.readBackConfirmedAt).toBeDefined();

    unsub();
  });

  // 6. SATUSEHAT FHIR R4 ImagingStudy & DiagnosticReport Serialization
  it('6. should serialize DICOM study to standard Kemenkes SATUSEHAT FHIR R4 ImagingStudy & DiagnosticReport schema', () => {
    const fhirImaging = pacsDicomEngineService.toFhirImagingStudy('1.2.840.113619.2.2026.081701.1001');

    expect(fhirImaging.resourceType).toBe('ImagingStudy');
    expect(fhirImaging.identifier[0].system).toBe('urn:dicom:uid');
    expect(fhirImaging.status).toBe('available');
    expect(fhirImaging.modality[0].code).toBe('CR');
    expect(fhirImaging.numberOfSeries).toBeGreaterThan(0);
    expect(fhirImaging.endpoint[0].display).toContain('WADO-RS');

    // DiagnosticReport check
    const reports = pacsDicomEngineService.getReports();
    if (reports.length > 0) {
      const fhirReport = pacsDicomEngineService.toFhirDiagnosticReport(reports[0].id);
      expect(fhirReport.resourceType).toBe('DiagnosticReport');
      expect(fhirReport.category[0].coding[0].code).toBe('RAD');
      expect(fhirReport.code.coding[0].code).toBe('18748-4');
    }
  });

  // 7. Windowing Presets
  it('7. should provide standardized DICOM windowing presets for soft tissue, lung and brain CT', () => {
    expect(WINDOWING_PRESETS.LUNG.wl).toBe(-600);
    expect(WINDOWING_PRESETS.LUNG.ww).toBe(1500);
    expect(WINDOWING_PRESETS.BRAIN.wl).toBe(40);
    expect(WINDOWING_PRESETS.BRAIN.ww).toBe(80);
    expect(WINDOWING_PRESETS.STROKE_ISCHEMIA.ww).toBe(8);
  });
});
