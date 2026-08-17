/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 AllergyIntolerance Resource Mapper
 * Standar: HL7 FHIR R4 AllergyIntolerance & SNOMED CT
 */

export const mapToFhirAllergy = ({
  allergyId,
  ihsNumber,
  allergenName,
  snomedCode = '372687004',
  category = 'medication', // 'food' | 'medication' | 'environment'
  criticality = 'high',    // 'low' | 'high' | 'unable-to-assess'
  recordedDate = new Date().toISOString()
}) => {
  return {
    resourceType: 'AllergyIntolerance',
    id: allergyId,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: 'confirmed',
          display: 'Confirmed'
        }
      ]
    },
    category: [category],
    criticality,
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: snomedCode,
          display: allergenName
        }
      ],
      text: allergenName
    },
    patient: {
      reference: `Patient/${ihsNumber}`
    },
    recordedDate
  };
};
