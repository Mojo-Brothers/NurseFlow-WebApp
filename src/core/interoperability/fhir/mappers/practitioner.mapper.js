/**
 * FHIR R4 Master Resource Mappers: Practitioner, Organization, Location (Pure Transformation)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapPractitioner(practitioner) {
  if (!practitioner) return null;

  const identifiers = [];

  if (practitioner.nik) {
    identifiers.push({
      use: 'official',
      system: KEMKES_SYSTEMS.NIK,
      value: String(practitioner.nik).trim()
    });
  }

  if (practitioner.sip) {
    identifiers.push({
      use: 'official',
      system: KEMKES_SYSTEMS.SIP,
      value: String(practitioner.sip).trim()
    });
  }

  if (practitioner.nip) {
    identifiers.push({
      use: 'secondary',
      system: KEMKES_SYSTEMS.NIP,
      value: String(practitioner.nip).trim()
    });
  }

  return {
    resourceType: 'Practitioner',
    id: practitioner.id,
    meta: {
      profile: [KEMKES_PROFILES.PRACTITIONER]
    },
    identifier: identifiers.length > 0 ? identifiers : [
      { use: 'official', system: KEMKES_SYSTEMS.SIP, value: practitioner.id }
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: practitioner.name || practitioner.nama || 'dr. Medis'
      }
    ],
    gender: (practitioner.gender || 'M').toUpperCase().startsWith('F') ? 'female' : 'male'
  };
}

export function mapOrganization(org) {
  const orgId = org?.id || SATUSEHAT_ORGANIZATION_ID;

  return {
    resourceType: 'Organization',
    id: orgId,
    meta: {
      profile: [KEMKES_PROFILES.ORGANIZATION]
    },
    identifier: [
      {
        use: 'official',
        system: KEMKES_SYSTEMS.ORGANIZATION,
        value: orgId
      }
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider'
          }
        ]
      }
    ],
    name: org?.name || 'Rumah Sakit Umum Pusat NurseFlow',
    telecom: [
      {
        system: 'phone',
        value: org?.phone || '021-5551234',
        use: 'work'
      }
    ]
  };
}

export function mapLocation(location) {
  if (!location) return null;

  return {
    resourceType: 'Location',
    id: location.id,
    meta: {
      profile: [KEMKES_PROFILES.LOCATION]
    },
    identifier: [
      {
        system: KEMKES_SYSTEMS.LOCATION,
        value: location.code || location.id
      }
    ],
    status: 'active',
    name: location.name || location.room || 'Bangsal Rawat',
    description: location.description || `Unit ${location.ward || 'Rawat Inap'} Kamar ${location.room || 'Utama'}`,
    mode: 'instance',
    physicalType: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
          code: location.type === 'BED' ? 'bd' : 'ro',
          display: location.type === 'BED' ? 'Bed' : 'Room'
        }
      ]
    },
    managingOrganization: {
      reference: `Organization/${SATUSEHAT_ORGANIZATION_ID}`
    }
  };
}
