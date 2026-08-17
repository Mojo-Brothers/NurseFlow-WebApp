/**
 * NurseFlow Enterprise HIS 2026 — Structured SOAP Engine
 * Sprint 4: Clinical Decision Making & Comprehensive Physician Documentation
 * Standar Kepatuhan: Permenkes 24/2022, JCI 7th Edition, SATUSEHAT HL7 FHIR Composition.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { diagnosisEngineService } from './diagnosisEngine.service.js';
import { cdssEngineService } from './cdssEngine.service.js';

let inMemorySoap = [];

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
