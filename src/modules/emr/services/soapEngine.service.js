/**
 * NurseFlow Enterprise HIS 2026 — Structured SOAP Engine (PostgreSQL 16 Authoritative)
 * Standards: Permenkes 24/2022, JCI 7th Edition, SATUSEHAT HL7 FHIR Composition, RFC 7807
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';
import { diagnosisEngineService } from './diagnosisEngine.service.js';

export const soapEngineService = {
  /**
   * Save Structured SOAP Note directly to PostgreSQL 16
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
    physicianName = 'dr. Siti Wijaya, Sp.PD',
    actorEmail = 'admin@nurseflow.id',
    expectedVersion = 1
  }) => {
    if (!subjective || !objective || !assessment || !plan) {
      throw new Error('Validasi SOAP gagal: Seluruh komponen Subjective, Objective, Assessment, dan Plan wajib diisi lengkap.');
    }

    const payload = {
      episodeId,
      encounterId,
      patientId,
      patientName,
      mrn,
      subjective,
      objective,
      assessment,
      plan,
      primaryIcd10,
      primaryIcd10Name,
      secondaryDiagnoses: secondaryIcd10,
      proceduresIcd9: icd9Procedures,
      physicianId,
      physicianName,
      expectedVersion
    };

    const res = await apiClient.clinicalNotes.saveSoap(payload);
    if (!res.ok) {
      if (res.isConcurrentConflict || res.status === 409) {
        const conflictErr = new Error(res.error || 'Konflik Konkurensi: Catatan medis telah dimodifikasi oleh dokter lain.');
        conflictErr.isConcurrentConflict = true;
        conflictErr.code = 'CONCURRENT_MODIFICATION';
        throw conflictErr;
      }
      throw new Error(res.error || 'Gagal menyimpan catatan SOAP di PostgreSQL');
    }

    return res.data;
  },

  /**
   * Get SOAP Notes by Encounter ID directly from PostgreSQL
   */
  getSoapNotesByEncounter: async (encounterId) => {
    try {
      const res = await requestApi(`/api/v1/clinical-notes/soap/encounter/${encounterId}`);
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[SoapEngine] Failed to fetch SOAP notes:', err);
      return [];
    }
  }
};
