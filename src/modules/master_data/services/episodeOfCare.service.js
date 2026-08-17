/**
 * NurseFlow Enterprise HIS 2026 — Episode of Care Service
 * Manages clinical care continuity, parent-child episode hierarchies,
 * and referral tracking across hospital branches.
 */

import { enterpriseAuditEngine } from './enterpriseAuditEngine.service.js';

export const episodeOfCareService = {
  createEpisode: async ({
    patientId,
    episodeType, // 'EMERGENCY', 'AMBULATORY', 'INPATIENT', 'SURGERY', 'ICU'
    attendingPhysicianId,
    parentEpisodeId = null,
    branchId = 'BRN-JKT-PST',
    organizationId = '100028741',
    referralSource = null,
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const episodeNumber = `EP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEpisode = {
      id: `EOC-${Date.now()}`,
      episode_number: episodeNumber,
      patient_id: patientId,
      episode_type: episodeType,
      parent_episode_id: parentEpisodeId,
      branch_id: branchId,
      organization_id: organizationId,
      attending_physician_id: attendingPhysicianId,
      referral_source: referralSource,
      admission_date: now,
      discharge_date: null,
      status: 'ACTIVE',
      created_at: now,
      created_by: actorEmail,
      updated_at: now,
      updated_by: actorEmail,
      is_deleted: false
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'PATIENT',
      entity: 'episodes_of_care',
      entityId: newEpisode.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newEpisode,
      userEmail: actorEmail,
      reason: `Pendaftaran Episode of Care ${episodeNumber} (${episodeType})`
    });

    return newEpisode;
  },

  closeEpisode: async (episodeId, dischargeDispositionId, actorEmail = 'admin@nurseflow.id') => {
    const now = new Date().toISOString();
    const updatePayload = {
      discharge_date: now,
      discharge_disposition_id: dischargeDispositionId,
      status: 'FINISHED',
      updated_at: now,
      updated_by: actorEmail
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'PATIENT',
      entity: 'episodes_of_care',
      entityId: episodeId,
      action: 'CLOSE_EPISODE',
      oldValue: { status: 'ACTIVE' },
      newValue: updatePayload,
      userEmail: actorEmail,
      reason: `Penutupan Episode of Care ${episodeId}`
    });

    return updatePayload;
  }
};
