/**
 * NurseFlow Enterprise HIS 2026 — Operating Theatre (IBS) Engine
 * Standards: JCI IPSG 4 (Safe Surgery: Correct Site, Correct Procedure, Correct Patient), WHO Surgical Safety Checklist
 */

import { eventBusService, DOMAIN_EVENTS } from '../../../../server/realtime/eventBus.service.js';
import { generateSha256Digest } from '../../radiology/services/pacsDicomEngine.service.js';

export const SURGERY_STATUS = {
  SCHEDULED: 'SCHEDULED',
  PRE_OP_HOLDING: 'PRE_OP_HOLDING',
  IN_THEATRE: 'IN_THEATRE',
  ANESTHESIA_INDUCTION: 'ANESTHESIA_INDUCTION',
  SURGERY_IN_PROGRESS: 'SURGERY_IN_PROGRESS',
  POST_OP_PACU: 'POST_OP_PACU',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const ASA_CLASSIFICATIONS = {
  ASA_I: { code: 'ASA_I', desc: 'Pasien normal sehat' },
  ASA_II: { code: 'ASA_II', desc: 'Pasien dengan penyakit sistemik ringan' },
  ASA_III: { code: 'ASA_III', desc: 'Pasien dengan penyakit sistemik berat' },
  ASA_IV: { code: 'ASA_IV', desc: 'Penyakit sistemik berat yang mengancam jiwa' },
  ASA_V: { code: 'ASA_V', desc: 'Pasien moribund tidak diharapkan bertahan tanpa operasi' },
  ASA_E: { code: 'ASA_E', desc: 'Kasus Bedah Darurat (Emergency Suffix)' }
};

class OperatingTheatreEngineService {
  constructor() {
    this.theatres = new Map();
    this.cases = new Map();
    this.whoChecklists = new Map();
    this.aldreteScores = new Map();
    this.initDemoTheatreData();
  }

  initDemoTheatreData() {
    // 4 Master Operating Rooms
    const ok1 = {
      id: 'THEATRE-OK-01',
      roomNumber: 'OK-01',
      roomName: 'Kamar Operasi 1 (Bedah Umum & Laparoskopi)',
      theatreType: 'MAJOR',
      status: 'IN_USE',
      currentCaseId: 'CASE-SURG-001',
      equipment: ['Laparoscopy Tower 4K', 'Electrocautery Bipolar', 'Anesthesia Workstation GE']
    };

    const ok2 = {
      id: 'THEATRE-OK-02',
      roomNumber: 'OK-02',
      roomName: 'Kamar Operasi 2 (Bedah Saraf & Mikroskopik)',
      theatreType: 'MAJOR',
      status: 'AVAILABLE',
      currentCaseId: null,
      equipment: ['Surgical Microscope Leica', 'C-Arm Digital Siemens', 'Neuronavigation System']
    };

    const ok3 = {
      id: 'THEATRE-OK-03',
      roomNumber: 'OK-03',
      roomName: 'Kamar Operasi 3 (Bedah Ortopedi & Trauma)',
      theatreType: 'MAJOR',
      status: 'CLEANING_STERILIZATION',
      currentCaseId: null,
      equipment: ['Orthopedic Traction Table', 'C-Arm High Frequency', 'Pneumatic Tourniquet']
    };

    const ok4 = {
      id: 'THEATRE-OK-04',
      roomNumber: 'OK-04',
      roomName: 'Kamar Operasi 4 (Bedah Cito & Kebidanan C-Section)',
      theatreType: 'EMERGENCY_CITO',
      status: 'AVAILABLE',
      currentCaseId: null,
      equipment: ['Infant Warmer Resuscitaire', 'Ultrasound Intraop', 'Rapid Blood Infuser']
    };

    this.theatres.set(ok1.id, ok1);
    this.theatres.set(ok2.id, ok2);
    this.theatres.set(ok3.id, ok3);
    this.theatres.set(ok4.id, ok4);
  }

  getTheatres() {
    return Array.from(this.theatres.values());
  }

  getCases() {
    return Array.from(this.cases.values());
  }

  getCaseById(caseId) {
    return this.cases.get(caseId);
  }

  /**
   * Schedule new surgical case
   */
  scheduleSurgicalCase(payload) {
    const caseId = payload.id || `CASE-SURG-${Date.now()}`;
    const bookingNumber = payload.bookingNumber || `SURG-${Date.now().toString().slice(-8)}`;

    const newCase = {
      id: caseId,
      bookingNumber,
      patientId: payload.patientId,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      encounterId: payload.encounterId,
      theatreId: payload.theatreId,
      theatreName: payload.theatreName || 'OK-01',
      scheduledStart: payload.scheduledStart,
      scheduledEnd: payload.scheduledEnd,
      procedureCode: payload.procedureCode || 'ICD9-GEN-SURG',
      procedureName: payload.procedureName,
      surgicalUrgency: payload.surgicalUrgency || 'ELECTIVE',
      primarySurgeonId: payload.primarySurgeonId,
      primarySurgeonName: payload.primarySurgeonName,
      anesthesiologistId: payload.anesthesiologistId,
      anesthesiologistName: payload.anesthesiologistName,
      scrubNurseName: payload.scrubNurseName || 'Perawat Instrumen IBS',
      circulatingNurseName: payload.circulatingNurseName || 'Perawat Sirkuler IBS',
      anesthesiaType: payload.anesthesiaType || 'GENERAL_ANESTHESIA',
      asaClass: payload.asaClass || 'ASA_II',
      status: SURGERY_STATUS.SCHEDULED,
      createdAt: new Date().toISOString()
    };

    this.cases.set(caseId, newCase);

    eventBusService.publish(DOMAIN_EVENTS.ORDER_CREATED, {
      caseId,
      bookingNumber,
      patientMrn: newCase.patientMrn,
      procedure: newCase.procedureName,
      theatre: newCase.theatreName
    });

    return newCase;
  }

  /**
   * Transition Surgery Status Lifecycle
   */
  transitionCaseStatus(caseId, nextStatus) {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) {
      throw new Error(`Surgical case ${caseId} tidak ditemukan.`);
    }

    surgicalCase.status = nextStatus;
    surgicalCase.updatedAt = new Date().toISOString();

    // Update Room Status
    const theatre = this.theatres.get(surgicalCase.theatreId);
    if (theatre) {
      if (nextStatus === SURGERY_STATUS.SURGERY_IN_PROGRESS || nextStatus === SURGERY_STATUS.IN_THEATRE) {
        theatre.status = 'IN_USE';
        theatre.currentCaseId = caseId;
      } else if (nextStatus === SURGERY_STATUS.POST_OP_PACU) {
        theatre.status = 'CLEANING_STERILIZATION';
        theatre.currentCaseId = null;
      } else if (nextStatus === SURGERY_STATUS.COMPLETED) {
        theatre.status = 'AVAILABLE';
        theatre.currentCaseId = null;
      }
    }

    return surgicalCase;
  }

  /**
   * Sign WHO Surgical Safety Checklist (3-Phase JCI IPSG 4)
   */
  signWhoChecklist(caseId, checklistData, verifiedBy = { surgeon: 'dr. Budi, Sp.B', anesth: 'dr. Ratna, Sp.An', nurse: 'Ns. Maya' }) {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) {
      throw new Error(`Surgical case ${caseId} tidak ditemukan.`);
    }

    const timestamp = new Date().toISOString();
    const canonical = JSON.stringify({
      caseId,
      bookingNumber: surgicalCase.bookingNumber,
      patientMrn: surgicalCase.patientMrn,
      signIn: checklistData.signIn,
      timeOut: checklistData.timeOut,
      signOut: checklistData.signOut,
      verifiedBy,
      timestamp
    });

    const signatureHash = generateSha256Digest(canonical);

    const checklistRecord = {
      id: `WHO-CHK-${Date.now()}`,
      caseId,
      bookingNumber: surgicalCase.bookingNumber,
      patientMrn: surgicalCase.patientMrn,
      patientName: surgicalCase.patientName,
      signIn: {
        ...checklistData.signIn,
        verifiedAt: timestamp,
        verifiedBy: verifiedBy.anesth
      },
      timeOut: {
        ...checklistData.timeOut,
        verifiedAt: timestamp,
        verifiedBy: verifiedBy.surgeon
      },
      signOut: {
        ...checklistData.signOut,
        verifiedAt: timestamp,
        verifiedBy: verifiedBy.nurse
      },
      status: 'VERIFIED_COMPLIANT',
      signatureHash,
      createdAt: timestamp
    };

    this.whoChecklists.set(caseId, checklistRecord);
    return checklistRecord;
  }

  getWhoChecklist(caseId) {
    return this.whoChecklists.get(caseId);
  }

  /**
   * Calculate Aldrete Post-Anesthesia Recovery Score
   * Criteria: Activity (0-2), Respiration (0-2), Circulation/BP (0-2), Consciousness (0-2), O2 Saturation (0-2)
   * Score >= 8: Eligible for Discharge to Ward / Inpatient Room
   */
  calculateAldreteScore({ caseId, activity, respiration, circulation, consciousness, o2Saturation, assessedBy = 'Ns. PACU Recovery' }) {
    const total = Number(activity) + Number(respiration) + Number(circulation) + Number(consciousness) + Number(o2Saturation);
    const eligibleForDischarge = total >= 8;

    const record = {
      id: `ALDRETE-${Date.now()}`,
      caseId,
      activity: Number(activity),
      respiration: Number(respiration),
      circulation: Number(circulation),
      consciousness: Number(consciousness),
      o2Saturation: Number(o2Saturation),
      totalScore: total,
      eligibleForDischarge,
      assessedBy,
      assessedAt: new Date().toISOString()
    };

    this.aldreteScores.set(caseId, record);
    return record;
  }

  getAldreteScore(caseId) {
    return this.aldreteScores.get(caseId);
  }
}

export const operatingTheatreEngineService = new OperatingTheatreEngineService();
