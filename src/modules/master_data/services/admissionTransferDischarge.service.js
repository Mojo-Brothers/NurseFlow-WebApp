/**
 * NurseFlow Enterprise HIS 2026 — Admission, Transfer, Discharge (ADT) Orchestration Service
 * Connects EMR, Bed Management, and Patient Episodes into a seamless hospital journey.
 */

import { enterpriseAuditEngine } from './enterpriseAuditEngine.service.js';

export const admissionTransferDischargeService = {
  admitPatient: async ({
    episodeId,
    patientId,
    admissionType = 'EMERGENCY_ADMISSION',
    assignedBedId,
    admittingDoctorId,
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const admissionNumber = `ADM-${Date.now().toString(36).toUpperCase()}`;

    const admissionRecord = {
      id: `ADM-${Date.now()}`,
      admission_number: admissionNumber,
      episode_id: episodeId,
      patient_id: patientId,
      admission_type: admissionType,
      assigned_bed_id: assignedBedId,
      admitting_doctor_id: admittingDoctorId,
      admitted_at: now,
      created_at: now,
      created_by: actorEmail,
      status: 'ADMITTED',
      is_deleted: false
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'FACILITY',
      entity: 'admissions',
      entityId: admissionRecord.id,
      action: 'PATIENT_ADMITTED',
      oldValue: null,
      newValue: { ...admissionRecord, bed_assigned: assignedBedId },
      userEmail: actorEmail,
      reason: `Admisi Pasien ke Tempat Tidur ${assignedBedId} (${admissionType})`
    });

    return admissionRecord;
  },

  transferPatient: async ({
    episodeId,
    patientId,
    fromBedId,
    toBedId,
    transferReason,
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const transferRecord = {
      id: `TRF-${Date.now()}`,
      episode_id: episodeId,
      patient_id: patientId,
      from_bed_id: fromBedId,
      to_bed_id: toBedId,
      transfer_reason: transferReason,
      transferred_at: now,
      transferred_by: actorEmail,
      created_at: now,
      status: 'COMPLETED',
      is_deleted: false
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'FACILITY',
      entity: 'transfers',
      entityId: transferRecord.id,
      action: 'PATIENT_TRANSFERRED',
      oldValue: { bed_id: fromBedId },
      newValue: { bed_id: toBedId, reason: transferReason },
      userEmail: actorEmail,
      reason: `Mutasi/Transfer Pasien dari Bed ${fromBedId} ke Bed ${toBedId}`
    });

    return transferRecord;
  },

  dischargePatient: async ({
    episodeId,
    patientId,
    occupiedBedId,
    dischargeDispositionId,
    authorizingDoctorId,
    dischargeNotes = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const dischargeRecord = {
      id: `DSC-${Date.now()}`,
      episode_id: episodeId,
      patient_id: patientId,
      bed_released_id: occupiedBedId,
      discharged_at: now,
      discharge_disposition_id: dischargeDispositionId,
      authorizing_doctor_id: authorizingDoctorId,
      notes: dischargeNotes,
      created_at: now,
      created_by: actorEmail,
      status: 'DISCHARGED',
      is_deleted: false
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'FACILITY',
      entity: 'discharges',
      entityId: dischargeRecord.id,
      action: 'PATIENT_DISCHARGED',
      oldValue: { bed_status: 'OCCUPIED' },
      newValue: { bed_status: 'BED_DISINFECTING', discharge_disposition_id: dischargeDispositionId },
      userEmail: actorEmail,
      reason: `Pemulangan/Discharge Pasien dari Bed ${occupiedBedId}`
    });

    return dischargeRecord;
  }
};
