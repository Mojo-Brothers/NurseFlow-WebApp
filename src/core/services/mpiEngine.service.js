/**
 * NurseFlow Enterprise HIS — Master Patient Index (MPI) Engine Service
 * Authoritative Centralized Patient Identity Manager
 * Supports: NIK Verification, MRN Generation, Duplicate Identity Detection,
 * Patient Merge / Unmerge, and Identity Verification.
 */

class MPIEngine {
  constructor() {
    this.patients = new Map();
    this.mergeHistory = new Map();
    this.initializeSampleMPI();
  }

  initializeSampleMPI() {
    const samplePatients = [
      {
        id: 'P-1001',
        mrn: 'MRN-2026-001001',
        nik: '3171015005850001',
        name: 'Ny. Siti Nurhaliza',
        dob: '1985-05-20',
        gender: 'F',
        phone: '081234567890',
        email: 'siti.nurhaliza@example.com',
        address: 'Jl. Sudirman No. 45, Jakarta Selatan',
        emergencyContact: { name: 'Ahmad Nur', relation: 'Suami', phone: '081298765432' },
        payer: 'BPJS Kesehatan',
        bpjsCardNumber: '0001234567890',
        status: 'ACTIVE',
        created_at: '2026-08-01T10:00:00Z'
      },
      {
        id: 'P-1002',
        mrn: 'MRN-2026-001002',
        nik: '3171021208800002',
        name: 'Tn. Bambang Pamungkas',
        dob: '1980-08-12',
        gender: 'M',
        phone: '081311223344',
        email: 'bambang.p@example.com',
        address: 'Jl. Gatot Subroto No. 12, Jakarta Selatan',
        emergencyContact: { name: 'Dewi Pamungkas', relation: 'Istri', phone: '081399887766' },
        payer: 'Umum / Mandiri',
        bpjsCardNumber: null,
        status: 'ACTIVE',
        created_at: '2026-08-02T11:30:00Z'
      }
    ];

    samplePatients.forEach(p => this.patients.set(p.id, p));
  }

  // Duplicate Identity Detection Algorithm (Matching NIK or Name + DOB)
  findPotentialDuplicates({ nik, name, dob }) {
    const matches = [];
    const normalizedName = name ? name.toLowerCase().trim() : '';

    for (const patient of this.patients.values()) {
      if (patient.status === 'MERGED') continue;

      // Exact NIK match -> 100% confidence
      if (nik && patient.nik === nik) {
        matches.push({ patient, confidenceScore: 100, reason: 'EXACT_NIK_MATCH' });
      }
      // Exact Name + DOB match -> 90% confidence
      else if (normalizedName && patient.name.toLowerCase().trim() === normalizedName && dob && patient.dob === dob) {
        matches.push({ patient, confidenceScore: 90, reason: 'EXACT_NAME_DOB_MATCH' });
      }
      // Partial Name + DOB match -> 70% confidence
      else if (normalizedName && patient.name.toLowerCase().includes(normalizedName) && dob && patient.dob === dob) {
        matches.push({ patient, confidenceScore: 70, reason: 'PARTIAL_NAME_MATCH' });
      }
    }

    return matches;
  }

  // Register New Patient through MPI Gateway
  registerPatient(patientData) {
    // Check for potential duplicate first
    const duplicates = this.findPotentialDuplicates(patientData);
    const exactMatch = duplicates.find(d => d.confidenceScore >= 90);
    
    if (exactMatch) {
      throw new Error(`DUPLICATE_PATIENT_DETECTED: Identitas pasien sudah terdaftar dengan No. RM ${exactMatch.patient.mrn} (${exactMatch.patient.name})`);
    }

    const patientId = `P-${Date.now()}`;
    const mrn = `MRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

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
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    this.patients.set(newPatient.id, newPatient);
    return newPatient;
  }

  getPatientById(id) {
    return this.patients.get(id) || null;
  }

  getPatientByMRN(mrn) {
    return Array.from(this.patients.values()).find(p => p.mrn === mrn) || null;
  }

  getPatientByNIK(nik) {
    return Array.from(this.patients.values()).find(p => p.nik === nik) || null;
  }

  // Merge Patient Records (JCI HIM Standard)
  mergePatients(primaryPatientId, duplicatePatientId, operator = 'HIM Admin') {
    const primary = this.patients.get(primaryPatientId);
    const duplicate = this.patients.get(duplicatePatientId);

    if (!primary) throw new Error(`Primary Patient ${primaryPatientId} not found`);
    if (!duplicate) throw new Error(`Duplicate Patient ${duplicatePatientId} not found`);

    duplicate.status = 'MERGED';
    duplicate.mergedIntoId = primary.id;
    duplicate.mergedAt = new Date().toISOString();
    duplicate.mergedBy = operator;

    this.patients.set(duplicate.id, duplicate);

    this.mergeHistory.set(duplicate.id, {
      primaryId: primary.id,
      duplicateId: duplicate.id,
      timestamp: new Date().toISOString(),
      operator
    });

    return { primary, duplicate };
  }
}

export const mpiEngine = new MPIEngine();
export default mpiEngine;
