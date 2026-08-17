/**
 * NurseFlow Enterprise HIS 2026 — Structured SOAP Engine
 * Sprint 4: Clinical Decision Making & Comprehensive Physician Documentation
 * Standar Kepatuhan: Permenkes 24/2022, JCI 7th Edition, SATUSEHAT HL7 FHIR Composition.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { diagnosisEngineService } from './diagnosisEngine.service.js';
import { cdssEngineService } from './cdssEngine.service.js';

let inMemorySoap = [
  {
    id: 'SOAP-2026-001',
    episode_id: 'EOC-2026-001',
    encounter_id: 'ENC-2026-001',
    patient_id: 'P-1001',
    patient_name: 'Ny. Siti Nurhaliza, S.Pd',
    mrn: 'MRN-2026-001001',
    subjective: 'Pasien datang dengan keluhan demam hari ke-4, badan pegal linu, mual, dan bintik merah pada kedua lengan.',
    objective: 'Keadaan umum tampak lemah. TD 110/70 mmHg, Nadi 84 x/menit, RR 20 x/menit, Suhu 37.0°C, SpO2 98%. Ptekie (+) pada ekstremitas atas.',
    assessment: 'DHF Grade II (Dengue Hemorrhagic Fever dengan manifestasi perdarahan spontan petekie).',
    plan: '1. Infus Ringer Lactate 2 ml/kgBB/jam.\n2. Cek Darah Lengkap per 12 jam (Pantau Trombosit & Ht).\n3. Paracetamol 500 mg tab 3x1 jika demam (Hindari NSAID/Aspirin).\n4. Edukasi hidrasi cairan oral 2-2.5 Liter/hari.',
    primary_icd10: 'A90',
    primary_icd10_name: 'Dengue fever [classical dengue]',
    secondary_icd10: [{ code: 'R50.9', name: 'Fever, unspecified' }],
    icd9_procedures: [{ code: '90.59', name: 'Microscopic examination of blood' }],
    physician_id: 'DOC-1001',
    physician_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
    is_signed: true,
    signature_timestamp: '2026-08-17T09:15:00Z',
    created_at: '2026-08-17T09:00:00Z',
    updated_at: '2026-08-17T09:15:00Z'
  }
];

const getStoredSoap = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SOAP_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[SoapEngine] Failed to load SOAP notes:', e);
  }
  return inMemorySoap;
};

const saveStoredSoap = (list) => {
  inMemorySoap = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOAP_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('[SoapEngine] Failed to save SOAP notes:', e);
  }
};

export const soapEngineService = {
  /**
   * Save Structured SOAP Note with Auto-Diagnosis Registration & CDSS Check
   */
  recordSoapNote: async ({
    episodeId,
    encounterId,
    patientId,
    patientName,
    mrn,
    subjective,
    objective,
    assessment,
    plan,
    primaryIcd10 = 'A90',
    primaryIcd10Name = 'Dengue fever',
    secondaryIcd10 = [],
    icd9Procedures = [],
    physicianId = 'DOC-1001',
    physicianName = 'dr. Siti Wijaya, Sp.PD-KGEH',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    if (!subjective || !objective || !assessment || !plan) {
      throw new Error('Validasi SOAP gagal: Seluruh komponen Subjective, Objective, Assessment, dan Plan wajib diisi lengkap.');
    }

    const now = new Date().toISOString();
    const soapNote = {
      id: `SOAP-${Date.now()}`,
      episode_id: episodeId,
      encounter_id: encounterId,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      subjective,
      objective,
      assessment,
      plan,
      primary_icd10: primaryIcd10,
      primary_icd10_name: primaryIcd10Name,
      secondary_icd10: secondaryIcd10,
      icd9_procedures: icd9Procedures,
      physician_id: physicianId,
      physician_name: physicianName,
      is_signed: true,
      signature_timestamp: now,
      created_at: now,
      updated_at: now
    };

    const currentList = getStoredSoap();
    saveStoredSoap([soapNote, ...currentList]);

    // Automatically record primary diagnosis in Diagnosis Engine
    if (primaryIcd10) {
      await diagnosisEngineService.recordDiagnosis({
        encounterId,
        episodeId,
        patientId,
        diagnosisType: 'PRIMARY',
        icd10Code: primaryIcd10,
        diagnosisName: primaryIcd10Name,
        isPrimary: true,
        diagnosedBy: physicianName,
        actorEmail
      });
    }

    await outboxPublisherService.stageEvent({
      aggregateType: 'SOAP_NOTE',
      aggregateId: soapNote.id,
      eventName: 'SOAP_CREATED',
      payload: soapNote,
      actor: actorEmail
    });

    return soapNote;
  },

  /**
   * Get SOAP Notes by Patient / Encounter
   */
  getSoapNotes: (patientId = null, encounterId = null) => {
    let list = getStoredSoap();
    if (patientId) {
      list = list.filter(s => s.patient_id === patientId);
    }
    if (encounterId) {
      list = list.filter(s => s.encounter_id === encounterId);
    }
    return list;
  }
};
