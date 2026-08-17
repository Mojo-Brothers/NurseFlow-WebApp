/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Practitioner Resource Mapper
 * Standar: HL7 FHIR R4 Practitioner Profile & SATUSEHAT Specification
 */

export const mapToFhirPractitioner = (practitioner) => {
  return {
    resourceType: 'Practitioner',
    id: practitioner.ihsNumber || practitioner.id,
    identifier: [
      {
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/nik',
        value: practitioner.nik || '3171000000000001'
      },
      ...(practitioner.sipNumber ? [{
        use: 'secondary',
        system: 'https://fhir.kemkes.go.id/id/sip',
        value: practitioner.sipNumber
      }] : []),
      ...(practitioner.strNumber ? [{
        use: 'secondary',
        system: 'https://fhir.kemkes.go.id/id/str',
        value: practitioner.strNumber
      }] : [])
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: practitioner.fullName
      }
    ],
    gender: (practitioner.gender || '').toLowerCase() === 'female' ? 'female' : 'male'
  };
};
