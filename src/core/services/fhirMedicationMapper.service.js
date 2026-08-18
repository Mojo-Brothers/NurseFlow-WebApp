/**
 * ============================================================================
 * SPRINT 3D & 3E: SATUSEHAT HL7 FHIR R4 MEDICATION MAPPER SERVICE
 * 
 * Maps Canonical Hospital Information Models to Standard HL7 FHIR R4:
 * 1. MedicationRequest (Prescription Order)
 * 2. MedicationDispense (Pharmacy Verification & Dispense)
 * 3. MedicationAdministration (Point-of-Care Bedside Barcode Administration)
 * 4. Medication (KFA Master Drug Catalog & Batch/Lot Coding)
 * ============================================================================
 */

export const FHIR_RESOURCE_TYPES = {
  MEDICATION_REQUEST: 'MedicationRequest',
  MEDICATION_DISPENSE: 'MedicationDispense',
  MEDICATION_ADMINISTRATION: 'MedicationAdministration',
  MEDICATION: 'Medication'
};

export const KFA_SYSTEM_URL = 'http://sys-ids.kemkes.go.id/kfa';
export const SATUSEHAT_ORGANIZATION_ID = '10000004'; // Default RSUP Test ID

class FhirMedicationMapperService {
  /**
   * 1. Map Canonical Medication Order to FHIR R4 MedicationRequest
   */
  toFhirMedicationRequest(order) {
    if (!order) return null;

    return {
      resourceType: FHIR_RESOURCE_TYPES.MEDICATION_REQUEST,
      id: order.id,
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/prescription/${SATUSEHAT_ORGANIZATION_ID}`,
          value: order.orderNumber || order.id
        }
      ],
      status: this._mapMedicationRequestStatus(order.status),
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
            system: KFA_SYSTEM_URL,
            code: order.medicationCode || '93000101',
            display: order.medicationName
          }
        ],
        text: order.medicationName
      },
      subject: {
        reference: `Patient/${order.patientId}`,
        display: order.patientName
      },
      encounter: {
        reference: `Encounter/${order.encounterId}`
      },
      authoredOn: order.createdAt || new Date().toISOString(),
      requester: {
        reference: `Practitioner/${order.prescriberId || 'DOC-DEFAULT'}`,
        display: order.prescriberName || 'Dokter Penanggung Jawab'
      },
      dosageInstruction: [
        {
          sequence: 1,
          text: `${order.dose} ${order.doseUnit || 'mg'} via ${order.route || 'Oral'}, ${order.frequency || 'QD'}`,
          timing: {
            code: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
                  code: order.frequency || 'QD'
                }
              ]
            }
          },
          route: {
            coding: [
              {
                system: 'http://www.whocc.no/atc',
                code: order.route || 'Oral',
                display: order.route || 'Oral'
              }
            ]
          },
          doseAndRate: [
            {
              type: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
                    code: 'ordered',
                    display: 'Ordered'
                  }
                ]
              },
              doseQuantity: {
                value: parseFloat(order.dose) || 1,
                unit: order.doseUnit || 'mg',
                system: 'http://unitsofmeasure.org'
              }
            }
          ]
        }
      ],
      dispenseRequest: {
        validityPeriod: {
          start: order.createdAt,
          end: order.updatedAt
        },
        numberOfRepeatsAllowed: 0,
        quantity: {
          value: order.dispenseInfo?.dispensedQty || 1,
          unit: 'unit'
        }
      }
    };
  }

  /**
   * 2. Map Pharmacy Dispense to FHIR R4 MedicationDispense
   */
  toFhirMedicationDispense(order, dispenseInfo = null) {
    const info = dispenseInfo || order.dispenseInfo;
    if (!order || !info) return null;

    return {
      resourceType: FHIR_RESOURCE_TYPES.MEDICATION_DISPENSE,
      id: `DISP-${order.id}`,
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/medicationdispense/${SATUSEHAT_ORGANIZATION_ID}`,
          value: `DISP-NUM-${order.id}`
        }
      ],
      status: 'completed',
      category: {
        coding: [
          {
            system: 'http://terminology.hl7.org/fhir/CodeSystem/medicationdispense-category',
            code: 'inpatient',
            display: 'Inpatient'
          }
        ]
      },
      medicationCodeableConcept: {
        coding: [
          {
            system: KFA_SYSTEM_URL,
            code: order.medicationCode,
            display: order.medicationName
          }
        ]
      },
      subject: {
        reference: `Patient/${order.patientId}`,
        display: order.patientName
      },
      context: {
        reference: `Encounter/${order.encounterId}`
      },
      authorizingPrescription: [
        {
          reference: `MedicationRequest/${order.id}`
        }
      ],
      performer: [
        {
          actor: {
            reference: `Practitioner/${info.pharmacistId || 'PHARM-01'}`,
            display: info.pharmacistName || 'Apoteker Pelaksana'
          }
        }
      ],
      quantity: {
        value: info.dispensedQty || 1,
        unit: 'unit'
      },
      whenHandedOver: info.dispensedAt || new Date().toISOString(),
      dosageInstruction: [
        {
          text: `${order.dose} ${order.doseUnit} via ${order.route}`
        }
      ],
      substitution: {
        wasSubstituted: false
      }
    };
  }

  /**
   * 3. Map Point-of-Care Bedside Administration to FHIR R4 MedicationAdministration
   */
  toFhirMedicationAdministration(order, slot, event = null) {
    if (!order || !slot) return null;

    const isGiven = slot.status === 'ADMINISTERED';

    return {
      resourceType: FHIR_RESOURCE_TYPES.MEDICATION_ADMINISTRATION,
      id: `ADMIN-${slot.slotId}`,
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/medicationadministration/${SATUSEHAT_ORGANIZATION_ID}`,
          value: slot.slotId
        }
      ],
      status: isGiven ? 'completed' : 'not-done',
      statusReason: !isGiven && slot.nonAdministrationReason ? [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/medication-admin-status-reason',
              code: slot.nonAdministrationReason,
              display: slot.nonAdministrationReason
            }
          ]
        }
      ] : undefined,
      category: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/medication-admin-category',
            code: 'inpatient',
            display: 'Inpatient'
          }
        ]
      },
      medicationCodeableConcept: {
        coding: [
          {
            system: KFA_SYSTEM_URL,
            code: order.medicationCode,
            display: order.medicationName
          }
        ]
      },
      subject: {
        reference: `Patient/${order.patientId}`,
        display: order.patientName
      },
      context: {
        reference: `Encounter/${order.encounterId}`
      },
      effectiveDateTime: slot.administeredAt || slot.targetTimestamp,
      performer: [
        {
          actor: {
            reference: `Practitioner/${slot.administeredBy?.id || 'NURSE-01'}`,
            display: slot.administeredBy?.name || 'Perawat Pelaksana'
          }
        }
      ],
      request: {
        reference: `MedicationRequest/${order.id}`
      },
      dosage: {
        text: `${order.dose} ${order.doseUnit}`,
        route: {
          coding: [
            {
              system: 'http://www.whocc.no/atc',
              code: order.route || 'IV',
              display: order.route || 'IV'
            }
          ]
        },
        dose: {
          value: parseFloat(order.dose) || 1,
          unit: order.doseUnit || 'mg'
        }
      }
    };
  }

  /**
   * 4. Map Master Drug to FHIR R4 Medication Resource
   */
  toFhirMedication(drug, batchInfo = null) {
    if (!drug) return null;

    const resource = {
      resourceType: FHIR_RESOURCE_TYPES.MEDICATION,
      id: drug.code || drug.id,
      identifier: [
        {
          system: KFA_SYSTEM_URL,
          value: drug.code || drug.kfaCode
        }
      ],
      code: {
        coding: [
          {
            system: KFA_SYSTEM_URL,
            code: drug.code || drug.kfaCode,
            display: drug.name
          }
        ],
        text: drug.name
      },
      status: 'active',
      form: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
            code: drug.dosageForm || 'VIAL',
            display: drug.dosageForm || 'Vial'
          }
        ]
      }
    };

    if (batchInfo) {
      resource.batch = {
        lotNumber: batchInfo.batchNumber || batchInfo.lotNumber,
        expirationDate: batchInfo.expiryDate
      };
    }

    return resource;
  }

  _mapMedicationRequestStatus(canonicalStatus) {
    switch (canonicalStatus) {
      case 'ORDERED':
      case 'VERIFIED':
      case 'DISPENSED':
        return 'active';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      case 'HOLD':
        return 'on-hold';
      default:
        return 'active';
    }
  }
}

export const fhirMedicationMapperService = new FhirMedicationMapperService();
export default fhirMedicationMapperService;
