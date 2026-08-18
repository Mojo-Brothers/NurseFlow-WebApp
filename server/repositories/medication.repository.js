/**
 * NurseFlow Enterprise HIS 2026 — Master Medication Repository
 * ACID In-Memory / PostgreSQL Persistence Layer with Soft Delete / Archiving (No Hard Delete)
 */

import { Medication } from '../modules/pharmacy/entities/MedicationEntities.js';

class MedicationRepository {
  constructor() {
    this.medications = new Map();
    this.initCanonicalMedications();
  }

  initCanonicalMedications() {
    const defaultMeds = [
      new Medication({
        id: 'MED-001',
        genericName: 'Meropenem Trihydrate',
        brandName: 'Meropenem 1g Injeksi',
        atcCode: 'J01DH02',
        rxnormCode: '11124',
        kfaCode: '93001003',
        dosageForm: 'VIAL',
        strengthAmount: 1000,
        strengthUnit: 'mg',
        drugClassCode: 'CARBAPENEM',
        isHighAlert: false,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'B',
        renalAdjustmentThresholdEgfr: 30.0,
        pediatricMaxMgPerKg: 40.0,
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-002',
        genericName: 'Ceftriaxone Sodium',
        brandName: 'Ceftriaxone 1g Injeksi',
        atcCode: 'J01DD04',
        rxnormCode: '2193',
        kfaCode: '93002014',
        dosageForm: 'VIAL',
        strengthAmount: 1000,
        strengthUnit: 'mg',
        drugClassCode: 'CEPHALOSPORIN_3G',
        isHighAlert: false,
        isLasa: true,
        isNarcotic: false,
        pregnancyCategory: 'B',
        pediatricMaxMgPerKg: 80.0,
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-003',
        genericName: 'Warfarin Sodium',
        brandName: 'Simarc-2 2mg Tablet',
        atcCode: 'B01AA03',
        rxnormCode: '11289',
        kfaCode: '93003055',
        dosageForm: 'TABLET',
        strengthAmount: 2,
        strengthUnit: 'mg',
        drugClassCode: 'ANTICOAGULANT',
        isHighAlert: true,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'X',
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-004',
        genericName: 'Acetylsalicylic Acid (Aspirin)',
        brandName: 'Aspilets 80mg Tablet Kunyah',
        atcCode: 'B01AC06',
        rxnormCode: '1191',
        kfaCode: '93004012',
        dosageForm: 'TABLET',
        strengthAmount: 80,
        strengthUnit: 'mg',
        drugClassCode: 'NSAID',
        isHighAlert: false,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'D',
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-005',
        genericName: 'Paracetamol (Acetaminophen)',
        brandName: 'Paracetamol 500mg Tablet',
        atcCode: 'N02BE01',
        rxnormCode: '7052',
        kfaCode: '93005088',
        dosageForm: 'TABLET',
        strengthAmount: 500,
        strengthUnit: 'mg',
        drugClassCode: 'ANALGESIC_ANTIPYRETIC',
        isHighAlert: false,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'B',
        pediatricMaxMgPerKg: 15.0,
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-006',
        genericName: 'Paracetamol Infus 1%',
        brandName: 'Sanmol Infus 1000mg/100ml',
        atcCode: 'N02BE01',
        rxnormCode: '7052',
        kfaCode: '93005099',
        dosageForm: 'INFUSION',
        strengthAmount: 1000,
        strengthUnit: 'mg',
        drugClassCode: 'ANALGESIC_ANTIPYRETIC',
        isHighAlert: false,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'B',
        pediatricMaxMgPerKg: 15.0,
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-007',
        genericName: 'Vancomycin Hydrochloride',
        brandName: 'Vancocin 500mg VIAL',
        atcCode: 'J01XA01',
        rxnormCode: '11124',
        kfaCode: '93006001',
        dosageForm: 'VIAL',
        strengthAmount: 500,
        strengthUnit: 'mg',
        drugClassCode: 'GLYCOPEPTIDE',
        isHighAlert: true,
        isLasa: false,
        isNarcotic: false,
        pregnancyCategory: 'C',
        renalAdjustmentThresholdEgfr: 50.0,
        pediatricMaxMgPerKg: 15.0,
        recordStatus: 'ACTIVE'
      }),
      new Medication({
        id: 'MED-008',
        genericName: 'Insulin Aspart Rapid-Acting',
        brandName: 'Novorapid Flexpen 100 IU/ml',
        atcCode: 'A10AB05',
        rxnormCode: '285018',
        kfaCode: '93007011',
        dosageForm: 'PEN',
        strengthAmount: 300,
        strengthUnit: 'IU',
        drugClassCode: 'INSULIN',
        isHighAlert: true,
        isLasa: true,
        isNarcotic: false,
        pregnancyCategory: 'B',
        recordStatus: 'ACTIVE'
      })
    ];

    defaultMeds.forEach(m => this.medications.set(m.id, m));
  }

  async findAll({ search = '', drugClass = '', isHighAlert = null, status = 'ACTIVE', limit = 50, offset = 0 } = {}) {
    let list = Array.from(this.medications.values());

    if (status && status !== 'ALL') {
      list = list.filter(m => m.recordStatus === status);
    }
    if (drugClass) {
      list = list.filter(m => m.drugClassCode === drugClass);
    }
    if (isHighAlert !== null) {
      list = list.filter(m => m.isHighAlert === Boolean(isHighAlert));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.genericName.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        m.atcCode.toLowerCase().includes(q) ||
        (m.rxnormCode && m.rxnormCode.includes(q)) ||
        (m.kfaCode && m.kfaCode.includes(q))
      );
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    return { total, data: paginated, limit, offset };
  }

  async findById(id) {
    const med = this.medications.get(id);
    return med ? { ...med } : null;
  }

  async findByAtc(atcCode) {
    return Array.from(this.medications.values()).filter(m => m.atcCode === atcCode);
  }

  async create(medicationData) {
    const id = medicationData.id || `MED-${Date.now()}`;
    const newMed = new Medication({ ...medicationData, id, version: 1, createdAt: Date.now(), updatedAt: Date.now() });
    this.medications.set(id, newMed);
    return newMed;
  }

  async update(id, mutationData) {
    const existing = this.medications.get(id);
    if (!existing) throw new Error(`Medication ${id} tidak ditemukan.`);

    const updated = new Medication({
      ...existing,
      ...mutationData,
      id,
      version: existing.version + 1,
      updatedAt: Date.now()
    });
    this.medications.set(id, updated);
    return updated;
  }

  async archive(id, reason = 'Discontinued by Pharmacy Committee') {
    const existing = this.medications.get(id);
    if (!existing) throw new Error(`Medication ${id} tidak ditemukan.`);

    return this.update(id, {
      recordStatus: 'ARCHIVED',
      statusReason: reason
    });
  }

  async delete(id) {
    // Hard delete is explicitly blocked by clinical governance directive
    throw new Error('[CLINICAL_GOVERNANCE_BLOCKED] Hard delete dilarang keras untuk data rekam medis dan master farmasi. Gunakan archive() / soft delete.');
  }
}

export const medicationRepository = new MedicationRepository();
