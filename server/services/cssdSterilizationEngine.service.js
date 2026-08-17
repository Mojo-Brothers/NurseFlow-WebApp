/**
 * NurseFlow Enterprise HIS 2026 — Central Sterile Supply Department (CSSD) Engine
 * Standard: JCI PCI (Infection Prevention & Control: Instrument Tracking, Biological Indicators, Autoclave Traceability)
 */

class CssdSterilizationEngineService {
  constructor() {
    this.cycles = new Map();
    this.sets = new Map();
    this.initDemoCssdData();
  }

  initDemoCssdData() {
    // 1. Sterilization Cycle
    const cycle1 = {
      id: 'CYC-2026-0817-01',
      autoclaveMachineId: 'AUTOCLAVE-STEAM-01 (Getinge HS66)',
      cycleNumber: 'CYC-2026-0817-01',
      sterilizationMethod: 'STEAM_HIGH_PRESSURE',
      temperatureCelsius: 134.0,
      pressureBar: 2.15,
      exposureDurationMinutes: 18,
      biologicalIndicatorStatus: 'PASSED',
      chemicalIntegratorVerified: true,
      operatorTechnicianName: 'Teknisi CSSD Hendro, A.Md.Kes',
      cycleStartedAt: '2026-08-17T06:00:00Z',
      cycleCompletedAt: '2026-08-17T07:15:00Z',
      status: 'RELEASED_FOR_USE'
    };

    this.cycles.set(cycle1.id, cycle1);

    // 2. Instrument Sets
    const set1 = {
      id: 'SET-LAP-001',
      setBarcode: 'SET-LAP-001',
      setName: 'Set Laparoskopi Mayor 4K (Karl Storz)',
      sterilizationCycleId: cycle1.id,
      itemCount: 28,
      sterilizedAt: '2026-08-17T07:15:00Z',
      expiresAt: '2026-09-16T07:15:00Z', // 30 Days Valid
      currentLocation: 'THEATRE_OK_01',
      assignedSurgicalCaseId: 'CASE-SURG-001',
      status: 'IN_USE'
    };

    const set2 = {
      id: 'SET-ORTHO-001',
      setBarcode: 'SET-ORTHO-001',
      setName: 'Set Instrumen Ortopedi ORIF Fraktur (Synthes)',
      sterilizationCycleId: cycle1.id,
      itemCount: 42,
      sterilizedAt: '2026-08-17T07:15:00Z',
      expiresAt: '2026-09-16T07:15:00Z',
      currentLocation: 'CSSD_STERILE_STORAGE',
      assignedSurgicalCaseId: null,
      status: 'STERILE_READY'
    };

    this.sets.set(set1.id, set1);
    this.sets.set(set2.id, set2);
  }

  /**
   * Dispatches sterile instrument set to an active surgical case
   */
  dispatchSetToTheatre(setBarcode, surgicalCaseId, destinationTheatre = 'OK-01') {
    const set = Array.from(this.sets.values()).find(s => s.setBarcode === setBarcode || s.id === setBarcode);
    if (!set) {
      throw new Error(`Instrument set ${setBarcode} tidak ditemukan di CSSD.`);
    }

    if (set.status !== 'STERILE_READY') {
      throw new Error(`Set ${set.setName} tidak dalam kondisi steril siap pakai (Status: ${set.status}).`);
    }

    if (new Date(set.expiresAt).getTime() < Date.now()) {
      set.status = 'EXPIRED';
      throw new Error(`Set ${set.setName} telah kedaluwarsa (${set.expiresAt}) dan harus disterilisasi ulang!`);
    }

    set.assignedSurgicalCaseId = surgicalCaseId;
    set.currentLocation = destinationTheatre;
    set.status = 'IN_USE';

    return set;
  }

  /**
   * Post-operative return for decontamination & reprocessing
   */
  returnSetForDecontamination(setBarcode) {
    const set = Array.from(this.sets.values()).find(s => s.setBarcode === setBarcode || s.id === setBarcode);
    if (!set) {
      throw new Error(`Instrument set ${setBarcode} tidak ditemukan.`);
    }

    set.assignedSurgicalCaseId = null;
    set.currentLocation = 'DECONTAMINATION_WASHING';
    set.status = 'CONTAMINATED_USED';

    return set;
  }

  getAllSets() {
    return Array.from(this.sets.values());
  }

  getAllCycles() {
    return Array.from(this.cycles.values());
  }
}

export const cssdSterilizationEngineService = new CssdSterilizationEngineService();
