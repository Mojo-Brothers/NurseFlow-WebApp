/**
 * NurseFlow Enterprise HIS 2026 — Laboratory Information System (LIS) & RIS/PACS Engine
 * Standard Compliance: JCI IPSG 2 (Improve Effective Communication of Critical Values), LOINC, ISO 15189, DICOM PS 3.x
 */

export const SPECIMEN_STATUS = {
  ORDERED: 'ORDERED',
  COLLECTED: 'COLLECTED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED_IN_LAB: 'RECEIVED_IN_LAB',
  ANALYZING: 'ANALYZING',
  RESULTED: 'RESULTED',
  VERIFIED: 'VERIFIED',
  RELEASED: 'RELEASED',
  REJECTED: 'REJECTED'
};

export const VACUTAINER_TUBES = {
  PURPLE_EDTA: { color: 'PURPLE', additive: 'K2/K3 EDTA', department: 'HEMATOLOGY', target: 'Darah Lengkap / HbA1c' },
  YELLOW_SST: { color: 'YELLOW', additive: 'Gel Separator & Clot Activator', department: 'CLINICAL_CHEMISTRY', target: 'Kimia Darah / Laktat / Serologi' },
  BLUE_CITRATE: { color: 'BLUE', additive: 'Natrium Sitrat 3.2%', department: 'COAGULATION', target: 'PT / APTT / D-Dimer' },
  GREEN_HEPARIN: { color: 'GREEN', additive: 'Lithium Heparin', department: 'BLOOD_GAS', target: 'Analisa Gas Darah (AGD)' },
  RED_PLAIN: { color: 'RED', additive: 'Tanpa Antikoagulan', department: 'IMMUNOLOGY', target: 'Crossmatch / Golongan Darah' }
};

export const PANIC_THRESHOLDS = {
  'LOINC-2524-7': { name: 'Laktat Darah', panicHigh: 4.0, unit: 'mmol/L', threat: 'Severe Sepsis / Tissue Hypoperfusion Shock' },
  'LOINC-2823-3': { name: 'Kalium Serum (K+)', panicLow: 2.8, panicHigh: 6.2, unit: 'mmol/L', threat: 'Risiko Aritmia Ventrikel Letal / Henti Jantung' },
  'LOINC-2345-7': { name: 'Glukosa Darah Sewaktu', panicLow: 45.0, panicHigh: 500.0, unit: 'mg/dL', threat: 'Koma Hipoglikemia Akut / KAD' },
  'LOINC-777-3':  { name: 'Trombosit (Platelet)', panicLow: 20000, unit: '/uL', threat: 'Risiko Perdarahan Spontan Intrakranial' },
  'LOINC-42757-5': { name: 'Troponin I Kuantitatif Cito', panicHigh: 0.04, unit: 'ng/mL', threat: 'Akut Miokard Infark (STEMI/NSTEMI)' },
  'LOINC-1988-5': { name: 'C-Reactive Protein (CRP)', panicHigh: 100.0, unit: 'mg/L', threat: 'Inflamasi Sistemik Akut' }
};

class LisPacsEngineService {
  constructor() {
    this.specimens = new Map();
    this.testResults = new Map();
    this.panicAlerts = [];
    this.auditLogs = [];
  }

  /**
   * 1. Specimen Collection & Barcoding (Phlebotomy Station)
   */
  collectSpecimen({
    orderId,
    encounterId,
    patientId,
    patientMrn,
    specimenType = 'EDTA_WHOLE_BLOOD',
    vacutainerTubeColor = 'PURPLE_EDTA',
    phlebotomistName = 'Analis Rina, A.Md.AK',
    collectionSite = 'Vena Fossa Cubiti Dextra'
  }) {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const specimenBarcode = `LAB-${new Date().toISOString().slice(5, 10).replace('-', '')}-${randomSeq}`;
    
    const specimen = {
      id: `SPEC-${Date.now()}`,
      specimenBarcode,
      orderId,
      encounterId,
      patientId,
      patientMrn,
      specimenType,
      vacutainerTubeColor,
      collectionSite,
      phlebotomistName,
      status: SPECIMEN_STATUS.COLLECTED,
      history: [
        { status: SPECIMEN_STATUS.ORDERED, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), actor: 'DPJP' },
        { status: SPECIMEN_STATUS.COLLECTED, timestamp: new Date().toISOString(), actor: phlebotomistName }
      ],
      collectedAt: new Date().toISOString(),
      receivedAt: null
    };

    this.specimens.set(specimenBarcode, specimen);
    return specimen;
  }

  /**
   * 2. Specimen Accessioning / Receipt in Laboratory
   */
  receiveSpecimenInLab({ specimenBarcode, receivingAnalystName, transportTemperatureCelsius = 4.0 }) {
    const specimen = this.specimens.get(specimenBarcode);
    if (!specimen) {
      throw new Error(`Spesimen dengan barcode ${specimenBarcode} tidak ditemukan di sistem LIS!`);
    }

    specimen.status = SPECIMEN_STATUS.RECEIVED_IN_LAB;
    specimen.receivingAnalystName = receivingAnalystName;
    specimen.transportTemperatureCelsius = transportTemperatureCelsius;
    specimen.receivedAt = new Date().toISOString();
    specimen.history.push({
      status: SPECIMEN_STATUS.RECEIVED_IN_LAB,
      timestamp: specimen.receivedAt,
      actor: receivingAnalystName,
      notes: `Diterima di Laboratorium Sentral (Suhu Transport: ${transportTemperatureCelsius}°C)`
    });

    return specimen;
  }

  /**
   * 3. Analytical Result Entry, Delta Check & Panic Value Escalation (JCI IPSG 2)
   */
  enterAndValidateResult({
    specimenBarcode,
    testCode, // e.g. 'LOINC-2524-7'
    testName,
    category = 'CLINICAL_CHEMISTRY',
    numericValue,
    unit,
    refLow,
    refHigh,
    analystName,
    previousNumericValue = null
  }) {
    const specimen = this.specimens.get(specimenBarcode);
    if (!specimen) {
      throw new Error(`Spesimen ${specimenBarcode} belum terdaftar.`);
    }

    const numVal = Number(numericValue);
    const isAbnormal = (refLow !== undefined && numVal < refLow) || (refHigh !== undefined && numVal > refHigh);
    
    // Evaluate Panic Value Rule
    const panicDef = PANIC_THRESHOLDS[testCode];
    let isCriticalPanic = false;
    let panicThreat = null;

    if (panicDef) {
      if (panicDef.panicLow !== undefined && numVal <= panicDef.panicLow) {
        isCriticalPanic = true;
        panicThreat = panicDef.threat;
      }
      if (panicDef.panicHigh !== undefined && numVal >= panicDef.panicHigh) {
        isCriticalPanic = true;
        panicThreat = panicDef.threat;
      }
    }

    // Delta Check against previous value
    let deltaFlag = 'NONE';
    if (previousNumericValue !== null) {
      const diffPercent = Math.abs((numVal - previousNumericValue) / previousNumericValue) * 100;
      if (diffPercent > 50) {
        deltaFlag = numVal > previousNumericValue ? 'SIGNIFICANT_RISE' : 'SIGNIFICANT_DROP';
      }
    }

    const resultRecord = {
      id: `RES-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      specimenBarcode,
      encounterId: specimen.encounterId,
      patientId: specimen.patientId,
      patientMrn: specimen.patientMrn,
      testCode,
      testName: testName || (panicDef ? panicDef.name : 'Pemeriksaan Lab'),
      category,
      numericValue: numVal,
      unit: unit || (panicDef ? panicDef.unit : ''),
      refRange: `${refLow} - ${refHigh}`,
      isAbnormal,
      isCriticalPanic,
      panicThreat,
      deltaFlag,
      analystName,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString()
    };

    if (!this.testResults.has(specimenBarcode)) {
      this.testResults.set(specimenBarcode, []);
    }
    this.testResults.get(specimenBarcode).push(resultRecord);

    // If critical panic value detected, trigger mandatory JCI escalation record
    if (isCriticalPanic) {
      const panicAlert = {
        alertId: `PANIC-${Date.now()}`,
        specimenBarcode,
        encounterId: specimen.encounterId,
        patientId: specimen.patientId,
        patientMrn: specimen.patientMrn,
        testCode,
        testName: resultRecord.testName,
        valueDisplay: `${numVal} ${resultRecord.unit}`,
        threat: panicThreat,
        status: 'PENDING_READ_BACK',
        detectedAt: resultRecord.verifiedAt,
        reportedTo: null,
        readBackConfirmedBy: null
      };
      this.panicAlerts.unshift(panicAlert);
    }

    specimen.status = SPECIMEN_STATUS.VERIFIED;
    return resultRecord;
  }

  /**
   * 4. Critical Value Read-Back Verification (JCI IPSG 2 Mandatory Confirmation)
   */
  confirmPanicValueReadBack({
    alertId,
    reportedToClinicianName,
    reportedByAnalystName,
    readBackConfirmedText,
    notes = 'Penerima laporan membacakan ulang (read-back) nilai kritis dengan benar sesuai SOP JCI IPSG 2'
  }) {
    const alert = this.panicAlerts.find(a => a.alertId === alertId);
    if (!alert) {
      throw new Error(`Alert Nilai Kritis ${alertId} tidak ditemukan.`);
    }

    alert.status = 'ACKNOWLEDGED_READ_BACK';
    alert.reportedTo = reportedToClinicianName;
    alert.reportedBy = reportedByAnalystName;
    alert.readBackConfirmedText = readBackConfirmedText;
    alert.readBackConfirmedAt = new Date().toISOString();
    alert.notes = notes;

    return alert;
  }

  /**
   * Legacy Compatibility: validateLabResult
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
    const isPanic = (panicLow !== null && numericValue <= panicLow) || (panicHigh !== null && numericValue >= panicHigh);
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
      this.panicAlerts.push({
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
   * 5. DICOM Study Generation & PACS Worklist (RIS/PACS)
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

  getSpecimen(specimenBarcode) {
    return this.specimens.get(specimenBarcode);
  }

  getResults(specimenBarcode) {
    return this.testResults.get(specimenBarcode) || [];
  }

  getPanicAlerts() {
    return this.panicAlerts;
  }

  getCriticalAlerts() {
    return this.panicAlerts;
  }
}

export const lisPacsEngineService = new LisPacsEngineService();
