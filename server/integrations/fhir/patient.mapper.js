/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Patient Resource Mapper
 * Standar: HL7 FHIR R4 Patient Profile & SATUSEHAT Specification
 */

export const mapToFhirPatient = (patient, orgId = process.env.SATUSEHAT_ORG_ID || '1000001') => {
  return {
    resourceType: 'Patient',
    id: patient.ihsNumber || patient.id,
    identifier: [
      {
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/nik',
        value: patient.nik
      },
      {
        use: 'usual',
        system: `http://sys-ids.kemkes.go.id/mrn/${orgId}`,
        value: patient.mrn
      },
      ...(patient.bpjsCardNumber ? [{
        use: 'secondary',
        system: 'https://fhir.kemkes.go.id/id/bpjs-kartu',
        value: patient.bpjsCardNumber
      }] : [])
    ],
    active: patient.isActive ?? true,
    name: [
      {
        use: 'official',
        text: patient.fullName || patient.full_name
      }
    ],
    telecom: [
      ...(patient.phoneNumber || patient.phone_number ? [{
        system: 'phone',
        value: patient.phoneNumber || patient.phone_number,
        use: 'mobile'
      }] : []),
      ...(patient.email ? [{
        system: 'email',
        value: patient.email,
        use: 'home'
      }] : [])
    ],
    gender: (patient.gender || '').toLowerCase() === 'female' ? 'female' : 'male',
    birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '1990-01-01',
    address: [
      {
        use: 'home',
        line: [patient.addressLine || patient.address_line || 'Alamat tidak dicantumkan'],
        country: 'ID'
      }
    ],
    managingOrganization: {
      reference: `Organization/${orgId}`
    }
  };
};
