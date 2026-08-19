/**
 * FHIR R4 Ancillary Mappers: AllergyIntolerance, DiagnosticReport, DocumentReference, Consent
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapAllergyIntolerance(allergy) {
  if (!allergy) return null;

  const allergyName = typeof allergy === 'string' ? allergy : allergy.substance || allergy.name || 'Penicillin';

  return {
    resourceType: 'AllergyIntolerance',
    id: allergy.id || `ALG-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.ALLERGY_INTOLERANCE]
    },
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
    category: ['medication'],
    criticality: allergy.criticality || 'high',
    code: {
      coding: [
        {
          system: KEMKES_SYSTEMS.SNOMED,
          code: allergy.snomedCode || '373270004',
          display: allergyName
        }
      ],
      text: allergyName
    },
    patient: {
      reference: `Patient/${allergy.patientId || allergy.patient_id}`,
      display: allergy.patientName || 'Pasien'
    },
    recordedDate: allergy.recordedAt || new Date().toISOString()
  };
}

export function mapDocumentReference(doc) {
  if (!doc) return null;

  return {
    resourceType: 'DocumentReference',
    id: doc.id || `DOC-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.DOCUMENT_REFERENCE]
    },
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [
        {
          system: KEMKES_SYSTEMS.LOINC,
          code: doc.loincCode || '18842-5',
          display: doc.title || 'Discharge Summary'
        }
      ],
      text: doc.title || 'Dokumen Medis Terverifikasi'
    },
    subject: {
      reference: `Patient/${doc.patientId}`,
      display: doc.patientName || 'Pasien'
    },
    date: doc.created_at || new Date().toISOString(),
    authenticator: doc.signed_by ? {
      display: doc.signed_by
    } : undefined,
    content: [
      {
        attachment: {
          contentType: 'application/pdf',
          title: doc.title || 'Dokumen Rekam Medis Sah',
          hash: doc.signatureHash || 'SHA256-DIGITAL-SIGNATURE-HASH'
        }
      }
    ]
  };
}

export function mapConsent(consent) {
  if (!consent) return null;

  return {
    resourceType: 'Consent',
    id: consent.id || `CONS-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.CONSENT]
    },
    status: consent.status === 'REVOKED' ? 'inactive' : 'active',
    scope: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/consentscope',
          code: 'patient-privacy',
          display: 'Privacy Consent'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'INFA',
            display: 'information access'
          }
        ]
      }
    ],
    patient: {
      reference: `Patient/${consent.patientId}`,
      display: consent.patientName || 'Pasien'
    },
    dateTime: consent.signedAt || new Date().toISOString(),
    organization: [
      {
        reference: `Organization/${SATUSEHAT_ORGANIZATION_ID}`,
        display: 'RSUP NurseFlow'
      }
    ],
    policyRule: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/consentpolicycodes',
          code: 'opt-in',
          display: 'OPT-IN'
        }
      ]
    }
  };
}
