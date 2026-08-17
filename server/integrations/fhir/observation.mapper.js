/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Observation Resource Mapper (LOINC / Vitals / Lab)
 * Standar: HL7 FHIR R4 Observation Profile & SATUSEHAT Specification
 */

export const mapToFhirObservation = ({
  observationId,
  encounterId,
  ihsNumber,
  loincCode = '718-7',
  loincDisplay = 'Hemoglobin [Mass/volume] in Blood',
  value,
  unit = 'g/dL',
  observedAt = new Date().toISOString(),
  performerIhsNumber = 'N1000001',
  performerName = 'dr. Siti Wijaya, Sp.PD',
  category = 'laboratory' // 'vital-signs' | 'laboratory'
}) => {
  return {
    resourceType: 'Observation',
    id: observationId,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: category,
            display: category === 'vital-signs' ? 'Vital Signs' : 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
          display: loincDisplay
        }
      ]
    },
    subject: {
      reference: `Patient/${ihsNumber}`
    },
    encounter: {
      reference: `Encounter/${encounterId}`
    },
    effectiveDateTime: observedAt,
    issued: observedAt,
    performer: [
      {
        reference: `Practitioner/${performerIhsNumber}`,
        display: performerName
      }
    ],
    valueQuantity: {
      value: typeof value === 'number' ? value : parseFloat(value) || 0,
      unit,
      system: 'http://unitsofmeasure.org',
      code: unit
    }
  };
};
