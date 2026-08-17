/**
 * NurseFlow Enterprise HIS 2026 — Front Office & Patient Access Types
 * Standar Kepatuhan: JCI 7th Edition (IPSG 1), KARS 2024, BPJS V-Claim 2.0, SATUSEHAT HL7 FHIR R4.
 */

export type GenderType = 'MALE' | 'FEMALE';

export type RegistrationType = 'RAWAT_JALAN' | 'IGD' | 'RAWAT_INAP';

export type ConsentType = 
  | 'GENERAL_CONSENT'
  | 'INFORMED_CONSENT'
  | 'SURGERY_CONSENT'
  | 'ANESTHESIA_CONSENT'
  | 'BLOOD_TRANSFUSION_CONSENT'
  | 'FINANCIAL_CONSENT';

export interface PatientRegistration {
  id: string;
  registration_number: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  nik: string;
  gender: GenderType;
  birth_date: string;
  birth_place?: string;
  phone_number: string;
  address?: string;
  episode_id: string;
  encounter_id: string;
  guarantor_id: string;
  guarantor_name: string;
  insurance_card_number?: string;
  sep_number?: string | null;
  department_id: string;
  department_name: string;
  doctor_id: string;
  doctor_name: string;
  registration_type: RegistrationType;
  ticket_number: string;
  consent_signed: boolean;
  registered_at: string;
  registered_by: string;
  branch_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface PatientConsent {
  id: string;
  patient_id: string;
  episode_id: string;
  consent_type: ConsentType;
  signed_by: string;
  signed_at: string;
  signer_relationship: 'SELF' | 'SPOUSE' | 'PARENT' | 'CHILD' | 'LEGAL_GUARDIAN';
  witness_name?: string;
  document_url?: string;
  status: 'ACTIVE' | 'REVOKED';
}

export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'ARCHIVED' | 'SKIPPED';

export interface QueuePool {
  code: string;
  name: string;
  prefix: string;
  currentNumber: number;
}

export interface QueueTicket {
  id: string;
  ticket_number: string;
  pool_code: string;
  pool_name: string;
  patient_id: string;
  patient_name: string;
  encounter_id?: string | null;
  counter_name?: string | null;
  is_priority: boolean;
  priority_reason?: 'GERIATRIC' | 'DISABILITY' | 'PEDIATRIC' | 'EMERGENCY' | 'NONE';
  queue_status: QueueStatus;
  created_at: string;
  called_at?: string | null;
  completed_at?: string | null;
  branch_id: string;
}

export interface BpjsSepRecord {
  id: string;
  sep_number: string;
  registration_id: string;
  patient_id: string;
  patient_name: string;
  bpjs_card_number: string;
  nik: string;
  referral_number?: string;
  referral_origin_faskes?: string;
  treatment_type: '1' | '2'; // 1: Inap, 2: Jalan
  destination_poli_code: string;
  destination_poli_name: string;
  dpjp_bpjs_code: string;
  dpjp_name: string;
  primary_diagnose_icd10: string;
  primary_diagnose_name: string;
  cob_status: boolean;
  katarak_status: boolean;
  emergency_status: boolean;
  created_at: string;
  created_by: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface BpjsTaskLog {
  id: string;
  booking_code: string;
  task_id: number; // 1 to 7
  task_name: string;
  task_description: string;
  task_time_epoch_ms: number;
  task_time_iso: string;
  sync_status: 'SYNCED' | 'PENDING_RETRY' | 'FAILED';
  retry_count: number;
  response_metadata?: any;
  created_at: string;
}

export interface OutboxEvent {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_name: string;
  payload: any;
  published: boolean;
  retry_count: number;
  created_at: string;
  published_at?: string | null;
  error_message?: string | null;
}
