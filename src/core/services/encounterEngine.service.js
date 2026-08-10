/**
 * NurseFlow Enterprise HIS — Core Encounter Engine Service
 * Authoritative Encounter Lifecycle Manager
 * Connects: Patient ↔ Encounter ↔ Practitioner (DPJP) ↔ Department ↔ Location ↔ Clinical Activity
 */

import CoreRegistryService from './coreRegistry.service.js';

export const ENCOUNTER_TYPES = {
  OUTPATIENT: 'OUTPATIENT',   // Rawat Jalan (RJ)
  INPATIENT: 'INPATIENT',     // Rawat Inap (RI)
  EMERGENCY: 'EMERGENCY',     // Unit Gawat Darurat (IGD)
  SURGERY: 'SURGERY',         // Kamar Operasi (OK)
  TELEMEDICINE: 'TELEMEDICINE'// Konsultasi Online
};

export const ENCOUNTER_STATUS = {
  PLANNED: 'PLANNED',         // Appointment / Terjadwal
  REGISTERED: 'REGISTERED',   // Terdaftar di Admisif / Kasir
  TRIAGED: 'TRIAGED',         // Selesai Triage IGD
  IN_CONSULTATION: 'IN_CONSULTATION', // Dalam Pelayanan Dokter
  ADMITTED: 'ADMITTED',       // Dirawat Inap
  DISCHARGED: 'DISCHARGED',   // Selesai Pelayanan / Pulang
  CANCELLED: 'CANCELLED'      // Batal
};

class EncounterEngine {
  constructor() {
    this.encounters = new Map();
    this.initializeDefaultEncounters();
  }

  initializeDefaultEncounters() {
    // Initial mock state binding 10 Core Entities
    const sampleEncounters = [
      {
        id: 'ENC-2026-0810-001',
        encounterNumber: 'ENC-2026-0810-001',
        patientId: 'P-1001',
        patientName: 'Ny. Siti Nurhaliza',
        mrn: 'MRN-2026-001001',
        type: ENCOUNTER_TYPES.OUTPATIENT,
        status: ENCOUNTER_STATUS.IN_CONSULTATION,
        departmentId: 'POLI-PD',
        departmentName: 'Poli Penyakit Dalam',
        dpjpId: 'EMP-2026-0001',
        dpjpName: 'dr. Surya Johnson, Sp.PD-KGEH',
        payer: 'BPJS Kesehatan',
        bpjsCardNumber: '0001234567890',
        admissionDate: '2026-08-10T08:00:00Z',
        chiefComplaint: 'Nyeri dada pasca aktivitas fisik, sesak napas ringan.',
        vitals: { hr: 88, bp: '130/85', rr: 20, temp: 36.8, spo2: 98 },
        created_at: '2026-08-10T08:00:00Z'
      },
      {
        id: 'ENC-2026-0810-002',
        encounterNumber: 'ENC-2026-0810-002',
        patientId: 'P-1002',
        patientName: 'Tn. Bambang Pamungkas',
        mrn: 'MRN-2026-001002',
        type: ENCOUNTER_TYPES.INPATIENT,
        status: ENCOUNTER_STATUS.ADMITTED,
        departmentId: 'MED-AZALEA',
        departmentName: 'Ruang Rawat Azalea Kamar 204',
        dpjpId: 'EMP-2026-0001',
        dpjpName: 'dr. Surya Johnson, Sp.PD-KGEH',
        payer: 'Umum / Mandiri',
        admissionDate: '2026-08-08T14:30:00Z',
        chiefComplaint: 'Nyeri perut kanan bawah tajam pasca Appendektomi H+2.',
        vitals: { hr: 76, bp: '120/80', rr: 18, temp: 36.5, spo2: 99 },
        created_at: '2026-08-08T14:30:00Z'
      }
    ];

    sampleEncounters.forEach(e => this.encounters.set(e.id, e));
  }

  // Create new Encounter with validation against Master Data
  createEncounter({ patientId, patientName, mrn, type, departmentId, dpjpId, chiefComplaint, payer }) {
    const dept = CoreRegistryService.getDepartmentById(departmentId);
    const doctor = CoreRegistryService.getStaffById(dpjpId);

    const newEncounter = {
      id: `ENC-${Date.now()}`,
      encounterNumber: `ENC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId,
      patientName,
      mrn,
      type: type || ENCOUNTER_TYPES.OUTPATIENT,
      status: ENCOUNTER_STATUS.REGISTERED,
      departmentId: dept ? dept.id : departmentId,
      departmentName: dept ? dept.name : 'Poliklinik Umum',
      dpjpId: doctor ? doctor.id : dpjpId,
      dpjpName: doctor ? doctor.name : 'dr. DPJP On Duty',
      payer: payer || 'BPJS Kesehatan',
      admissionDate: new Date().toISOString(),
      chiefComplaint: chiefComplaint || '',
      vitals: null,
      created_at: new Date().toISOString()
    };

    this.encounters.set(newEncounter.id, newEncounter);
    return newEncounter;
  }

  getEncounterById(id) {
    return this.encounters.get(id) || null;
  }

  getEncountersByPatient(patientId) {
    return Array.from(this.encounters.values()).filter(e => e.patientId === patientId);
  }

  getActiveEncounters() {
    return Array.from(this.encounters.values()).filter(e => e.status !== ENCOUNTER_STATUS.DISCHARGED && e.status !== ENCOUNTER_STATUS.CANCELLED);
  }

  updateEncounterStatus(encounterId, newStatus) {
    const enc = this.encounters.get(encounterId);
    if (!enc) throw new Error(`Encounter with ID ${encounterId} not found`);
    enc.status = newStatus;
    if (newStatus === ENCOUNTER_STATUS.DISCHARGED) {
      enc.dischargeDate = new Date().toISOString();
    }
    this.encounters.set(encounterId, enc);
    return enc;
  }

  assignDPJP(encounterId, practitionerId) {
    const enc = this.encounters.get(encounterId);
    const doctor = CoreRegistryService.getStaffById(practitionerId);
    if (!enc) throw new Error(`Encounter ${encounterId} not found`);
    if (!doctor) throw new Error(`Doctor ${practitionerId} not found in Staff Registry`);
    enc.dpjpId = doctor.id;
    enc.dpjpName = doctor.name;
    this.encounters.set(encounterId, enc);
    return enc;
  }
}

export const encounterEngine = new EncounterEngine();
export default encounterEngine;
