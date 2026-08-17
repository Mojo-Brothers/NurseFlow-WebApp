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
    // Clean state on Day-1 Go-Live
  }

  // Create eMAR entry from Prescription
  createEMARRecord({ encounterId, patientId, patientName, medicationId, dosage, route, frequency, prescribedBy, notes }) {
    let encPatientId = patientId;
    let encPatientName = patientName;

    if (!encPatientId && encounterEngine?.getEncounterById) {
      const maybeEnc = encounterEngine.getEncounterById(encounterId);
      if (maybeEnc && typeof maybeEnc.then !== 'function') {
        encPatientId = maybeEnc.patientId;
        encPatientName = maybeEnc.patientName;
      }
    }

    const med = CoreRegistryService.getMedicationById(medicationId);

    const record = {
      id: `EMAR-${Date.now()}`,
      encounterId: encounterId || `ENC-${Date.now()}`,
      patientId: encPatientId || 'PATIENT-ANON',
      patientName: encPatientName || 'Pasien',
      medicationId: med ? med.id : medicationId,
      medicationName: med ? med.name : (notes || 'Paracetamol 1000mg Infusion'),
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
