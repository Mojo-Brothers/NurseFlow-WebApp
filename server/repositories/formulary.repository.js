/**
 * NurseFlow Enterprise HIS 2026 — Hospital Formulary & Stewardship Repository
 * Standards: Permenkes 73/2016, JCI MMU.1
 */

import { HospitalFormulary } from '../modules/pharmacy/entities/MedicationEntities.js';

class FormularyRepository {
  constructor() {
    this.formulary = new Map();
    this.initCanonicalFormulary();
  }

  initCanonicalFormulary() {
    const defaultEntries = [
      new HospitalFormulary({
        id: 'FORM-001',
        organizationId: 'ORG-01',
        drugId: 'MED-001', // Meropenem
        isActive: true,
        formularyTier: 'RESTRICTED_ANTIBIOTIC',
        approvalLevelRequired: 'KFT_APPROVAL_REQUIRED',
        requiresPharmacistApproval: true,
        maxPrescribingDays: 7,
        clinicalStewardshipGuideline: 'Antibiotik lini akhir (Reserve). Wajib hasil kultur resistensi dan otorisasi KFT / Konsultan Penyakit Tropis.'
      }),
      new HospitalFormulary({
        id: 'FORM-002',
        organizationId: 'ORG-01',
        drugId: 'MED-002', // Ceftriaxone
        isActive: true,
        formularyTier: 'FORMULARIUM_RS',
        approvalLevelRequired: 'NONE',
        requiresPharmacistApproval: false,
        maxPrescribingDays: 14,
        clinicalStewardshipGuideline: 'Antibiotik lini pertama / empirik profilaksis bedah.'
      }),
      new HospitalFormulary({
        id: 'FORM-003',
        organizationId: 'ORG-01',
        drugId: 'MED-007', // Vancomycin
        isActive: true,
        formularyTier: 'RESTRICTED_ANTIBIOTIC',
        approvalLevelRequired: 'INFECTIOUS_DISEASE_CONSULTANT',
        requiresPharmacistApproval: true,
        maxPrescribingDays: 10,
        clinicalStewardshipGuideline: 'Terapi terarah untuk infeksi MRSA / Enterococcus resisten dengan pemantauan kadar trough serum.'
      }),
      new HospitalFormulary({
        id: 'FORM-004',
        organizationId: 'ORG-01',
        drugId: 'MED-005', // Paracetamol
        isActive: true,
        formularyTier: 'GENERIK_NASIONAL',
        approvalLevelRequired: 'NONE',
        requiresPharmacistApproval: false,
        maxPrescribingDays: 30
      }),
      new HospitalFormulary({
        id: 'FORM-005',
        organizationId: 'ORG-01',
        drugId: 'MED-009', // Norepinephrine
        isActive: true,
        formularyTier: 'FORMULARIUM_RS',
        approvalLevelRequired: 'DPJP_ONLY',
        restrictedDepartmentId: 'DEPT-ICU',
        requiresPharmacistApproval: false,
        clinicalStewardshipGuideline: 'Hanya boleh diresepkan dan digunakan di ruang perawatan intensif (ICU/ICCU/IGD Resusitasi).'
      })
    ];

    defaultEntries.forEach(f => this.formulary.set(f.id, f));
  }

  async findAll({ organizationId = 'ORG-01', tier = '', status = 'ACTIVE', search = '' } = {}) {
    let list = Array.from(this.formulary.values()).filter(f => f.organizationId === organizationId);

    if (status && status !== 'ALL') {
      list = list.filter(f => f.recordStatus === status);
    }
    if (tier) {
      list = list.filter(f => f.formularyTier === tier);
    }

    return list;
  }

  async findByDrugId(drugId, organizationId = 'ORG-01') {
    return Array.from(this.formulary.values()).find(f =>
      f.organizationId === organizationId && f.drugId === drugId && f.recordStatus === 'ACTIVE'
    ) || null;
  }

  async create(data) {
    const id = data.id || `FORM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry = new HospitalFormulary({
      ...data,
      id,
      version: 1,
      recordStatus: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    this.formulary.set(id, entry);
    return entry;
  }

  async update(id, mutationData) {
    const existing = this.formulary.get(id);
    if (!existing) throw new Error(`Formulary entry ${id} tidak ditemukan.`);

    const updated = new HospitalFormulary({
      ...existing,
      ...mutationData,
      id,
      version: existing.version + 1,
      updatedAt: Date.now()
    });
    this.formulary.set(id, updated);
    return updated;
  }
}

export const formularyRepository = new FormularyRepository();
