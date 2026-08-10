/**
 * NurseFlow Enterprise HIS — eMAR & Medication Pipeline Service
 * Manages Electronic Medication Administration Records (eMAR)
 * Links: Doctor Prescription (EMR) → Pharmacy Verification → Dispensing → Nursing eMAR → Administration → Inventory Stock Deduction → Billing Charge Capture
 */

import { encounterEngine } from './encounterEngine.service.js';
import CoreRegistryService from './coreRegistry.service.js';

export const EMAR_STATUS = {
  PRESCRIBED: 'PRESCRIBED',         // Diresetkan Dokter
  PHARMACY_VERIFIED: 'VERIFIED',    // Diverifikasi Apoteker
  DISPENSED: 'DISPENSED',           // Disiapkan & Diserahkan Apotek
  SCHEDULED: 'SCHEDULED',           // Dijadwalkan Perawat
  GIVEN: 'GIVEN',                   // Diberikan ke Pasien (eMAR Signed)
  REFUSED: 'REFUSED',               // Ditolak Pasien
  HELD: 'HELD'                      // Ditunda Medis (misal TD Rendah)
};

class EMARService {
  constructor() {
    this.records = new Map();
    this.initializeDefaultEMARRecords();
  }

  initializeDefaultEMARRecords() {
    const sampleRecord = {
      id: 'EMAR-2026-001',
      encounterId: 'ENC-2026-0810-002',
      patientId: 'P-1002',
      patientName: 'Tn. Bambang Pamungkas',
      medicationId: 'MED-AMX-500',
      medicationName: 'Amoxicillin Trihydrate 500 mg',
      dosage: '500 mg',
      route: 'Oral',
      frequency: '3 x 1 Tablet',
      prescribedBy: 'dr. Surya Johnson, Sp.PD-KGEH',
      status: EMAR_STATUS.SCHEDULED,
      scheduledTime: '2026-08-10T12:00:00Z',
      administeredBy: null,
      administeredAt: null,
      notes: 'Berikan sesudah makan'
    };
    this.records.set(sampleRecord.id, sampleRecord);
  }

  // Create eMAR entry from Prescription
  createEMARRecord({ encounterId, medicationId, dosage, route, frequency, prescribedBy, notes }) {
    const encounter = encounterEngine.getEncounterById(encounterId);
    if (!encounter) throw new Error(`Encounter ${encounterId} not found`);

    const med = CoreRegistryService.getMedicationById(medicationId);

    const record = {
      id: `EMAR-${Date.now()}`,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      patientName: encounter.patientName,
      medicationId: med ? med.id : medicationId,
      medicationName: med ? med.name : 'Obat Medis',
      dosage: dosage || '1 Tablet',
      route: route || 'Oral',
      frequency: frequency || '1 x 1',
      prescribedBy: prescribedBy || encounter.dpjpName,
      status: EMAR_STATUS.PRESCRIBED,
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      administeredBy: null,
      administeredAt: null,
      notes: notes || ''
    };

    this.records.set(record.id, record);
    return record;
  }

  getEMARRecordsByEncounter(encounterId) {
    return Array.from(this.records.values()).filter(r => r.encounterId === encounterId);
  }

  administerMedication(emarId, nurseId, nurseName, notes = '') {
    const record = this.records.get(emarId);
    if (!record) throw new Error(`eMAR Record ${emarId} not found`);

    record.status = EMAR_STATUS.GIVEN;
    record.administeredBy = `${nurseName} (${nurseId})`;
    record.administeredAt = new Date().toISOString();
    record.notes = notes ? `${record.notes} | Admin: ${notes}` : record.notes;

    this.records.set(record.id, record);
    return record;
  }
}

export const emarService = new EMARService();
export default emarService;
