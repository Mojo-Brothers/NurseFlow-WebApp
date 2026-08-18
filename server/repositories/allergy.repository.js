/**
 * NurseFlow Enterprise HIS 2026 — Patient Allergy Repository (SCD Type-2)
 * Standards: JCI IPSG 3, FHIR AllergyIntolerance
 */

import { PatientAllergy } from '../modules/pharmacy/entities/MedicationEntities.js';

class PatientAllergyRepository {
  constructor() {
    this.allergies = new Map();
    this.initCanonicalAllergies();
  }

  initCanonicalAllergies() {
    const defaultAllergies = [
      new PatientAllergy({
        id: 'ALLERGY-001',
        organizationId: 'ORG-01',
        patientId: 'P-101',
        allergenType: 'MEDICATION',
        allergenCode: 'PENICILLIN_DERIVATIVE',
        allergenName: 'Penicillin & Aminopenicillins',
        reactionDescription: 'Syok Anafilaktik, Urtikaria Akut, Edema Laring',
        severity: 'SEVERE_ANAPHYLAXIS',
        verificationStatus: 'CONFIRMED',
        recordedByPractitionerId: 'PRAC-DOC-01',
        recordStatus: 'ACTIVE'
      }),
      new PatientAllergy({
        id: 'ALLERGY-002',
        organizationId: 'ORG-01',
        patientId: 'P-102',
        allergenType: 'MEDICATION',
        allergenCode: 'NSAID',
        allergenName: 'Aspirin & Asam Mefenamat',
        reactionDescription: 'Bronkospasme dan ruam makulopapular',
        severity: 'MODERATE',
        verificationStatus: 'CONFIRMED',
        recordedByPractitionerId: 'PRAC-DOC-02',
        recordStatus: 'ACTIVE'
      }),
      new PatientAllergy({
        id: 'ALLERGY-003',
        organizationId: 'ORG-01',
        patientId: 'P-1001',
        allergenType: 'MEDICATION',
        allergenCode: 'CARBAPENEM',
        allergenName: 'Meropenem Trihydrate',
        reactionDescription: 'Angioedema dan pruritus generalisata',
        severity: 'SEVERE_ANAPHYLAXIS',
        verificationStatus: 'CONFIRMED',
        recordedByPractitionerId: 'PRAC-DOC-01',
        recordStatus: 'ACTIVE'
      })
    ];

    defaultAllergies.forEach(a => this.allergies.set(a.id, a));
  }

  async findByPatientId(patientId, status = 'ACTIVE') {
    let list = Array.from(this.allergies.values()).filter(a => a.patientId === patientId);
    if (status && status !== 'ALL') {
      list = list.filter(a => a.recordStatus === status);
    }
    return list;
  }

  async findById(id) {
    const allergy = this.allergies.get(id);
    return allergy ? { ...allergy } : null;
  }

  async create(data) {
    const id = data.id || `ALLERGY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAllergy = new PatientAllergy({
      ...data,
      id,
      version: 1,
      recordStatus: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    this.allergies.set(id, newAllergy);
    return newAllergy;
  }

  async amend(id, mutationData, actorId, reason) {
    const existing = this.allergies.get(id);
    if (!existing) throw new Error(`Patient Allergy ${id} tidak ditemukan.`);

    // 1. Mark existing version as AMENDED
    existing.recordStatus = 'AMENDED';
    existing.statusReason = reason;
    existing.updatedAt = Date.now();

    // 2. Create new active version with parent lineage
    const newId = `ALLERGY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const updated = new PatientAllergy({
      ...existing,
      ...mutationData,
      id: newId,
      parentAllergyId: id,
      version: existing.version + 1,
      recordStatus: 'ACTIVE',
      recordedByPractitionerId: actorId || existing.recordedByPractitionerId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    this.allergies.set(newId, updated);
    return updated;
  }

  async void(id, actorId, reason) {
    const existing = this.allergies.get(id);
    if (!existing) throw new Error(`Patient Allergy ${id} tidak ditemukan.`);

    existing.recordStatus = 'VOIDED';
    existing.statusReason = reason || 'Dibatalkan / Salah Input Data Pasien';
    existing.updatedAt = Date.now();
    return existing;
  }

  async delete(id) {
    throw new Error('[CLINICAL_GOVERNANCE_BLOCKED] Hard delete dilarang keras untuk data alergi pasien. Gunakan void() / soft delete.');
  }
}

export const patientAllergyRepository = new PatientAllergyRepository();
