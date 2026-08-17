/**
 * NurseFlow Enterprise HIS 2026 — Core EMR & Longitudinal Clinical Types
 * Standar Kepatuhan: JCI 7th Edition, KARS 2024, Permenkes 24/2022, SATUSEHAT HL7 FHIR R4, SNOMED CT, LOINC, ICD-10.
 */

export type ProfessionalType = 
  | 'DOKTER_DPJP'
  | 'DOKTER_JAGA'
  | 'PERAWAT'
  | 'BIDAN'
  | 'APOTEKER_KLINIS'
  | 'DIETISIEN_GIZI'
  | 'FISIOTERAPIS'
  | 'RADIOGRAFER'
  | 'ANALIS_LAB';

export type AllergyType = 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'LATEX' | 'OTHER';

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS_LIFE_THREATENING';

export type CdssAlertSeverity = 'CRITICAL_BLOCK' | 'WARNING_OVERRIDE_REQUIRED' | 'INFO';

export interface SoapNote {
  id: string;
  episode_id: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  subjective: string; // Keluhan utama, RPS, RPD, Riwayat Alergi
  objective: string;  // TTV, Pemeriksaan Fisik terstruktur
  assessment: string; // Analisa Klinis, ICD-10 Primer/Sekunder
  plan: string;       // E-Resep, Order Penunjang, Edukasi, Rencana Kontrol
  primary_icd10: string;
  primary_icd10_name: string;
  secondary_icd10: Array<{ code: string; name: string }>;
  icd9_procedures: Array<{ code: string; name: string }>;
  physician_id: string;
  physician_name: string;
  is_signed: boolean;
  signature_timestamp?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CpptNote {
  id: string;
  episode_id: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  professional_type: ProfessionalType;
  author_id: string;
  author_name: string;
  sbar_situation?: string;
  sbar_background?: string;
  sbar_assessment?: string;
  sbar_recommendation?: string;
  soap_notes?: string;
  instruction_notes?: string;
  dpjp_verified: boolean;
  dpjp_verifier_id?: string | null;
  dpjp_verifier_name?: string | null;
  dpjp_verified_at?: string | null;
  created_at: string;
}

export interface PatientAllergy {
  id: string;
  patient_id: string;
  allergy_type: AllergyType;
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  verification_status: 'CONFIRMED' | 'SUSPECTED' | 'REFUTED';
  recorded_by: string;
  created_at: string;
}

export interface ClinicalObservation {
  id: string;
  encounter_id: string;
  episode_id: string;
  patient_id: string;
  observation_type: 'VITAL_SIGN' | 'LAB_RESULT' | 'ANTHROPOMETRY' | 'PAIN_SCORE' | 'GLUCOSE';
  loinc_code: string;
  loinc_display: string;
  observation_value: string | number;
  unit: string;
  reference_range?: string;
  interpretation?: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_PANIC';
  observed_at: string;
  observer_name: string;
}

export interface ClinicalDiagnosis {
  id: string;
  encounter_id: string;
  episode_id: string;
  patient_id: string;
  diagnosis_type: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL' | 'COMPLICATION';
  icd10_code: string;
  diagnosis_name: string;
  snomed_ct_code?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  diagnosed_by: string;
}

export interface CdssAlert {
  id: string;
  encounter_id: string;
  patient_id: string;
  alert_type: 'DRUG_ALLERGY_CONFLICT' | 'DRUG_DRUG_INTERACTION' | 'RENAL_DOSAGE_ADJUSTMENT' | 'DUPLICATE_THERAPY';
  severity: CdssAlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  is_acknowledged: boolean;
  override_reason?: string;
  created_at: string;
}

export interface CarePlan {
  id: string;
  episode_id: string;
  patient_id: string;
  title: string;
  clinical_goals: string[];
  interventions: Array<{ discipline: ProfessionalType; description: string; status: 'PENDING' | 'COMPLETED' }>;
  target_date: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'DISCONTINUED';
  created_by: string;
  created_at: string;
}
