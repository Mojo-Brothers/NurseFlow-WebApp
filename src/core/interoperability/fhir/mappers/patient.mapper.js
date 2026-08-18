/**
 * FHIR R4 Patient Mapper (Pure Transformation)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapPatient(patient) {
  if (!patient) return null;

  const identifiers = [];

  // NIK
  if (patient.nik) {
    identifiers.push({
      use: 'official',
      system: KEMKES_SYSTEMS.NIK,
      value: String(patient.nik).trim()
    });
  }

  // Hospital MRN
  if (patient.mrn || patient.no_rm) {
    identifiers.push({
      use: 'secondary',
      system: KEMKES_SYSTEMS.PASIEN,
      value: patient.mrn || patient.no_rm
    });
  }

  // IHS Number
  if (patient.ihsNumber) {
    identifiers.push({
      use: 'official',
      system: KEMKES_SYSTEMS.IHS_NUMBER,
      value: patient.ihsNumber
    });
  }

  // BPJS Card Number
  if (patient.bpjsCardNo || patient.no_bpjs) {
    identifiers.push({
      use: 'secondary',
      system: KEMKES_SYSTEMS.BPJS_CARD,
      value: patient.bpjsCardNo || patient.no_bpjs
    });
  }

  const nameText = patient.name || patient.nama || 'Pasien Tanpa Nama';

  return {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      profile: [KEMKES_PROFILES.PATIENT]
    },
    identifier: identifiers.length > 0 ? identifiers : [
      { use: 'secondary', system: KEMKES_SYSTEMS.PASIEN, value: patient.id }
    ],
    active: patient.status !== 'INACTIVE' && patient.status !== 'MERGED',
    name: [
      {
        use: 'official',
        text: nameText
      }
    ],
    gender: (patient.gender || patient.jenis_kelamin || 'M').toUpperCase().startsWith('F') || (patient.gender || '').toLowerCase().includes('perempuan') ? 'female' : 'male',
    birthDate: patient.dob || patient.demographics?.dob || '1990-01-01',
    address: patient.address ? [
      {
        use: 'home',
        text: typeof patient.address === 'string' ? patient.address : patient.address.line || 'Alamat Pasien'
      }
    ] : undefined,
    telecom: patient.phone ? [
      {
        system: 'phone',
        value: patient.phone,
        use: 'mobile'
      }
    ] : undefined
  };
}
