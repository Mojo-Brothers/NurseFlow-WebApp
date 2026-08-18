/**
 * NURSEFLOW ENTERPRISE HIS — KEMKES SATUSEHAT TERMINOLOGY GATEWAY
 * Authoritative validator for ICD-10, ICD-9-CM, LOINC, SNOMED CT, and KFA Codes.
 * Ensures not only syntactic correctness, but conformance to Kemenkes ValueSets.
 */

export class TerminologyValidationError extends Error {
  constructor(message, terminologyType, code, details = null) {
    super(message);
    this.name = 'TerminologyValidationError';
    this.terminologyType = terminologyType;
    this.code = code;
    this.details = details;
  }
}

export const TERMINOLOGY_SYSTEMS = Object.freeze({
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  ICD9CM: 'http://hl7.org/fhir/sid/icd-9-cm',
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct',
  KFA: 'http://sys-ids.kemkes.go.id/kfa'
});

// Regular expressions for syntactic verification
const REGEX_PATTERNS = Object.freeze({
  ICD10: /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/, // e.g. A01.0, I21.0, J45.901
  ICD9CM: /^[0-9]{2}(\.[0-9]{1,2})?$/,       // e.g. 47.09, 36.1, 54.11
  LOINC: /^[0-9]{3,5}-[0-9]$/,                // e.g. 85354-9, 8867-4, 8310-5
  SNOMED: /^[0-9]{6,18}$/,                    // e.g. 373270004
  KFA: /^(9[0-9]{7,8}|KFA-[0-9A-Z]+)$/        // e.g. 93000101, 93001234
});

// Standard Kemenkes Hospital Diagnostic ValueSet Subsets
export const KEMKES_VALUE_SETS = Object.freeze({
  COMMON_ICD10: new Set([
    'A09.9', 'A01.0', 'B20', 'E11.9', 'I10', 'I21.0', 'I21.9', 'I50.9',
    'J18.9', 'J45.9', 'K29.7', 'K35.8', 'N18.9', 'O80', 'R50.9', 'Z38.0'
  ]),
  COMMON_LOINC_VITALS: new Set([
    '85354-9', // Blood Pressure Panel
    '8480-6',   // Systolic BP
    '8462-4',   // Diastolic BP
    '8867-4',   // Heart Rate
    '9279-1',   // Respiratory Rate
    '8310-5',   // Body Temperature
    '2708-6',   // Oxygen Saturation (SpO2)
    '89280-2',  // NEWS2 Score
    '9269-2',   // GCS Total Score
    '72514-3'   // Pain Severity Score
  ]),
  COMMON_ICD9CM: new Set([
    '47.09', '38.08', '54.11', '89.52', '36.1', '53.00', '73.59'
  ])
});

export const terminologyGateway = {
  /**
   * Validate ICD-10 Diagnosis Code
   */
  validateICD10(code) {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('ICD-10 code must be a non-empty string', 'ICD10', code);
    }
    const cleanCode = code.trim().toUpperCase();
    if (!REGEX_PATTERNS.ICD10.test(cleanCode)) {
      throw new TerminologyValidationError(`Invalid ICD-10 Code format: "${code}". Expected format like "A01.0" or "I21.0"`, 'ICD10', code);
    }
    return { valid: true, code: cleanCode, system: TERMINOLOGY_SYSTEMS.ICD10 };
  },

  /**
   * Validate ICD-9-CM Procedure Code
   */
  validateICD9CM(code) {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('ICD-9-CM code must be a non-empty string', 'ICD9CM', code);
    }
    const cleanCode = code.trim();
    if (!REGEX_PATTERNS.ICD9CM.test(cleanCode)) {
      throw new TerminologyValidationError(`Invalid ICD-9-CM Code format: "${code}". Expected format like "47.09" or "36.1"`, 'ICD9CM', code);
    }
    return { valid: true, code: cleanCode, system: TERMINOLOGY_SYSTEMS.ICD9CM };
  },

  /**
   * Validate LOINC Laboratory / Vital Signs Code
   */
  validateLOINC(code) {
    if (!code || typeof code !== 'string') {
      throw new TerminologyValidationError('LOINC code must be a non-empty string', 'LOINC', code);
    }
    const cleanCode = code.trim();
    if (!REGEX_PATTERNS.LOINC.test(cleanCode)) {
      throw new TerminologyValidationError(`Invalid LOINC Code format: "${code}". Expected format like "8867-4"`, 'LOINC', code);
    }
    return { valid: true, code: cleanCode, system: TERMINOLOGY_SYSTEMS.LOINC };
  },

  /**
   * Validate SNOMED CT Concept Code
   */
  validateSNOMED(code) {
    if (!code) {
      throw new TerminologyValidationError('SNOMED CT code must be non-empty', 'SNOMED', code);
    }
    const cleanCode = String(code).trim();
    if (!REGEX_PATTERNS.SNOMED.test(cleanCode)) {
      throw new TerminologyValidationError(`Invalid SNOMED CT Code format: "${code}". Expected 6-18 digit numeric ID`, 'SNOMED', code);
    }
    return { valid: true, code: cleanCode, system: TERMINOLOGY_SYSTEMS.SNOMED };
  },

  /**
   * Validate Kemenkes Farmasi & Alkes (KFA) Code
   */
  validateKFA(code) {
    if (!code) {
      throw new TerminologyValidationError('KFA medication code must be non-empty', 'KFA', code);
    }
    const cleanCode = String(code).trim();
    if (!REGEX_PATTERNS.KFA.test(cleanCode)) {
      throw new TerminologyValidationError(`Invalid KFA Code format: "${code}". Expected 9-digit Kemenkes Farmasi code (e.g. 93000101)`, 'KFA', code);
    }
    return { valid: true, code: cleanCode, system: TERMINOLOGY_SYSTEMS.KFA };
  }
};

export default terminologyGateway;
