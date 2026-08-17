/**
 * NurseFlow Enterprise HIS 2026 — Laboratory Information System (LIS) & RIS/PACS Engine
 * Standar: LOINC, DICOM Standard PS 3.x & JCI IPSG 2 (Improve Effective Communication of Critical Results)
 */

export const SPECIMEN_STATUS = {
  ORDERED: 'ORDERED',
  COLLECTED: 'COLLECTED',
  RECEIVED_IN_LAB: 'RECEIVED_IN_LAB',
  ANALYZING: 'ANALYZING',
  VERIFIED: 'VERIFIED',
  RELEASED: 'RELEASED'
};

class LisPacsEngineService {
  constructor() {
    this.specimens = new Map();
    this.criticalPanicAlerts = [];
  }

  /**
   * 1. Specimen Collection & Barcoding (LIS)
   */
  collectSpecimen({ orderId, patientId, testCode, specimenType = 'EDTA_WHOLE_BLOOD', phlebotomistName }) {
    const specimenBarcode = `SPEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const specimen = {
      specimenBarcode,
      orderId,
      patientId,
      testCode,
      specimenType,
      phlebotomistName,
      status: SPECIMEN_STATUS.COLLECTED,
      collectedAt: new Date().toISOString()
    };

    this.specimens.set(specimenBarcode, specimen);
    return specimen;
  }

  /**
   * 2. Auto-Verification & Panic Value Escalation (LIS)
   */
  validateLabResult({
    specimenBarcode,
    testCode,
    numericValue,
    refLow,
    refHigh,
    panicLow = null,
    panicHigh = null,
    analystName
  }) {
    const isPanic = (panicLow !== null && numericValue < panicLow) || (panicHigh !== null && numericValue > panicHigh);
    const isAbnormal = numericValue < refLow || numericValue > refHigh;

    const result = {
      specimenBarcode,
      testCode,
      numericValue,
      isAbnormal,
      isCriticalPanic: isPanic,
      interpretation: isPanic ? 'CRITICAL_PANIC_VALUE' : isAbnormal ? 'ABNORMAL' : 'NORMAL',
      analystName,
      verifiedAt: new Date().toISOString()
    };

    if (isPanic) {
      this.criticalPanicAlerts.push({
        alertId: `PANIC-${Date.now()}`,
        testCode,
        numericValue,
        specimenBarcode,
        detectedAt: result.verifiedAt,
        status: 'PENDING_DOCTOR_CONFIRMATION'
      });
    }

    return result;
  }

  /**
   * 3. DICOM Study Generation & PACS Worklist (RIS/PACS)
   */
  generateDicomStudy({
    orderId,
    patientMrn,
    modality = 'CR', // CR, CT, MRI, US
    procedureName = 'Thorax PA Digital'
  }) {
    const studyInstanceUid = `1.2.840.113619.2.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
    return {
      studyInstanceUid,
      accessionNumber: `ACC-${Date.now()}`,
      patientMrn,
      modality,
      procedureName,
      pacsViewerUrl: `https://pacs.nurseflow.org/viewer?study=${studyInstanceUid}`,
      status: 'SCHEDULED'
    };
  }

  getCriticalAlerts() {
    return this.criticalPanicAlerts;
  }
}

export const lisPacsEngineService = new LisPacsEngineService();
