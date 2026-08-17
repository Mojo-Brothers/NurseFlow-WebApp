/**
 * NurseFlow Enterprise HIS 2026 — HL7 v2.5.1 Interface & Message Parsing Engine
 * Standards: HL7 v2.5.1, LOINC, SNOMED CT, DICOM Modality Worklist (MWL)
 * Message Profiles:
 * - ADT^A01 / A02 / A03 (Admission, Transfer, Discharge)
 * - ORM^O01 (General Order Message - Lab / Radiology / Pharmacy)
 * - ORU^R01 (Unsolicited Observation Result - Lab Analyzer / PACS)
 * - SIU^S12 (Appointment Notification)
 * - MDM^T02 (Original Medical Document Management - CPPT/SOAP)
 */

export const HL7_MESSAGE_TYPES = {
  ADT_A01: 'ADT^A01', // Patient Admission
  ADT_A02: 'ADT^A02', // Patient Transfer
  ADT_A03: 'ADT^A03', // Patient Discharge
  ORM_O01: 'ORM^O01', // Order Request
  ORU_R01: 'ORU^R01', // Observation Result
  SIU_S12: 'SIU^S12', // Appointment Scheduling
  MDM_T02: 'MDM^T02'  // Medical Document Management
};

export const hl7EngineService = {
  /**
   * 1. Generate HL7 v2.5.1 ADT^A01 (Admission Message)
   */
  createAdtAdmissionMessage: ({
    messageControlId = `MSG-${Date.now()}`,
    patientMrn,
    patientNik,
    patientFullName,
    birthDate,
    gender,
    address,
    wardName,
    bedNumber,
    attendingDoctorName
  }) => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const msh = `MSH|^~\\&|NURSEFLOW_HIS|HOSPITAL_CENTRAL|LIS_PACS_BRIDGE|HOSPITAL_CENTRAL|${timestamp}||ADT^A01|${messageControlId}|P|2.5.1`;
    const evn = `EVN|A01|${timestamp}`;
    const pid = `PID|1||${patientMrn}^^^HOSPITAL^MR~${patientNik}^^^KEMKES^NIK||${patientFullName.replace(/ /g, '^')}||${birthDate.replace(/-/g, '')}|${gender === 'F' ? 'F' : 'M'}|||${address}^^^IDN||||||||||||||||||`;
    const pv1 = `PV1|1|I|${wardName}^${bedNumber}^^HOSPITAL||||${attendingDoctorName.replace(/ /g, '^')}|||||||||||||||||||||||||||||||||||||${timestamp}`;

    return [msh, evn, pid, pv1].join('\r');
  },

  /**
   * 2. Generate HL7 v2.5.1 ORM^O01 (Order Request Message for LIS/PACS Analyzers)
   */
  createOrmOrderMessage: ({
    messageControlId = `MSG-${Date.now()}`,
    orderNumber,
    patientMrn,
    patientFullName,
    testCode, // LOINC Code
    testName,
    orderingDoctorName,
    priority = 'R' // R = Routine, S = STAT/CITO
  }) => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const msh = `MSH|^~\\&|NURSEFLOW_HIS|HOSPITAL_CENTRAL|LAB_ANALYZER|CENTRAL_LAB|${timestamp}||ORM^O01|${messageControlId}|P|2.5.1`;
    const pid = `PID|1||${patientMrn}^^^HOSPITAL^MR||${patientFullName.replace(/ /g, '^')}||||||||||||||||||`;
    const orc = `ORC|NW|${orderNumber}|||||^^^${priority === 'STAT' ? 'STAT' : 'ROUTINE'}||${timestamp}|${orderingDoctorName.replace(/ /g, '^')}`;
    const obr = `OBR|1|${orderNumber}||${testCode}^${testName}^LN|||${timestamp}|||||||||${orderingDoctorName.replace(/ /g, '^')}`;

    return [msh, pid, orc, obr].join('\r');
  },

  /**
   * 3. Parse Incoming HL7 v2.5.1 ORU^R01 (Laboratory Observation Result)
   */
  parseOruResultMessage: (hl7RawText) => {
    const segments = hl7RawText.split(/\r?\n|\r/).filter(Boolean);
    const result = {
      messageType: null,
      messageControlId: null,
      patientMrn: null,
      patientName: null,
      observations: []
    };

    for (const seg of segments) {
      const fields = seg.split('|');
      const segmentType = fields[0];

      if (segmentType === 'MSH') {
        result.messageType = fields[8];
        result.messageControlId = fields[9];
      } else if (segmentType === 'PID') {
        const mrnField = fields[3] || '';
        result.patientMrn = mrnField.split('^')[0];
        result.patientName = (fields[5] || '').replace(/\^/g, ' ');
      } else if (segmentType === 'OBX') {
        const testCodeData = (fields[3] || '').split('^');
        result.observations.push({
          setId: fields[1],
          valueType: fields[2],
          testCode: testCodeData[0],
          testName: testCodeData[1] || testCodeData[0],
          value: fields[5],
          unit: fields[6],
          referenceRange: fields[7],
          abnormalFlags: fields[8] || 'N', // N = Normal, H = High, L = Low, LL = Panic Low, HH = Panic High
          isPanic: fields[8] === 'HH' || fields[8] === 'LL',
          observationDate: fields[14]
        });
      }
    }

    return result;
  }
};
