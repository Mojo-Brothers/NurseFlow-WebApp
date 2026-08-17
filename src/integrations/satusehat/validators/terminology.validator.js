/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT Clinical Terminology Validator
 * Standards: ICD-10 (WHO), ICD-9-CM, LOINC (Lab/Vitals), KFA (Kamus Farmasi & Alat Kesehatan Kemkes)
 */

export class TerminologyValidationError extends Error {
  constructor(message, invalidCode) {
    super(message);
    this.name = 'TerminologyValidationError';
    this.invalidCode = invalidCode;
    this.statusCode = 422;
  }
}

// Indonesian Ministry of Health Standard Code Systems
export const TERMINOLOGY_SYSTEMS = {
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  ICD9CM: 'http://hl7.org/fhir/sid/icd-9-cm',
  LOINC: 'http://loinc.org',
  KFA: 'http://sys-ids.kemkes.go.id/kfa',
  SNOMED_CT: 'http://snomed.info/sct'
};

export const terminologyValidator = {
  /**
   * Validate ICD-10 Diagnosis code format (e.g., A09.9, I10, J06.9)
   */
  validateIcd10: (code) => {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('Kode ICD-10 wajib diisi', code);
    }
    const regex = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;
    if (!regex.test(code.trim())) {
      throw new TerminologyValidationError(`Format kode ICD-10 '${code}' tidak valid sesuai standar WHO/Kemkes`, code);
    }
    return true;
  },

  /**
   * Validate ICD-9-CM Procedure code format (e.g., 38.08, 47.0, 99.04)
   */
  validateIcd9Cm: (code) => {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('Kode tindakan ICD-9-CM wajib diisi', code);
    }
    const regex = /^[0-9]{2}(\.[0-9]{1,2})?$/;
    if (!regex.test(code.trim())) {
      throw new TerminologyValidationError(`Format kode ICD-9-CM '${code}' tidak valid`, code);
    }
    return true;
  },

  /**
   * Validate LOINC Code for Observations & Vital Signs (e.g., 8867-4, 8480-6, 8462-4)
   */
  validateLoinc: (code) => {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('Kode LOINC wajib diisi', code);
    }
    const regex = /^[0-9]{3,5}-[0-9]$/;
    if (!regex.test(code.trim())) {
      throw new TerminologyValidationError(`Format kode LOINC '${code}' tidak valid`, code);
    }
    return true;
  },

  /**
   * Validate KFA Code for Medication (e.g., 93000001, 93001245)
   */
  validateKfa: (code) => {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('Kode KFA obat wajib diisi', code);
    }
    const regex = /^[0-9]{8,10}$/;
    if (!regex.test(code.trim())) {
      throw new TerminologyValidationError(`Format kode KFA '${code}' tidak valid (harus 8-10 digit angka)`, code);
    }
    return true;
  }
};
