/**
 * NurseFlow Enterprise HIS 2026 — Registration Engine
 * Sprint 2: Front Office & Patient Access Aggregate
 * Standar Kepatuhan: JCI 7th Edition (IPSG 1 Two Identifiers), Permenkes 24/2022, BPJS V-Claim 2.0.
 */

import { episodeOfCareEngineService } from '../../clinical_core/services/episodeOfCareEngine.service.js';
import { encounterEngineService } from '../../clinical_core/services/encounterEngine.service.js';
import { outboxPublisherService } from './outboxPublisher.service.js';
import { queueManagementEngineService } from './queueManagementEngine.service.js';

const REGISTRATION_STORAGE_KEY = 'nurseflow_patient_registrations';
const CONSENTS_STORAGE_KEY = 'nurseflow_patient_consents';

const getStoredRegistrations = () => {
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[RegistrationEngine] Failed to load registrations:', e);
  }
  return [
    {
      id: 'REG-2026-001',
      registration_number: 'REG-2026-001001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      mrn: 'MRN-2026-001001',
      nik: '3171055508890001',
      gender: 'FEMALE',
      birth_date: '1989-08-15',
      phone_number: '081234567890',
      episode_id: 'EOC-2026-001',
      encounter_id: 'ENC-2026-001',
      guarantor_id: 'GRN-BPJS',
      guarantor_name: 'BPJS Kesehatan (JKN-PBI)',
      insurance_card_number: '0001234567891',
      sep_number: '0115R0010826V000101',
      department_id: 'CLI-1001',
      department_name: 'Poliklinik Penyakit Dalam',
      doctor_id: 'DOC-1001',
      doctor_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      registration_type: 'RAWAT_JALAN',
      ticket_number: 'A-001',
      consent_signed: true,
      registered_at: '2026-08-17T08:15:00Z',
      registered_by: 'admin@nurseflow.id',
      branch_id: 'BRN-JKT-PST',
      status: 'ACTIVE'
    }
  ];
};

const saveStoredRegistrations = (list) => {
  try {
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[RegistrationEngine] Failed to save registrations:', e);
  }
};

const getStoredConsents = () => {
  try {
    const raw = localStorage.getItem(CONSENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[RegistrationEngine] Failed to load consents:', e);
  }
  return [];
};

const saveStoredConsents = (consents) => {
  try {
    localStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(consents));
  } catch (e) {
    console.warn('[RegistrationEngine] Failed to save consents:', e);
  }
};

export const registrationEngineService = {
  /**
   * Register New Patient & Automatically Initialize General Consent, Episode, Encounter, & Queue Ticket
   */
  registerNewPatient: async ({
    fullName,
    nik,
    gender, // 'MALE' | 'FEMALE'
    birthDate,
    birthPlace,
    phoneNumber,
    address,
    bloodType = 'O+',
    allergies = [],
    guarantorId = 'GRN-PRIBADI',
    guarantorName = 'Umum / Pribadi',
    insuranceCardNumber = '',
    departmentId = 'CLI-1001',
    departmentName = 'Poliklinik Penyakit Dalam',
    doctorId = 'DOC-1001',
    doctorName = 'dr. Siti Wijaya, Sp.PD-KGEH',
    registrationType = 'RAWAT_JALAN', // 'RAWAT_JALAN' | 'IGD' | 'RAWAT_INAP'
    chiefComplaint = 'Konsultasi Rutin Spesialis',
    isPriority = false,
    consentSigner = 'Pasien Sendiri',
    signerRelationship = 'SELF',
    actorEmail = 'admin@nurseflow.id',
    branchId = 'BRN-JKT-PST'
  }) => {
    if (!fullName || !nik || !birthDate || !departmentId || !doctorId) {
      throw new Error('Validasi registrasi gagal: Nama, NIK, Tanggal Lahir, Poli, dan Dokter wajib disertakan.');
    }

    const now = new Date().toISOString();
    const patientId = `P-${Date.now()}`;
    const generatedMrn = `MRN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const regNumber = `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // 1. Audit Check: Create General Consent Record
    const consentId = `CNS-${Date.now()}`;
    const consentRecord = {
      id: consentId,
      patient_id: patientId,
      episode_id: null, // Will bind below
      consent_type: 'GENERAL_CONSENT',
      signed_by: consentSigner || fullName,
      signer_relationship: signerRelationship,
      signed_at: now,
      witness_name: actorEmail,
      document_url: null,
      status: 'ACTIVE'
    };

    // 2. Trigger Sprint 1 Backbone: Create Episode of Care
    const episodeType = registrationType === 'IGD' ? 'EMERGENCY' : registrationType === 'RAWAT_INAP' ? 'INPATIENT' : 'OUTPATIENT';
    const episode = await episodeOfCareEngineService.createEpisode({
      patientId,
      patientName: fullName,
      mrn: generatedMrn,
      episodeType,
      attendingPhysicianId: doctorId,
      attendingPhysicianName: doctorName,
      chiefComplaint,
      branchId,
      actorEmail
    });

    consentRecord.episode_id = episode.id;
    const consents = getStoredConsents();
    saveStoredConsents([consentRecord, ...consents]);

    // 3. Trigger Sprint 1 Backbone: Create Encounter
    const encounterClass = registrationType === 'IGD' ? 'EMER' : registrationType === 'RAWAT_INAP' ? 'IMP' : 'AMB';
    const encounter = await encounterEngineService.createEncounter({
      episodeId: episode.id,
      patientId,
      patientName: fullName,
      mrn: generatedMrn,
      encounterClass,
      practitionerId: doctorId,
      practitionerName: doctorName,
      locationId: departmentId,
      locationName: departmentName,
      actorEmail,
      branchId
    });

    // 4. Trigger Sprint 2 Queue Ticket
    const poolCode = registrationType === 'IGD' ? 'IGD_TRIAGE' : 'POLI_PD';
    const queueTicket = await queueManagementEngineService.generateTicket({
      poolCode,
      patientId,
      patientName: fullName,
      encounterId: encounter.id,
      isPriority,
      branchId
    });

    const registrationRecord = {
      id: `REG-${Date.now()}`,
      registration_number: regNumber,
      patient_id: patientId,
      patient_name: fullName,
      mrn: generatedMrn,
      nik,
      gender,
      birth_date: birthDate,
      birth_place: birthPlace,
      phone_number: phoneNumber,
      address,
      episode_id: episode.id,
      encounter_id: encounter.id,
      guarantor_id: guarantorId,
      guarantor_name: guarantorName,
      insurance_card_number: insuranceCardNumber,
      sep_number: null,
      department_id: departmentId,
      department_name: departmentName,
      doctor_id: doctorId,
      doctor_name: doctorName,
      registration_type: registrationType,
      ticket_number: queueTicket.ticket_number,
      consent_signed: true,
      registered_at: now,
      registered_by: actorEmail,
      branch_id: branchId,
      status: 'ACTIVE'
    };

    const currentList = getStoredRegistrations();
    saveStoredRegistrations([registrationRecord, ...currentList]);

    // Stage Events via Transactional Outbox Pattern
    await outboxPublisherService.stageEvent({
      aggregateType: 'REGISTRATION',
      aggregateId: registrationRecord.id,
      eventName: 'PATIENT_REGISTERED',
      payload: registrationRecord,
      actor: actorEmail,
      branchId
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'PATIENT_CONSENT',
      aggregateId: consentRecord.id,
      eventName: 'CONSENT_SIGNED',
      payload: consentRecord,
      actor: actorEmail,
      branchId
    });

    return {
      registration: registrationRecord,
      consent: consentRecord,
      episode,
      encounter,
      queueTicket
    };
  },

  /**
   * Register Existing Patient by MRN or NIK
   */
  registerExistingPatient: async ({
    patientId,
    patientName,
    mrn,
    nik,
    gender,
    birthDate,
    phoneNumber,
    guarantorId,
    guarantorName,
    insuranceCardNumber,
    departmentId,
    departmentName,
    doctorId,
    doctorName,
    registrationType = 'RAWAT_JALAN',
    chiefComplaint = 'Pemeriksaan Lanjutan',
    isPriority = false,
    actorEmail = 'admin@nurseflow.id',
    branchId = 'BRN-JKT-PST'
  }) => {
    const now = new Date().toISOString();
    const regNumber = `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // 1. Create Episode of Care
    const episodeType = registrationType === 'IGD' ? 'EMERGENCY' : registrationType === 'RAWAT_INAP' ? 'INPATIENT' : 'OUTPATIENT';
    const episode = await episodeOfCareEngineService.createEpisode({
      patientId,
      patientName,
      mrn,
      episodeType,
      attendingPhysicianId: doctorId,
      attendingPhysicianName: doctorName,
      chiefComplaint,
      branchId,
      actorEmail
    });

    // 2. Create Encounter
    const encounterClass = registrationType === 'IGD' ? 'EMER' : registrationType === 'RAWAT_INAP' ? 'IMP' : 'AMB';
    const encounter = await encounterEngineService.createEncounter({
      episodeId: episode.id,
      patientId,
      patientName,
      mrn,
      encounterClass,
      practitionerId: doctorId,
      practitionerName: doctorName,
      locationId: departmentId,
      locationName: departmentName,
      actorEmail,
      branchId
    });

    // 3. Generate Queue Ticket
    const poolCode = registrationType === 'IGD' ? 'IGD_TRIAGE' : 'POLI_PD';
    const queueTicket = await queueManagementEngineService.generateTicket({
      poolCode,
      patientId,
      patientName,
      encounterId: encounter.id,
      isPriority,
      branchId
    });

    const registrationRecord = {
      id: `REG-${Date.now()}`,
      registration_number: regNumber,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      nik,
      gender,
      birth_date: birthDate,
      phone_number: phoneNumber,
      episode_id: episode.id,
      encounter_id: encounter.id,
      guarantor_id: guarantorId,
      guarantor_name: guarantorName,
      insurance_card_number: insuranceCardNumber,
      sep_number: null,
      department_id: departmentId,
      department_name: departmentName,
      doctor_id: doctorId,
      doctor_name: doctorName,
      registration_type: registrationType,
      ticket_number: queueTicket.ticket_number,
      consent_signed: true,
      registered_at: now,
      registered_by: actorEmail,
      branch_id: branchId,
      status: 'ACTIVE'
    };

    const currentList = getStoredRegistrations();
    saveStoredRegistrations([registrationRecord, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'REGISTRATION',
      aggregateId: registrationRecord.id,
      eventName: 'PATIENT_REGISTERED',
      payload: registrationRecord,
      actor: actorEmail,
      branchId
    });

    return {
      registration: registrationRecord,
      episode,
      encounter,
      queueTicket
    };
  },

  /**
   * Record Patient Consent
   */
  recordConsent: async ({ patientId, episodeId, consentType, signedBy, signerRelationship, actorEmail }) => {
    const consent = {
      id: `CNS-${Date.now()}`,
      patient_id: patientId,
      episode_id: episodeId,
      consent_type: consentType,
      signed_by: signedBy,
      signer_relationship: signerRelationship,
      signed_at: new Date().toISOString(),
      witness_name: actorEmail,
      status: 'ACTIVE'
    };
    const list = getStoredConsents();
    saveStoredConsents([consent, ...list]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'PATIENT_CONSENT',
      aggregateId: consent.id,
      eventName: 'CONSENT_SIGNED',
      payload: consent,
      actor: actorEmail
    });

    return consent;
  },

  /**
   * Get Registrations List
   */
  getRegistrations: (filters = {}) => {
    let list = getStoredRegistrations();
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.registration_number.toLowerCase().includes(q) ||
        r.patient_name.toLowerCase().includes(q) ||
        r.mrn.toLowerCase().includes(q) ||
        r.nik.includes(q)
      );
    }
    if (filters.departmentId) {
      list = list.filter(r => r.department_id === filters.departmentId);
    }
    return list;
  },

  /**
   * Get Consents List
   */
  getConsents: (patientId = null) => {
    let list = getStoredConsents();
    if (patientId) {
      list = list.filter(c => c.patient_id === patientId);
    }
    return list;
  }
};
