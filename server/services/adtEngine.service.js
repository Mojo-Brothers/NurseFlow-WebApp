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
    this.bedMap = new Map();
    this.bedMap.set('BED-MELATI-301', { status: 'AVAILABLE', ward: 'Ruang Melati' });
    this.bedMap.set('BED-ICU-001', { status: 'AVAILABLE', ward: 'Ruang ICU' });
  }

  admitPatient({ encounterId, patientId, patientName, targetBedId, admittingDoctorName, wardName = 'Ruang Inap Melati 3A' }) {
    const current = this.bedMap.get(targetBedId) || { status: 'AVAILABLE' };
    if (current.status !== 'AVAILABLE') {
      throw new Error(`Bed ${targetBedId} tidak dapat digunakan. Status saat ini: ${current.status}`);
    }

    this.bedMap.set(targetBedId, {
      status: 'OCCUPIED',
      encounterId,
      patientId,
      patientName,
      wardName,
      admittingDoctorName
    });

    return {
      success: true,
      event: ADT_EVENT_TYPES.ADMIT,
      occupancy: {
        bedId: targetBedId,
        encounterId,
        patientId,
        patientName,
        wardName,
        status: 'OCCUPIED'
      },
      message: `Pasien ${patientName} berhasil di-ADMIT ke Bed ${targetBedId} (${wardName}).`
    };
  }

  transferPatient({ encounterId, fromBedId, toBedId, targetWardName = 'Ruang Inap ICU', transferReason, transferredBy }) {
    this.bedMap.set(fromBedId, { status: 'CLEANING' });
    this.bedMap.set(toBedId, {
      status: 'OCCUPIED',
      encounterId,
      wardName: targetWardName,
      transferredBy
    });

    return {
      success: true,
      event: ADT_EVENT_TYPES.TRANSFER,
      fromBedId,
      toBedId,
      targetWardName,
      message: `Pasien berhasil di-TRANSFER dari ${fromBedId} ke ${toBedId}.`
    };
  }

  dischargePatient({ encounterId, dischargeType = 'PULANG_SEMBUH', dischargeDoctorName }) {
    for (const [bedId, data] of this.bedMap.entries()) {
      if (data.encounterId === encounterId || data.status === 'OCCUPIED') {
        this.bedMap.set(bedId, { status: 'CLEANING' });
      }
    }

    return {
      success: true,
      event: ADT_EVENT_TYPES.DISCHARGE,
      encounterId,
      dischargeType,
      message: `Pasien berhasil di-DISCHARGE.`
    };
  }

  getBedStatus(bedId) {
    return this.bedMap.get(bedId) || { status: 'AVAILABLE' };
  }
}

export const adtEngineService = new AdtEngineService();
