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
    const sampleCareTeam = {
      id: 'CT-2026-0810-001',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      episodeId: 'EPI-2026-0810-001',
      encounterId: 'ENC-2026-0810-001',
      status: 'ACTIVE',
      members: [
        { practitionerId: 'EMP-2026-0001', name: 'dr. Surya Johnson, Sp.PD-KGEH', role: CARE_TEAM_ROLES.DPJP, assignedAt: '2026-08-01T08:00:00Z', isLead: true },
        { practitionerId: 'EMP-2026-0002', name: 'dr. Anisa Rahma, Sp.JP', role: CARE_TEAM_ROLES.CONSULTING_PHYSICIAN, assignedAt: '2026-08-01T09:00:00Z', isLead: false },
        { practitionerId: 'EMP-2026-0101', name: 'Ns. Ratna Sari, S.Kep', role: CARE_TEAM_ROLES.PRIMARY_NURSE, assignedAt: '2026-08-01T08:00:00Z', isLead: false },
        { practitionerId: 'EMP-2026-0201', name: 'apt. Budi Santoso, S.Farm', role: CARE_TEAM_ROLES.CLINICAL_PHARMACIST, assignedAt: '2026-08-01T08:30:00Z', isLead: false }
      ],
      created_at: '2026-08-01T08:00:00Z'
    };

    this.careTeams.set(sampleCareTeam.id, sampleCareTeam);
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
