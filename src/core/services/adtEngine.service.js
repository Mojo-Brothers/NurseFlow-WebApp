/**
 * NurseFlow Enterprise HIS — ADT Engine & Bed Management Service
 * Manages Admission, Discharge, Transfer (ADT) and Real-Time Bed Occupancy.
 * Ties: Patient ↔ Encounter ↔ Ward ↔ Room ↔ Bed ↔ Billing Room Charges
 */

export const BED_STATUS = {
  AVAILABLE: 'AVAILABLE',       // Tempat Tidur Siap/Kosong
  OCCUPIED: 'OCCUPIED',         // Terisi Pasien Rawat Inap
  MAINTENANCE: 'MAINTENANCE',   // Perbaikan / Perawatan Fisik
  CLEANING: 'CLEANING'          // Proses Disinfeksi / Sterilisasi
};

export const ISOLATION_CATEGORY = {
  NONE: 'NONE',
  AIRBORNE: 'AIRBORNE',         // Isolasi Tekanan Negatif (TB, COVID)
  DROPLET: 'DROPLET',           // Isolasi Droplet (Influenza)
  CONTACT: 'CONTACT',           // Isolasi Kontak (MRSA)
  PROTECTIVE: 'PROTECTIVE'      // Isolasi Pasien Immunocompromised
};

class ADTEngine {
  constructor() {
    this.beds = new Map();
    this.adtLogs = [];
    this.initializeDefaultBeds();
  }

  initializeDefaultBeds() {
    const sampleBeds = [
      { id: 'BED-AZA-204-1', building: 'Gedung Utama', floor: 'Lantai 2', ward: 'AZALEA', roomNumber: 'Kamar 204', bedCode: '204-A', class: 'Kategori Kelas 1', status: BED_STATUS.OCCUPIED, isolation: ISOLATION_CATEGORY.NONE, currentPatientId: 'P-1002', currentPatientName: 'Tn. Bambang Pamungkas', encounterId: 'ENC-2026-0810-002', dailyRate: 750000 },
      { id: 'BED-AZA-204-2', building: 'Gedung Utama', floor: 'Lantai 2', ward: 'AZALEA', roomNumber: 'Kamar 204', bedCode: '204-B', class: 'Kategori Kelas 1', status: BED_STATUS.AVAILABLE, isolation: ISOLATION_CATEGORY.NONE, currentPatientId: null, currentPatientName: null, encounterId: null, dailyRate: 750000 },
      { id: 'BED-VIP-501-1', building: 'Gedung Utama', floor: 'Lantai 5', ward: 'PRESIDENT_SUITE', roomNumber: 'Kamar 501', bedCode: '501-VIP', class: 'VIP Class', status: BED_STATUS.AVAILABLE, isolation: ISOLATION_CATEGORY.NONE, currentPatientId: null, currentPatientName: null, encounterId: null, dailyRate: 2500000 },
      { id: 'BED-ICU-101-1', building: 'Gedung Critical Care', floor: 'Lantai 1', ward: 'ICU', roomNumber: 'Room ICU 01', bedCode: 'ICU-01', class: 'Intensive Care', status: BED_STATUS.AVAILABLE, isolation: ISOLATION_CATEGORY.AIRBORNE, currentPatientId: null, currentPatientName: null, encounterId: null, dailyRate: 3500000 }
    ];

    sampleBeds.forEach(b => this.beds.set(b.id, b));
  }

  getAllBeds() {
    return Array.from(this.beds.values());
  }

  getAvailableBeds(wardFilter = null) {
    return Array.from(this.beds.values()).filter(b => b.status === BED_STATUS.AVAILABLE && (!wardFilter || b.ward === wardFilter));
  }

  assignPatientToBed(bedId, patientId, patientName, encounterId, operator = 'Admission Staff') {
    const bed = this.beds.get(bedId);
    if (!bed) throw new Error(`Bed ${bedId} not found`);
    if (bed.status !== BED_STATUS.AVAILABLE) throw new Error(`Bed ${bedId} is currently ${bed.status}`);

    bed.status = BED_STATUS.OCCUPIED;
    bed.currentPatientId = patientId;
    bed.currentPatientName = patientName;
    bed.encounterId = encounterId;

    this.beds.set(bed.id, bed);

    this.adtLogs.push({
      action: 'ADMISSION_BED_ASSIGNMENT',
      bedId,
      patientId,
      encounterId,
      timestamp: new Date().toISOString(),
      operator
    });

    return bed;
  }

  transferPatientBed(currentBedId, targetBedId, operator = 'Nursing Staff') {
    const currentBed = this.beds.get(currentBedId);
    const targetBed = this.beds.get(targetBedId);

    if (!currentBed || currentBed.status !== BED_STATUS.OCCUPIED) throw new Error(`Current bed invalid`);
    if (!targetBed || targetBed.status !== BED_STATUS.AVAILABLE) throw new Error(`Target bed unavailable`);

    const patientId = currentBed.currentPatientId;
    const patientName = currentBed.currentPatientName;
    const encounterId = currentBed.encounterId;

    // Clear current bed to cleaning
    currentBed.status = BED_STATUS.CLEANING;
    currentBed.currentPatientId = null;
    currentBed.currentPatientName = null;
    currentBed.encounterId = null;
    this.beds.set(currentBed.id, currentBed);

    // Assign to target bed
    targetBed.status = BED_STATUS.OCCUPIED;
    targetBed.currentPatientId = patientId;
    targetBed.currentPatientName = patientName;
    targetBed.encounterId = encounterId;
    this.beds.set(targetBed.id, targetBed);

    this.adtLogs.push({
      action: 'BED_TRANSFER',
      fromBedId: currentBedId,
      toBedId: targetBedId,
      patientId,
      encounterId,
      timestamp: new Date().toISOString(),
      operator
    });

    return targetBed;
  }

  dischargeBed(bedId, operator = 'Discharge Staff') {
    const bed = this.beds.get(bedId);
    if (!bed) throw new Error(`Bed ${bedId} not found`);

    const patientId = bed.currentPatientId;
    bed.status = BED_STATUS.CLEANING;
    bed.currentPatientId = null;
    bed.currentPatientName = null;
    bed.encounterId = null;

    this.beds.set(bed.id, bed);

    this.adtLogs.push({
      action: 'BED_DISCHARGE',
      bedId,
      patientId,
      timestamp: new Date().toISOString(),
      operator
    });

    return bed;
  }
}

export const adtEngine = new ADTEngine();
export default adtEngine;
