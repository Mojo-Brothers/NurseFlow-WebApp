/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Repository
 */

import { BaseRepository } from './baseRepository.js';

const PATIENT_SEED = [];

class PatientRepository extends BaseRepository {
  constructor() {
    super('nurseflow_master_patients', PATIENT_SEED);
  }

  async findByMrn(mrn) {
    const list = this.loadAll();
    return list.find(p => p.mrn === mrn) || null;
  }

  async findByNik(nik) {
    const list = this.loadAll();
    return list.find(p => p.nik === nik) || null;
  }

  async findByBpjs(bpjsNo) {
    const list = this.loadAll();
    return list.find(p => p.bpjs_card_number === bpjsNo) || null;
  }
}

export const patientRepository = new PatientRepository();
