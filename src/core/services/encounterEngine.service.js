/**
 * NurseFlow Enterprise HIS — Core Encounter Engine Service
 * Authoritative Encounter Lifecycle Manager
 * Connects: Patient ↔ Encounter ↔ Practitioner (DPJP) ↔ Department ↔ Location ↔ Clinical Activity
 */

import CoreRegistryService from './coreRegistry.service.js';
import { persistenceAdapter } from './persistenceAdapter.service.js';
import { domainEventEngine, DOMAIN_EVENTS } from './domainEventEngine.service.js';
import { clinicalTimelineEngine } from './clinicalTimelineEngine.service.js';

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
    this.COLLECTION_NAME = 'encounters';
    this.initializeDefaultEncounters();
  }

  initializeDefaultEncounters() {
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

    persistenceAdapter.seedMemoryData(this.COLLECTION_NAME, sampleEncounters);
  }

  async getAllEncounters() {
    return await persistenceAdapter.query(this.COLLECTION_NAME);
  }

  // Create new Encounter with validation against Master Data & Persistence
  async createEncounter({ patientId, patientName, mrn, type, departmentId, dpjpId, chiefComplaint, payer, vitals = null }, actorName = 'Petugas Admisi') {
    const dept = CoreRegistryService.getDepartmentById(departmentId);
    const doctor = CoreRegistryService.getStaffById(dpjpId);

    const encounterId = `ENC-${Date.now()}`;
    const encounterNumber = `ENC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEncounter = {
      id: encounterId,
      encounterNumber,
      patientId,
      patientName: patientName || 'Pasien',
      mrn: mrn || 'MRN-000000',
      type: type || ENCOUNTER_TYPES.OUTPATIENT,
      status: ENCOUNTER_STATUS.REGISTERED,
      departmentId: dept ? dept.id : (departmentId || 'POLI-UMUM'),
      departmentName: dept ? dept.name : (departmentId || 'Poliklinik Umum'),
      dpjpId: doctor ? doctor.id : (dpjpId || 'EMP-2026-0001'),
      dpjpName: doctor ? doctor.name : (dpjpId || 'dr. DPJP On Duty'),
      payer: payer || 'BPJS Kesehatan',
      admissionDate: new Date().toISOString(),
      chiefComplaint: chiefComplaint || '',
      vitals: vitals || null,
      created_at: new Date().toISOString(),
      created_by: actorName
    };

    const saved = await persistenceAdapter.save(this.COLLECTION_NAME, newEncounter.id, newEncounter);

    // Domain Event
    domainEventEngine.publish(DOMAIN_EVENTS.ENCOUNTER_CREATED, {
      encounterId: saved.id,
      patientId: saved.patientId,
      encounterNumber: saved.encounterNumber,
      type: saved.type,
      departmentId: saved.departmentId,
      dpjpId: saved.dpjpId
    }, actorName);

    // Clinical Timeline Record
    clinicalTimelineEngine.recordEvent({
      patientId: saved.patientId,
      encounterId: saved.id,
      type: 'ENCOUNTER_CREATED',
      sourceEntityType: 'Encounter',
      sourceEntityId: saved.id,
      title: `Kunjungan / Encounter Baru (${saved.type} - ${saved.departmentName})`,
      actor: actorName,
      icon: 'meeting_room'
    });

    return saved;
  }

  async getEncounterById(id) {
    return await persistenceAdapter.findById(this.COLLECTION_NAME, id);
  }

  async getEncountersByPatient(patientId) {
    const all = await this.getAllEncounters();
    return all.filter(e => e.patientId === patientId);
  }

  async getActiveEncounters() {
    const all = await this.getAllEncounters();
    return all.filter(e => e.status !== ENCOUNTER_STATUS.DISCHARGED && e.status !== ENCOUNTER_STATUS.CANCELLED);
  }

  async updateEncounterStatus(encounterId, newStatus, actorName = 'Petugas Medis') {
    const enc = await this.getEncounterById(encounterId);
    if (!enc) throw new Error(`Encounter with ID ${encounterId} not found`);

    const oldStatus = enc.status;
    enc.status = newStatus;
    if (newStatus === ENCOUNTER_STATUS.DISCHARGED) {
      enc.dischargeDate = new Date().toISOString();
    }
    enc.updatedAt = new Date().toISOString();

    const saved = await persistenceAdapter.save(this.COLLECTION_NAME, enc.id, enc);

    domainEventEngine.publish(DOMAIN_EVENTS.ENCOUNTER_STATUS_CHANGED, {
      encounterId: saved.id,
      patientId: saved.patientId,
      oldStatus,
      newStatus
    }, actorName);

    clinicalTimelineEngine.recordEvent({
      patientId: saved.patientId,
      encounterId: saved.id,
      type: 'ENCOUNTER_STATUS_CHANGED',
      sourceEntityType: 'Encounter',
      sourceEntityId: saved.id,
      title: `Status Kunjungan Diubah: ${oldStatus} ➔ ${newStatus}`,
      actor: actorName,
      icon: 'sync'
    });

    return saved;
  }

  async assignDPJP(encounterId, practitionerId, actorName = 'Admin / Supervisor') {
    const enc = await this.getEncounterById(encounterId);
    const doctor = CoreRegistryService.getStaffById(practitionerId);
    if (!enc) throw new Error(`Encounter ${encounterId} not found`);
    if (!doctor) throw new Error(`Doctor ${practitionerId} not found in Staff Registry`);
    enc.dpjpId = doctor.id;
    enc.dpjpName = doctor.name;

    const saved = await persistenceAdapter.save(this.COLLECTION_NAME, enc.id, enc);

    domainEventEngine.publish(DOMAIN_EVENTS.CARE_TEAM_ASSIGNED, {
      encounterId: saved.id,
      patientId: saved.patientId,
      dpjpId: doctor.id,
      dpjpName: doctor.name
    }, actorName);

    return saved;
  }
}

export const encounterEngine = new EncounterEngine();
export default encounterEngine;

