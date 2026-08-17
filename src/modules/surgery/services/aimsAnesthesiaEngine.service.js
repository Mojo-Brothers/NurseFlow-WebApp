/**
 * NurseFlow Enterprise HIS 2026 — Anesthesia Information Management System (AIMS)
 * Real-time intraoperative hemodynamics, anesthetic drugs, airway, and fluid/blood balance
 */

class AimsAnesthesiaEngineService {
  constructor() {
    this.anesthesiaRecords = new Map();
    this.initDemoAimsRecords();
  }

  initDemoAimsRecords() {
    const rec1 = {
      surgicalCaseId: 'CASE-SURG-001',
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      patientName: 'Tn. Hendra (Mr. X)',
      anesthesiologistId: 'DOC-ANEST-01',
      anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI',
      anesthesiaTechnique: 'GENERAL_ENDOTRACHEAL',
      asaPhysicalStatus: 'ASA_III_EMERGENCY',
      mallampatiClass: 'CLASS_II',
      airwayManagementDetails: 'ETT No. 7.5 Kingking cuffed, C-Mac Video Laryngoscope Grade 1, auskultasi simetris kanan-kiri.',
      premedicationDrugs: [{ drug: 'Midazolam', dose: '2 mg IV', time: '10:45' }],
      inductionDrugs: [
        { drug: 'Fentanyl', dose: '150 mcg IV', time: '10:55' },
        { drug: 'Propofol', dose: '140 mg IV', time: '10:57' },
        { drug: 'Rocuronium', dose: '50 mg IV', time: '10:58' }
      ],
      maintenanceGasesDrugs: [
        { agent: 'Sevoflurane', concentration: '1.8 - 2.2%', carrierGas: 'O2:Air (50:50)' },
        { agent: 'Tramadol Drip', rate: '100 mg / 100 ml NS' }
      ],
      intraoperativeVitalsTrend: [
        { time: '11:00', bp: '125/82', hr: 78, spo2: 99, etco2: 36 },
        { time: '11:15', bp: '118/76', hr: 74, spo2: 100, etco2: 35 },
        { time: '11:30', bp: '112/70', hr: 72, spo2: 100, etco2: 37 },
        { time: '11:45', bp: '120/78', hr: 76, spo2: 99, etco2: 36 }
      ],
      totalCrystalloidMl: 1000,
      totalColloidMl: 0,
      totalBloodTransfusedMl: 0,
      estimatedBloodLossMl: 150,
      totalUrineOutputMl: 220,
      extubationStatus: 'EXTUBATED_IN_THEATRE',
      pacuDestination: 'PACU_RECOVERY'
    };

    this.anesthesiaRecords.set(rec1.surgicalCaseId, rec1);
  }

  saveAnesthesiaRecord(payload) {
    this.anesthesiaRecords.set(payload.surgicalCaseId, payload);
    return payload;
  }

  getRecordByCaseId(caseId) {
    return this.anesthesiaRecords.get(caseId);
  }
}

export const aimsAnesthesiaEngineService = new AimsAnesthesiaEngineService();
