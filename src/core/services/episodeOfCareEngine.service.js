/**
 * NurseFlow Enterprise HIS — Episode of Care Engine Service
 * Authoritative Care Program Manager
 * Groups multiple Encounters (Outpatient, Inpatient, Lab, Surgery, Follow-up) under one Episode of Care.
 */

export const EPISODE_TYPES = {
  ONCOLOGY: 'ONCOLOGY',               // Perawatan Kanker / Kemoterapi
  CARDIOVASCULAR: 'CARDIOVASCULAR',   // Program Kardiovaskular Kronis
  MATERNITY: 'MATERNITY',             // Program Kehamilan & Persalinan
  CHRONIC_CARE: 'CHRONIC_CARE',       // Diabetes Mellitus / Hipertensi
  SURGICAL_EPISODE: 'SURGICAL_EPISODE', // Paket Tindakan Operasi & Pemulihan
  GENERAL_CARE: 'GENERAL_CARE'        // Perawatan Umum
};

export const EPISODE_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

class EpisodeOfCareEngine {
  constructor() {
    this.episodes = new Map();
    this.initializeSampleEpisodes();
  }

  initializeSampleEpisodes() {
    // Clean state on Day-1 Go-Live
  }

  createEpisode({ patientId, patientName, mrn, type = EPISODE_TYPES.GENERAL_CARE, title, primaryDiagnosis, responsiblePractitionerId, responsiblePractitionerName }) {
    const episodeId = `EPI-${Date.now()}`;
    const newEpisode = {
      id: episodeId,
      patientId,
      patientName,
      mrn,
      type,
      status: EPISODE_STATUS.ACTIVE,
      title: title || `Program Perawatan ${type}`,
      startDate: new Date().toISOString(),
      endDate: null,
      primaryDiagnosis: primaryDiagnosis || 'Z00.0 - General Examination',
      responsiblePractitionerId: responsiblePractitionerId || 'EMP-2026-0001',
      responsiblePractitionerName: responsiblePractitionerName || 'dr. Surya Johnson',
      careTeamId: `CT-${Date.now()}`,
      encounterIds: [],
      created_at: new Date().toISOString()
    };

    this.episodes.set(newEpisode.id, newEpisode);
    return newEpisode;
  }

  getEpisodeById(id) {
    return this.episodes.get(id) || null;
  }

  getEpisodesByPatient(patientId) {
    return Array.from(this.episodes.values()).filter(e => e.patientId === patientId);
  }

  linkEncounterToEpisode(episodeId, encounterId) {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);

    if (!episode.encounterIds.includes(encounterId)) {
      episode.encounterIds.push(encounterId);
      this.episodes.set(episode.id, episode);
    }
    return episode;
  }
}

export const episodeOfCareEngine = new EpisodeOfCareEngine();
export default episodeOfCareEngine;
