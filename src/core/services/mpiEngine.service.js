/**
 * NurseFlow Enterprise HIS — Master Patient Index (MPI) Engine Service
 * Authoritative Centralized Patient Identity Manager
 * Supports: NIK Verification, MRN Generation, Duplicate Identity Detection,
 * Patient Merge / Unmerge, and Identity Verification.
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';
import { domainEventEngine, DOMAIN_EVENTS } from './domainEventEngine.service.js';
import { clinicalTimelineEngine } from './clinicalTimelineEngine.service.js';

class MPIEngine {
  constructor() {
    this.COLLECTION_NAME = 'patients';
    this.mergeHistory = new Map();
    this.initializeSampleMPI();
  }

  initializeSampleMPI() {
    persistenceAdapter.seedMemoryData(this.COLLECTION_NAME, []);
  }

  async getAllPatients() {
    return await persistenceAdapter.query(this.COLLECTION_NAME);
  }

  // Duplicate Identity Detection Algorithm (Matching NIK or Name + DOB)
  async findPotentialDuplicates({ nik, name, dob }) {
    const allPatients = await this.getAllPatients();
    const matches = [];
    const normalizedName = name ? name.toLowerCase().trim() : '';

    for (const patient of allPatients) {
      if (patient.status === 'MERGED') continue;

      // Exact NIK match -> 100% confidence
      if (nik && patient.nik && String(patient.nik).trim() === String(nik).trim()) {
        matches.push({ patient, confidenceScore: 100, reason: 'EXACT_NIK_MATCH' });
      }
      // Exact Name + DOB match -> 90% confidence
      else if (normalizedName && patient.name && patient.name.toLowerCase().trim() === normalizedName && dob && patient.dob === dob) {
        matches.push({ patient, confidenceScore: 90, reason: 'EXACT_NAME_DOB_MATCH' });
      }
      // Partial Name + DOB match -> 70% confidence
      else if (normalizedName && patient.name && patient.name.toLowerCase().includes(normalizedName) && dob && patient.dob === dob) {
        matches.push({ patient, confidenceScore: 70, reason: 'PARTIAL_NAME_MATCH' });
      }
    }

    return matches;
  }

  // Register New Patient through MPI Gateway
  async registerPatient(patientData, actorName = 'Petugas Admisi') {
    // Check for potential duplicate first
    const duplicates = await this.findPotentialDuplicates(patientData);
    const exactMatch = duplicates.find(d => d.confidenceScore >= 90);
    
    if (exactMatch) {
      throw new Error(`DUPLICATE_PATIENT_DETECTED: Identitas pasien sudah terdaftar dengan No. RM ${exactMatch.patient.mrn} (${exactMatch.patient.name})`);
    }

    const patientId = `P-${Date.now()}`;
    const mrn = patientData.mrn || `MRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPatient = {
      id: patientId,
      mrn,
      nik: patientData.nik || '',
      name: patientData.name,
      dob: patientData.dob,
      gender: patientData.gender || 'M',
      phone: patientData.phone || '',
      email: patientData.email || '',
      address: patientData.address || '',
      emergencyContact: patientData.emergencyContact || null,
      payer: patientData.payer || 'Umum',
      bpjsCardNumber: patientData.bpjsCardNumber || null,
      allergies: patientData.allergies || [],
      status: patientData.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      registered_by: actorName
    };

    const saved = await persistenceAdapter.save(this.COLLECTION_NAME, newPatient.id, newPatient);

    // Domain Event Publication
    domainEventEngine.publish(DOMAIN_EVENTS.PATIENT_REGISTERED, {
      patientId: saved.id,
      mrn: saved.mrn,
      nik: saved.nik,
      name: saved.name
    }, actorName);

    // Clinical Timeline Record
    clinicalTimelineEngine.recordEvent({
      patientId: saved.id,
      encounterId: null,
      type: 'REGISTRATION',
      sourceEntityType: 'Patient',
      sourceEntityId: saved.id,
      title: `Pendaftaran Pasien Baru (${saved.mrn} - ${saved.name})`,
      actor: actorName,
      icon: 'how_to_reg'
    });

    return saved;
  }

  async getPatientById(id) {
    return await persistenceAdapter.findById(this.COLLECTION_NAME, id);
  }

  async getPatientByMRN(mrn) {
    const all = await this.getAllPatients();
    return all.find(p => p.mrn === mrn) || null;
  }

  async getPatientByNIK(nik) {
    const all = await this.getAllPatients();
    return all.find(p => p.nik && String(p.nik).trim() === String(nik).trim()) || null;
  }

  // Merge Patient Records (JCI HIM Standard)
  async mergePatients(primaryPatientId, duplicatePatientId, operator = 'HIM Admin') {
    const primary = await this.getPatientById(primaryPatientId);
    const duplicate = await this.getPatientById(duplicatePatientId);

    if (!primary) throw new Error(`Primary Patient ${primaryPatientId} not found`);
    if (!duplicate) throw new Error(`Duplicate Patient ${duplicatePatientId} not found`);

    duplicate.status = 'MERGED';
    duplicate.mergedIntoId = primary.id;
    duplicate.mergedAt = new Date().toISOString();
    duplicate.mergedBy = operator;

    await persistenceAdapter.save(this.COLLECTION_NAME, duplicate.id, duplicate);

    this.mergeHistory.set(duplicate.id, {
      primaryId: primary.id,
      duplicateId: duplicate.id,
      timestamp: new Date().toISOString(),
      operator
    });

    domainEventEngine.publish(DOMAIN_EVENTS.PATIENT_MERGED, {
      primaryPatientId: primary.id,
      duplicatePatientId: duplicate.id
    }, operator);

    return { primary, duplicate };
  }
}

export const mpiEngine = new MPIEngine();
export default mpiEngine;

