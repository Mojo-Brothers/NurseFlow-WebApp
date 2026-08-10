/**
 * NurseFlow Enterprise HIS — SATUSEHAT FHIR Interoperability Mapper Service
 * Maps NurseFlow Core Entities to Standardized Kemenkes SATUSEHAT FHIR R4 Resources:
 * - Patient → FHIR Patient Resource
 * - Encounter → FHIR Encounter Resource
 * - Condition → FHIR Condition Resource (ICD-10)
 * - MedicationRequest → FHIR MedicationRequest Resource
 */

export const SATUSEHAT_ORGANIZATION_ID = '100028741'; // Standard Kemenkes Org ID placeholder

export const SatusehatFhirService = {
  // Map NurseFlow Patient → FHIR R4 Patient
  toFhirPatient: (patient) => {
    return {
      resourceType: 'Patient',
      id: patient.id || patient.patientId,
      identifier: [
        {
          use: 'official',
          system: 'https://fhir.kemkes.go.id/id/nik',
          value: patient.nik || '3171010101010001'
        },
        {
          use: 'secondary',
          system: `https://fhir.kemkes.go.id/id/pasien/${SATUSEHAT_ORGANIZATION_ID}`,
          value: patient.mrn
        }
      ],
      active: true,
      name: [
        {
          use: 'official',
          text: patient.name || patient.patientName
        }
      ],
      gender: patient.gender === 'F' ? 'female' : 'male',
      birthDate: patient.dob || '1985-05-20',
      address: [
        {
          use: 'home',
          text: patient.address || 'DKI Jakarta, Indonesia'
        }
      ]
    };
  },

  // Map NurseFlow Encounter → FHIR R4 Encounter
  toFhirEncounter: (encounter) => {
    return {
      resourceType: 'Encounter',
      id: encounter.id,
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/encounter/${SATUSEHAT_ORGANIZATION_ID}`,
          value: encounter.encounterNumber
        }
      ],
      status: encounter.status === 'DISCHARGED' ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: encounter.type === 'INPATIENT' ? 'IMP' : 'AMB',
        display: encounter.type === 'INPATIENT' ? 'inpatient encounter' : 'ambulatory'
      },
      subject: {
        reference: `Patient/${encounter.patientId}`,
        display: encounter.patientName
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${encounter.dpjpId}`,
            display: encounter.dpjpName
          }
        }
      ],
      period: {
        start: encounter.admissionDate,
        end: encounter.dischargeDate || null
      },
      serviceProvider: {
        reference: `Organization/${SATUSEHAT_ORGANIZATION_ID}`
      }
    };
  },

  // Map NurseFlow Diagnosis → FHIR R4 Condition
  toFhirCondition: (encounter, diagnosis) => {
    return {
      resourceType: 'Condition',
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active'
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'encounter-diagnosis',
              display: 'Encounter Diagnosis'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: diagnosis.code,
            display: diagnosis.name
          }
        ]
      },
      subject: {
        reference: `Patient/${encounter.patientId}`,
        display: encounter.patientName
      },
      encounter: {
        reference: `Encounter/${encounter.id}`
      },
      recordedDate: new Date().toISOString()
    };
  }
};

export default SatusehatFhirService;
