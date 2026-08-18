/**
 * FHIR R4 Medication Resource Mappers: MedicationRequest, MedicationDispense, MedicationAdministration
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapMedicationRequest(order) {
  if (!order) return null;

  return {
    resourceType: 'MedicationRequest',
    id: order.id || order.orderId,
    meta: {
      profile: [KEMKES_PROFILES.MEDICATION_REQUEST]
    },
    identifier: [
      {
        system: KEMKES_SYSTEMS.PRESCRIPTION,
        value: order.orderNumber || order.id || order.orderId
      }
    ],
    status: order.status === 'CANCELLED' ? 'cancelled' : (order.status === 'DISCONTINUED' ? 'stopped' : 'active'),
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
            code: 'inpatient',
            display: 'Inpatient'
          }
        ]
      }
    ],
    medicationCodeableConcept: {
      coding: [
        {
          system: KEMKES_SYSTEMS.KFA,
          code: order.kfaCode || order.medicationCode || '93000101',
          display: order.drugName || order.medicationName || 'Ceftriaxone 1g Serbuk Injeksi'
        }
      ],
      text: order.drugName || order.medicationName
    },
    subject: {
      reference: `Patient/${order.patientId || order.patient_id}`,
      display: order.patientName || 'Pasien'
    },
    encounter: order.encounterId ? {
      reference: `Encounter/${order.encounterId}`
    } : undefined,
    authoredOn: order.prescribedAt || order.created_at || new Date().toISOString(),
    requester: {
      reference: `Practitioner/${order.prescriberId || order.doctorId || 'DOC-01'}`,
      display: order.prescriberName || order.doctorName || 'dr. DPJP'
    },
    dosageInstruction: [
      {
        text: `${order.dosage || '1g'} ${order.route || 'IV'} ${order.frequency || '1x sehari'}`,
        timing: {
          code: {
            text: order.frequency || 'QD'
          }
        },
        route: {
          coding: [
            {
              system: 'http://standardterms.edqm.eu',
              code: (order.route || 'IV').toUpperCase() === 'IV' ? '20045000' : '20053000',
              display: order.route || 'Intravenous'
            }
          ]
        }
      }
    ]
  };
}

export function mapMedicationDispense(dispense) {
  if (!dispense) return null;

  return {
    resourceType: 'MedicationDispense',
    id: dispense.id || `DISP-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.MEDICATION_DISPENSE]
    },
    identifier: [
      {
        system: KEMKES_SYSTEMS.DISPENSE,
        value: dispense.dispenseNumber || dispense.id
      }
    ],
    status: 'completed',
    medicationCodeableConcept: {
      coding: [
        {
          system: KEMKES_SYSTEMS.KFA,
          code: dispense.kfaCode || '93000101',
          display: dispense.drugName || 'Obat Siap Diberikan'
        }
      ],
      text: dispense.drugName
    },
    subject: {
      reference: `Patient/${dispense.patientId}`,
      display: dispense.patientName || 'Pasien'
    },
    authorizingPrescription: [
      {
        reference: `MedicationRequest/${dispense.orderId}`
      }
    ],
    performer: [
      {
        actor: {
          reference: `Practitioner/${dispense.dispenserId || 'PHARM-01'}`,
          display: dispense.dispenserName || 'Apoteker Farmasi'
        }
      }
    ],
    quantity: {
      value: Number(dispense.quantity || 1),
      unit: dispense.unit || 'Vial'
    },
    whenHandedOver: dispense.dispensedAt || new Date().toISOString()
  };
}

export function mapMedicationAdministration(admin) {
  if (!admin) return null;

  return {
    resourceType: 'MedicationAdministration',
    id: admin.id || `ADM-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.MEDICATION_ADMINISTRATION]
    },
    identifier: [
      {
        system: KEMKES_SYSTEMS.ADMINISTRATION,
        value: admin.id
      }
    ],
    status: admin.action === 'ADMINISTER' || admin.status === 'ADMINISTERED' ? 'completed' : 'not-done',
    medicationCodeableConcept: {
      coding: [
        {
          system: KEMKES_SYSTEMS.KFA,
          code: admin.kfaCode || '93000101',
          display: admin.drugName || 'Obat Diberikan'
        }
      ],
      text: admin.drugName
    },
    subject: {
      reference: `Patient/${admin.patientId}`,
      display: admin.patientName || 'Pasien'
    },
    context: admin.encounterId ? {
      reference: `Encounter/${admin.encounterId}`
    } : undefined,
    effectiveDateTime: admin.timestamp || admin.administeredAt || new Date().toISOString(),
    performer: [
      {
        actor: {
          reference: `Practitioner/${admin.actor?.id || admin.administeredByNurseId || 'NURSE-01'}`,
          display: admin.actor?.name || admin.administeredByNurseName || 'Ners Pelaksana'
        }
      }
    ],
    request: admin.orderId ? {
      reference: `MedicationRequest/${admin.orderId}`
    } : undefined
  };
}
