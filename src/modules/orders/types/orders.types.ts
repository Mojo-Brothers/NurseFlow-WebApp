/**
 * NurseFlow Enterprise HIS 2026 — Universal Order Management, Pharmacy, LIS & RIS/PACS Types
 * Standar Kepatuhan: JCI 7th Edition, KARS 2024, Permenkes 24/2022, SATUSEHAT HL7 FHIR R4, DICOM, LOINC.
 */

export type OrderCategory = 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY' | 'PROCEDURE' | 'DIET';

export type OrderPriority = 'ROUTINE' | 'URGENT' | 'CITO';

export type OrderStatus = 
  | 'DRAFT'
  | 'ORDERED'
  | 'VERIFIED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MedicationOrderStatus = 
  | 'PRESCRIBED'
  | 'REVIEWED_SAFE'
  | 'REVIEWED_FLAGGED'
  | 'DISPENSED'
  | 'ADMINISTERED'
  | 'CANCELLED';

export type LabResultStatus = 
  | 'ORDERED'
  | 'SPECIMEN_COLLECTED'
  | 'SPECIMEN_RECEIVED'
  | 'ANALYZING'
  | 'VALIDATED'
  | 'RELEASED';

export type RadiologyResultStatus = 
  | 'ORDERED'
  | 'SCHEDULED'
  | 'IMAGE_ACQUIRED'
  | 'REPORTED'
  | 'VERIFIED'
  | 'RELEASED';

export interface ClinicalOrder {
  id: string;
  order_number: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  episode_id: string;
  encounter_id: string;
  ordered_by: string;
  order_category: OrderCategory;
  priority: OrderPriority;
  clinical_indication: string;
  status: OrderStatus;
  is_cito: boolean;
  order_items_count: number;
  total_estimated_amount: number;
  history: Array<{ status: OrderStatus; timestamp: string; actor: string; note?: string }>;
  created_at: string;
  updated_at: string;
}

export interface MedicationOrder {
  id: string;
  order_id: string;
  medication_code: string;
  medication_name: string;
  dosage: string;
  route: 'ORAL' | 'IV' | 'IM' | 'SC' | 'TOPICAL' | 'INHALATION' | 'RECTAL';
  frequency: string;
  duration: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_cito: boolean;
  high_alert: boolean;
  lasa_flag: boolean;
  is_antibiotic: boolean;
  review_status: 'PENDING' | 'APPROVED' | 'FLAGGED_OVERRIDDEN';
  verified_by?: string | null;
  dispensed_at?: string | null;
  status: MedicationOrderStatus;
}

export interface LaboratoryOrder {
  id: string;
  order_id: string;
  loinc_code: string;
  test_name: string;
  specimen_type: 'WHOLE_BLOOD' | 'SERUM' | 'PLASMA' | 'URINE' | 'CSF' | 'SWAB' | 'SPUTUM';
  collected_at?: string | null;
  received_at?: string | null;
  validated_at?: string | null;
  released_at?: string | null;
  result_value?: string | number | null;
  unit?: string;
  reference_range?: string;
  is_critical_panic?: boolean;
  delta_check_flag?: boolean;
  analyzer_instrument?: string;
  unit_price: number;
  result_status: LabResultStatus;
}

export interface RadiologyOrder {
  id: string;
  order_id: string;
  modality: 'CT' | 'XR' | 'US' | 'MR' | 'MG';
  examination_name: string;
  dicom_study_uid?: string;
  image_count?: number;
  image_urls?: string[];
  radiologist_report?: string;
  radiologist_name?: string;
  validated_at?: string | null;
  unit_price: number;
  result_status: RadiologyResultStatus;
}
