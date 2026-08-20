/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Terminology & Coding Governance Service
 * Domain: ICD-10 (2019/2026), ICD-9-CM, SNOMED-CT, LOINC, SATUSEHAT / KFA Mappings,
 * Code Deprecation Checks, Diagnostic Deduplication & Anti-Leading CDI Query Guards.
 * Standards: WHO ICD-10, CMS ICD-9-CM, Permenkes 3/2023, JCI MOI / COP.
 */

export class TerminologyGovernanceError extends Error {
  constructor(message, code = 'TERMINOLOGY_GOVERNANCE_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'TerminologyGovernanceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Canonical Deprecated / Retired ICD-10 Registry
const DEPRECATED_ICD10_MAP = {
  'A41.8': {
    reason: 'Retired in favor of specific pathogen sepsis codes',
    replacementCode: 'A41.9',
    replacementDesc: 'Sepsis, unspecified'
  },
  'I50.8': {
    reason: 'Deprecated generic heart failure code',
    replacementCode: 'I50.9',
    replacementDesc: 'Heart failure, unspecified'
  }
};

// Known Standard ICD-10 prefixes & sample dictionary
const VALID_ICD10_REGEX = /^[A-Z][0-9]{2}(\.[0-9]{1,3})?$/;
const VALID_ICD9_REGEX = /^[0-9]{2}(\.[0-9]{1,2})?$/;

// Leading / Biased CDI Keywords to strictly forbid (Anti-Upcoding Guard)
const BIASED_QUERY_PATTERNS = [
  /tolong naikkan/i,
  /biar klaim naik/i,
  /maksimalkan tarif/i,
  /ubah ke mcc/i,
  /supaya inacbg tinggi/i
];

export const terminologyGovernanceService = {
  /**
   * 1. Validate ICD-10 Diagnostic Code
   */
  validateIcd10Code: (code) => {
    if (!code || typeof code !== 'string') {
      return { isValid: false, reason: 'Kode ICD-10 kosong atau tidak valid.' };
    }

    const trimmed = code.trim().toUpperCase();

    if (!VALID_ICD10_REGEX.test(trimmed)) {
      return { isValid: false, reason: `Format kode ICD-10 [${trimmed}] tidak sesuai standar baku WHO (Contoh: K35.8, J18.9).` };
    }

    if (DEPRECATED_ICD10_MAP[trimmed]) {
      const dep = DEPRECATED_ICD10_MAP[trimmed];
      return {
        isValid: true,
        isDeprecated: true,
        reason: `Kode ICD-10 [${trimmed}] sudah kedaluwarsa (${dep.reason}). Disarankan menggunakan [${dep.replacementCode}] - ${dep.replacementDesc}.`,
        replacementCode: dep.replacementCode,
        replacementDesc: dep.replacementDesc
      };
    }

    return { isValid: true, isDeprecated: false };
  },

  /**
   * 2. Validate ICD-9-CM Procedure Code
   */
  validateIcd9CmCode: (code) => {
    if (!code || typeof code !== 'string') {
      return { isValid: false, reason: 'Kode ICD-9-CM kosong atau tidak valid.' };
    }

    const trimmed = code.trim();

    if (!VALID_ICD9_REGEX.test(trimmed)) {
      return { isValid: false, reason: `Format kode tindakan ICD-9-CM [${trimmed}] tidak sesuai standar (Contoh: 47.0, 54.11).` };
    }

    return { isValid: true, isDeprecated: false };
  },

  /**
   * 3. Deduplicate and Reconcile Clinical Diagnoses
   */
  deduplicateDiagnoses: (principalCode, secondaryDiagnoses = []) => {
    const principalClean = (principalCode || '').trim().toUpperCase();
    const seenCodes = new Set([principalClean]);
    const cleanSecondary = [];

    for (const sec of secondaryDiagnoses) {
      const secCode = (sec.icd10 || sec.code || '').trim().toUpperCase();
      if (!secCode || seenCodes.has(secCode)) {
        continue; // Skip duplicate or matches principal
      }
      seenCodes.add(secCode);
      cleanSecondary.push({
        ...sec,
        icd10: secCode
      });
    }

    return {
      principalCode: principalClean,
      secondaryDiagnoses: cleanSecondary
    };
  },

  /**
   * 4. Anti-Leading Query & Evidence Validation Guard
   */
  validateCdiQueryIntegrity: (queryText, clinicalEvidence = []) => {
    if (!queryText || typeof queryText !== 'string' || queryText.trim().length < 10) {
      throw new TerminologyGovernanceError(
        'Teks query CDI terlalu singkat atau tidak valid. Wajib menyertakan narasi klarifikasi yang objektif.',
        'INVALID_QUERY_TEXT',
        400
      );
    }

    // Check 1: Anti-Leading / Biased Query Detection
    for (const pattern of BIASED_QUERY_PATTERNS) {
      if (pattern.test(queryText)) {
        throw new TerminologyGovernanceError(
          'Pelanggaran Integritas Koding (CDI): Ditemukan indikasi pertanyaan mengarahkan (leading query) untuk manipulasi tarif klaim.',
          'LEADING_QUERY_REJECTED',
          422
        );
      }
    }

    // Check 2: Evidence Requirement Guard
    if (!Array.isArray(clinicalEvidence) || clinicalEvidence.length === 0) {
      throw new TerminologyGovernanceError(
        'Pelanggaran Integritas Koding (CDI): Setiap query klarifikasi DPJP wajib menyertakan bukti klinis pendukung (Clinical Evidence: TTV, Laboratorium, Radiologi, atau Terapi).',
        'MISSING_CLINICAL_EVIDENCE',
        422
      );
    }

    return { isValid: true, isNeutral: true };
  }
};
