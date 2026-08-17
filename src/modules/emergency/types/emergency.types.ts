/**
 * NurseFlow Enterprise HIS 2026 — Emergency & Triage Types
 * Standar Kepatuhan: ATS (Australasian Triage Scale), ESI v4 (Emergency Severity Index), JCI 7th Edition, KARS 2024.
 */

export type TriageScale = 'ATS' | 'ESI' | 'CTAS';

export type TriagePriorityLevel = 
  | 'P1_RESUSCITATION' // ATS 1 / ESI 1 (Immediate - 0 min) - Red
  | 'P2_EMERGENT'      // ATS 2 / ESI 2 (<= 10 min) - Orange
  | 'P3_URGENT'        // ATS 3 / ESI 3 (<= 30 min) - Yellow
  | 'P4_SEMI_URGENT'   // ATS 4 / ESI 4 (<= 60 min) - Green
  | 'P5_NON_URGENT';   // ATS 5 / ESI 5 (<= 120 min) - Blue

export type EmergencyProtocolCode = 
  | 'STEMI_CODE'
  | 'STROKE_CODE'
  | 'SEPSIS_BUNDLE'
  | 'TRAUMA_ACTIVATION'
  | 'CODE_BLUE_CARDIAC_ARREST';

export interface VitalSigns {
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  gcsTotal: number;
  painScale: number; // 0-10
}

export interface TriageAssessment {
  id: string;
  episode_id: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  triage_method: TriageScale;
  triage_level: TriagePriorityLevel;
  ats_level: number; // 1-5
  esi_level: number; // 1-5
  chief_complaint: string;
  airway_status: 'PATENT' | 'OBSTRUCTED' | 'THREATENED' | 'INTUBATED';
  breathing_status: 'NORMAL' | 'DYSPNEA' | 'APNEA' | 'STRIDOR';
  circulation_status: 'NORMAL' | 'WEAK_PULSE' | 'HEMORRHAGE' | 'SHOCK';
  disability_status: 'ALERT' | 'VOICE_RESPONSIVE' | 'PAIN_RESPONSIVE' | 'UNRESPONSIVE'; // AVPU
  exposure_notes?: string;
  vitals: VitalSigns;
  is_trauma: boolean;
  is_cito: boolean;
  target_response_minutes: number;
  assessed_at: string;
  assessed_by: string;
  branch_id: string;
}

export interface SlaTimer {
  id: string;
  encounter_id: string;
  patient_name: string;
  triage_level: TriagePriorityLevel;
  target_response_minutes: number;
  started_at: string;
  first_physician_contact_at?: string | null;
  completed_at?: string | null;
  elapsed_seconds: number;
  remaining_seconds: number;
  is_overdue: boolean;
  status: 'RUNNING' | 'ATTENDED' | 'COMPLETED' | 'BREACHED';
}

export interface ResuscitationEvent {
  id: string;
  encounter_id: string;
  event_type: 'AIRWAY_INTUBATION' | 'CPR_CYCLE' | 'DEFIBRILLATION' | 'EPINEPHRINE_DOSE' | 'FLUID_BOLUS' | 'BLOOD_TRANSFUSION' | 'ROSC_ACHIEVED';
  event_timestamp: string;
  performer_name: string;
  dose_or_joules?: string;
  notes?: string;
}

export interface EmergencyOrderSet {
  protocol_code: EmergencyProtocolCode;
  protocol_name: string;
  target_golden_period_minutes: number;
  medications: Array<{ medicineCode: string; medicineName: string; dose: string; route: string }>;
  diagnostics: Array<{ testCode: string; testName: string; isCito: boolean; category: 'LAB' | 'RAD' | 'EKG' }>;
  procedures: Array<{ procedureCode: string; procedureName: string }>;
}
