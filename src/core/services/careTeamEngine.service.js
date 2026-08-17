/**
 * NurseFlow Enterprise HIS — Care Team Engine Service
 * Authoritative Multi-Disciplinary Care Team Manager
 * Ties: Patient ↔ EpisodeOfCare ↔ Encounter ↔ Practitioners (DPJP, Nurses, Pharmacists, Case Managers)
 */

export const CARE_TEAM_ROLES = {
  DPJP: 'DPJP',                             // Dokter Penanggung Jawab Pelayanan (Primary Attending)
  CONSULTING_PHYSICIAN: 'CONSULTING_PHYSICIAN', // Dokter Spesialis Konsultan
  PRIMARY_NURSE: 'PRIMARY_NURSE',           // Perawat Primer Bangsal/Poli
  ASSOCIATE_NURSE: 'ASSOCIATE_NURSE',       // Perawat Pelaksana
  CLINICAL_PHARMACIST: 'CLINICAL_PHARMACIST', // Apoteker Klinis
  NUTRITIONIST: 'NUTRITIONIST',             // Ahli Gizi
  CASE_MANAGER: 'CASE_MANAGER'              // Manajer Pelayanan Pasien (MPP)
};

class CareTeamEngine {
  constructor() {
    this.careTeams = new Map();
    this.initializeSampleCareTeams();
  }

  initializeSampleCareTeams() {
    // Clean state on Day-1 Go-Live
  }

  createCareTeam({ patientId, patientName, episodeId, encounterId, dpjpId, dpjpName }) {
    const careTeamId = `CT-${Date.now()}`;
    const newCareTeam = {
      id: careTeamId,
      patientId,
      patientName,
      episodeId: episodeId || null,
      encounterId: encounterId || null,
      status: 'ACTIVE',
      members: [
        {
          practitionerId: dpjpId || 'EMP-2026-0001',
          name: dpjpName || 'dr. Surya Johnson, Sp.PD-KGEH',
          role: CARE_TEAM_ROLES.DPJP,
          assignedAt: new Date().toISOString(),
          isLead: true
        }
      ],
      created_at: new Date().toISOString()
    };

    this.careTeams.set(newCareTeam.id, newCareTeam);
    return newCareTeam;
  }

  addMember(careTeamId, { practitionerId, name, role, isLead = false }) {
    const careTeam = this.careTeams.get(careTeamId);
    if (!careTeam) throw new Error(`CareTeam ${careTeamId} not found`);

    const existingMember = careTeam.members.find(m => m.practitionerId === practitionerId && m.role === role);
    if (!existingMember) {
      careTeam.members.push({
        practitionerId,
        name,
        role,
        assignedAt: new Date().toISOString(),
        isLead
      });
      this.careTeams.set(careTeam.id, careTeam);
    }
    return careTeam;
  }

  getCareTeamByPatient(patientId) {
    return Array.from(this.careTeams.values()).find(ct => ct.patientId === patientId && ct.status === 'ACTIVE') || null;
  }
}

export const careTeamEngine = new CareTeamEngine();
export default careTeamEngine;
