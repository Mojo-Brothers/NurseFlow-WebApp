/**
 * NurseFlow Enterprise HIS 2026 — Admission, Discharge, Transfer (ADT) & Bed Management Engine
 * Standar: JCI International Patient Safety Goals (IPSG) & HL7 ADT Message Specifications (A01, A02, A03)
 */

export const ADT_EVENT_TYPES = {
  ADMIT: 'A01_ADMIT_PATIENT',
  TRANSFER: 'A02_TRANSFER_PATIENT',
  DISCHARGE: 'A03_DISCHARGE_PATIENT',
  CANCEL_ADMIT: 'A11_CANCEL_ADMISSION'
};

class AdtEngineService {
  constructor() {
    this.bedRegistry = new Map(); // BedId -> Bed State
    this.activeOccupancies = new Map(); // EncounterId -> BedOccupancy Context
  }

  /**
   * 1. ADMIT PATIENT (HL7 A01)
   */
  admitPatient({ encounterId, patientId, patientName, targetBedId, admittingDoctorName, wardName = 'Ruang Inap Melati 3A' }) {
    // Check if bed is available
    const currentBedStatus = this.bedRegistry.get(targetBedId)?.status || 'AVAILABLE';
    if (currentBedStatus !== 'AVAILABLE') {
      throw new Error(`Bed ${targetBedId} tidak dapat digunakan. Status saat ini: ${currentBedStatus}`);
    }

    // Lock Bed & Create Occupancy Record
    this.bedRegistry.set(targetBedId, { status: 'OCCUPIED', patientId, encounterId, wardName });
    const occupancy = {
      occupancyId: `OCC-${Date.now()}`,
      encounterId,
      patientId,
      patientName,
      bedId: targetBedId,
      wardName,
      admittingDoctorName,
      checkInTime: new Date().toISOString(),
      status: 'ACTIVE'
    };

    this.activeOccupancies.set(encounterId, occupancy);

    return {
      success: true,
      event: ADT_EVENT_TYPES.ADMIT,
      occupancy,
      message: `Pasien ${patientName} berhasil di-ADMIT ke Bed ${targetBedId} (${wardName}).`
    };
  }

  /**
   * 2. TRANSFER PATIENT (HL7 A02)
   */
  transferPatient({ encounterId, fromBedId, toBedId, targetWardName = 'Ruang Inap ICU', transferReason, transferredBy }) {
    const activeOccupancy = this.activeOccupancies.get(encounterId);
    if (!activeOccupancy) {
      throw new Error(`Encounter ${encounterId} tidak memiliki riwayat occupancy rawat inap aktif.`);
    }

    const targetBedStatus = this.bedRegistry.get(toBedId)?.status || 'AVAILABLE';
    if (targetBedStatus !== 'AVAILABLE') {
      throw new Error(`Bed tujuan ${toBedId} sedang tidak tersedia (${targetBedStatus}).`);
    }

    // Release From-Bed to CLEANING / AVAILABLE
    this.bedRegistry.set(fromBedId, { status: 'CLEANING', patientId: null, encounterId: null });

    // Occupy New Bed
    this.bedRegistry.set(toBedId, { status: 'OCCUPIED', patientId: activeOccupancy.patientId, encounterId });

    activeOccupancy.bedId = toBedId;
    activeOccupancy.wardName = targetWardName;
    activeOccupancy.lastTransferredAt = new Date().toISOString();

    return {
      success: true,
      event: ADT_EVENT_TYPES.TRANSFER,
      transferLog: {
        fromBedId,
        toBedId,
        targetWardName,
        transferReason,
        transferredBy,
        timestamp: new Date().toISOString()
      },
      currentOccupancy: activeOccupancy,
      message: `Pasien berhasil di-TRANSFER dari ${fromBedId} ke ${toBedId} (${targetWardName}).`
    };
  }

  /**
   * 3. DISCHARGE PATIENT (HL7 A03)
   */
  dischargePatient({ encounterId, dischargeType = 'PULANG_SEMBUH', dischargeDoctorName }) {
    const activeOccupancy = this.activeOccupancies.get(encounterId);
    if (!activeOccupancy) {
      throw new Error(`Encounter ${encounterId} tidak ditemukan dalam daftar rawat inap aktif.`);
    }

    // Release Bed to CLEANING
    this.bedRegistry.set(activeOccupancy.bedId, { status: 'CLEANING', patientId: null, encounterId: null });
    activeOccupancy.status = 'DISCHARGED';
    activeOccupancy.checkOutTime = new Date().toISOString();
    activeOccupancy.dischargeType = dischargeType;

    this.activeOccupancies.delete(encounterId);

    return {
      success: true,
      event: ADT_EVENT_TYPES.DISCHARGE,
      dischargedBedId: activeOccupancy.bedId,
      dischargeSummary: {
        encounterId,
        dischargeType,
        dischargeDoctorName,
        checkOutTime: activeOccupancy.checkOutTime
      },
      message: `Pasien berhasil di-DISCHARGE. Bed ${activeOccupancy.bedId} dialihkan ke status CLEANING.`
    };
  }

  getBedStatus(bedId) {
    return this.bedRegistry.get(bedId) || { status: 'AVAILABLE' };
  }
}

export const adtEngineService = new AdtEngineService();
