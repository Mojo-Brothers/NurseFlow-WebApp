/**
 * NurseFlow EHIS 2026 - FHIR R4 Domain Types
 * JCI & SATUSEHAT Compliant Models
 */

export interface FHIRReference {
  reference: string; // e.g. "Patient/123"
  display?: string;
}

export interface FHIRCodeableConcept {
  coding: {
    system: string; // e.g. "http://hl7.org/fhir/sid/icd-10"
    code: string;
    display: string;
  }[];
  text?: string;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: {
    use: 'usual' | 'official';
    system: string; // e.g. "https://satusehat.kemkes.go.id/fhir/NamingSystem/nik"
    value: string; // NIK or BPJS number
  }[];
  active: boolean;
  name: {
    use: 'official';
    text: string;
  }[];
  telecom?: {
    system: 'phone' | 'email';
    value: string;
  }[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string; // YYYY-MM-DD
  address?: {
    text: string;
  }[];
  // Internal EHIS Metadata
  _ehis: {
    mrn: string;
    created_at: string;
    updated_at: string;
    created_by: string;
  };
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: 'AMB' | 'EMER' | 'IMP'; // Ambulatory (Rawat Jalan), Emergency (IGD), Inpatient (Rawat Inap)
  };
  subject: FHIRReference; // Patient
  participant?: {
    type?: FHIRCodeableConcept[];
    individual: FHIRReference; // Practitioner (Doctor/Nurse)
  }[];
  period: {
    start: string;
    end?: string;
  };
  location?: {
    location: FHIRReference; // Room/Bed
    status: 'active' | 'completed';
  }[];
  _ehis: {
    triage_priority?: number;
    created_by: string;
  };
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: FHIRCodeableConcept[]; // vital-signs, laboratory, etc.
  code: FHIRCodeableConcept; // LOINC code
  subject: FHIRReference; // Patient
  encounter?: FHIRReference; // Encounter
  effectiveDateTime: string;
  performer?: FHIRReference[]; // Practitioner
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  _ehis: {
    created_by: string;
  };
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: FHIRCodeableConcept; // active, recurrence, relapse, inactive, remission, resolved
  code: FHIRCodeableConcept; // ICD-10 code
  subject: FHIRReference; // Patient
  encounter?: FHIRReference; // Encounter
  onsetDateTime?: string;
  recorder?: FHIRReference; // Practitioner
  _ehis: {
    created_by: string;
  };
}

export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  medicationCodeableConcept: FHIRCodeableConcept; // KFA Code
  subject: FHIRReference; // Patient
  encounter?: FHIRReference; // Encounter
  authoredOn: string;
  requester: FHIRReference; // Practitioner (Doctor)
  dosageInstruction?: {
    text: string;
    timing?: {
      repeat: {
        frequency: number;
        period: number;
        periodUnit: 'd' | 'h';
      }
    }
  }[];
  _ehis: {
    dispense_status: 'PENDING' | 'VERIFIED' | 'DISPENSED';
    dispensed_by?: string;
    created_by: string;
  };
}
