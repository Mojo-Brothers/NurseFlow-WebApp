/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Repository
 */

import { BaseRepository } from './baseRepository.js';

const PATIENT_SEED = [
  {
    id: 'P-1001',
    mrn: 'MRN-2026-001001',
    nik: '3171055508890001',
    full_name: 'Ny. Siti Nurhaliza, S.Pd',
    birth_date: '1989-08-15',
    gender: 'FEMALE',
    phone_number: '081299887766',
    address_line: 'Jl. Merdeka No. 45, Jakarta Pusat',
    guarantor_type: 'BPJS',
    bpjs_card_number: '0001234567891',
    is_active: true
  }
];

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
